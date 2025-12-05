import express from 'express';
import { db } from '../db/connection.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

async function recalcDonationSummary(participantId) {
  if (!participantId) return;
  const totalRow = await db('Donations')
    .where({ ParticipantID: participantId })
    .sum('DonationAmountRaw as total')
    .first();
  const total = totalRow?.total ? parseFloat(totalRow.total) : 0;

  const existing = await db('DonationSummary')
    .where({ ParticipantID: participantId })
    .first();

  if (existing) {
    if (total > 0) {
      await db('DonationSummary')
        .where({ ParticipantID: participantId })
        .update({ TotalDonations: total });
    } else {
      await db('DonationSummary')
        .where({ ParticipantID: participantId })
        .del();
    }
  } else if (total > 0) {
    await db('DonationSummary').insert({
      ParticipantID: participantId,
      TotalDonations: total
    });
  }
}

const DEFAULT_GOAL = 100000;
let inMemoryGoal = DEFAULT_GOAL;

async function getDonationGoalValue() {
  try {
    const row = await db('DonationGoal').first();
    if (row && row.GoalAmount !== undefined && row.GoalAmount !== null) {
      const goalVal = parseFloat(row.GoalAmount) || DEFAULT_GOAL;
      inMemoryGoal = goalVal;
      return goalVal;
    }
  } catch (err) {
    // Table may not exist; fallback to in-memory/default without throwing
    console.warn('DonationGoal table not found; using in-memory goal fallback.');
  }
  return inMemoryGoal || DEFAULT_GOAL;
}

async function setDonationGoalValue(goalAmount) {
  const goal = parseFloat(goalAmount);
  if (isNaN(goal) || goal <= 0) {
    throw new Error('Goal must be a positive number');
  }
  // Upsert single-row table; if table missing, throw so caller can handle
  try {
    const existing = await db('DonationGoal').first();
    if (existing) {
      await db('DonationGoal').update({ GoalAmount: goal });
    } else {
      await db('DonationGoal').insert({ GoalAmount: goal });
    }
    inMemoryGoal = goal;
  } catch (err) {
    console.warn('DonationGoal table not found or write failed; storing goal in memory only.');
    inMemoryGoal = goal;
  }
}

// List all donations (admin only)
router.get('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const donations = await db('Donations as d')
      .leftJoin('Participants as p', 'd.ParticipantID', 'p.ParticipantID')
      .where(function () {
        this.whereNull('p.IsDeleted').orWhere({ 'p.IsDeleted': false });
      })
      .select(
        'd.*',
        'p.ParticipantFirstName',
        'p.ParticipantLastName',
        'p.ParticipantEmail',
        'p.ParticipantRole'
      )
      .orderBy('d.DonationDateRaw', 'desc');
    
    // Mark anonymous donations (from donor role participants)
    const formattedDonations = donations.map(d => ({
      ...d,
      isAnonymous: d.ParticipantRole === 'donor',
      DisplayName: d.ParticipantRole === 'donor' 
        ? 'Anonymous Donor' 
        : `${d.ParticipantFirstName || ''} ${d.ParticipantLastName || ''}`.trim() || 'Unknown'
    }));
    
    res.json(formattedDonations);
  } catch (error) {
    next(error);
  }
});

// Get total donations (public endpoint for goal display)
router.get('/total', async (req, res, next) => {
  try {
    // Sum all donations from DonationSummary table
    const result = await db('DonationSummary')
      .sum('TotalDonations as total')
      .first();
    
    // Handle different database return formats
    let total = 0;
    if (result && result.total !== null && result.total !== undefined) {
      // PostgreSQL returns the sum as a string or number
      if (typeof result.total === 'string') {
        total = parseFloat(result.total);
      } else if (typeof result.total === 'number') {
        total = result.total;
      } else if (typeof result.total === 'object' && result.total !== null) {
        // Sometimes PostgreSQL returns an object, try to extract the value
        const value = result.total.toString();
        total = parseFloat(value) || 0;
      } else {
        total = 0;
      }
      
      if (isNaN(total)) {
        total = 0;
      }
    }
    
    console.log('Donation total fetched - raw result:', result);
    console.log('Donation total fetched - parsed total:', total);
    res.json({ total: Number(total) });
  } catch (error) {
    console.error('Error fetching donation total:', error);
    res.json({ total: 0 });
  }
});

// Get donation summary
router.get('/summary', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const summary = await db('DonationSummary')
      .join('Participants', 'DonationSummary.ParticipantID', 'Participants.ParticipantID')
      .where({ 'Participants.IsDeleted': false })
      .select(
        'DonationSummary.*',
        'Participants.ParticipantFirstName',
        'Participants.ParticipantLastName',
        'Participants.ParticipantEmail',
        'Participants.ParticipantRole'
      )
      .orderBy('DonationSummary.TotalDonations', 'desc');
    
    // Mark anonymous donations (from donor role participants)
    const formattedSummary = summary.map(s => ({
      ...s,
      isAnonymous: s.ParticipantRole === 'donor',
      DisplayName: s.ParticipantRole === 'donor' 
        ? 'Anonymous Donor' 
        : `${s.ParticipantFirstName || ''} ${s.ParticipantLastName || ''}`.trim() || 'Unknown'
    }));
    
    res.json(formattedSummary);
  } catch (error) {
    next(error);
  }
});

// Create donation (participant or admin, or anonymous)
router.post('/', async (req, res, next) => {
  try {
    const { ParticipantID, DonationDateRaw, DonationAmountRaw, Message, Anonymous, DonorEmail } = req.body;

    // Determine participant ID: from body, current user session, or null for anonymous
    const participantId = ParticipantID || req.session.user?.participantId || null;

    if (!DonationAmountRaw) {
      return res.status(400).json({ 
        message: 'DonationAmountRaw is required' 
      });
    }

    // If user is logged in, create donation record and update their summary
    if (participantId) {
      // Get the next donation number for this participant
      const lastDonation = await db('Donations')
        .where({ ParticipantID: participantId })
        .orderBy('DonationNumber', 'desc')
        .first();

      const nextDonationNumber = lastDonation ? lastDonation.DonationNumber + 1 : 1;

      const [donation] = await db('Donations')
        .insert({
          ParticipantID: participantId,
          DonationNumber: nextDonationNumber,
          DonationDateRaw: DonationDateRaw || new Date(),
          DonationAmountRaw,
          Message: Message || null,
          Anonymous: Anonymous || false
        })
        .returning('*');

      // Update or create summary - TotalDonations should reflect sum of all their donations
      await recalcDonationSummary(participantId);

      res.status(201).json(donation);
    } else {
      // Anonymous donation - create a donor participant to track the donation
      // Create a new participant with role="donor" and minimal info
      const [donorParticipant] = await db('Participants')
        .insert({
          ParticipantRole: 'donor',
          ParticipantEmail: DonorEmail || null,
          ParticipantFirstName: null,
          ParticipantLastName: null,
          ParticipantDOB: null,
          ParticipantPhone: null,
          ParticipantCity: null,
          ParticipantState: null,
          ParticipantZip: null,
          ParticipantSchoolOrEmployer: null,
          ParticipantFieldOfInterest: null,
          IsDeleted: false
        })
        .returning('*');

      const donorId = donorParticipant.ParticipantID;

      // Create the donation record
      const [donation] = await db('Donations')
        .insert({
          ParticipantID: donorId,
          DonationNumber: 1,
          DonationDateRaw: DonationDateRaw || new Date(),
          DonationAmountRaw,
          Message: Message || null,
          Anonymous: Anonymous || false
        })
        .returning('*');

      // Create donation summary for this donor
      await db('DonationSummary')
        .insert({
          ParticipantID: donorId,
          TotalDonations: DonationAmountRaw
        });

      res.status(201).json({ 
        message: 'Donation received',
        amount: DonationAmountRaw,
        donationId: donation.DonationID
      });
    }
  } catch (error) {
    next(error);
  }
});

// Update donation (admin only)
router.put('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const donationId = parseInt(req.params.id);
    const { ParticipantID, DonationDateRaw, DonationAmountRaw, Message, Anonymous, DonorEmail } = req.body;

    const existing = await db('Donations').where({ DonationID: donationId }).first();
    if (!existing) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    const oldParticipantId = existing.ParticipantID;
    const updateData = {};
    if (ParticipantID !== undefined) updateData.ParticipantID = ParticipantID || null;
    if (DonationDateRaw !== undefined) updateData.DonationDateRaw = DonationDateRaw || null;
    if (DonationAmountRaw !== undefined) updateData.DonationAmountRaw = DonationAmountRaw;
    if (Message !== undefined) updateData.Message = Message || null;
    if (Anonymous !== undefined) updateData.Anonymous = Anonymous;
    if (DonorEmail !== undefined) updateData.DonorEmail = DonorEmail || null;

    const [updated] = await db('Donations')
      .where({ DonationID: donationId })
      .update(updateData)
      .returning('*');

    // Recalc summaries for old and new participant IDs
    await recalcDonationSummary(oldParticipantId);
    await recalcDonationSummary(updateData.ParticipantID || oldParticipantId);

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Delete donation (admin only)
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const donationId = parseInt(req.params.id);
    const existing = await db('Donations').where({ DonationID: donationId }).first();
    if (!existing) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    await db('Donations').where({ DonationID: donationId }).del();
    await recalcDonationSummary(existing.ParticipantID);

    res.json({ message: 'Donation deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;

