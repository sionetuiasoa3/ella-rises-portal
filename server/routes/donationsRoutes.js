import express from 'express';
import { db } from '../db/connection.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// List all donations (admin only)
router.get('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const donations = await db('Donations')
      .join('Participants', 'Donations.ParticipantID', 'Participants.ParticipantID')
      .where({ 'Participants.IsDeleted': false })
      .select(
        'Donations.*',
        'Participants.ParticipantFirstName',
        'Participants.ParticipantLastName',
        'Participants.ParticipantEmail'
      )
      .orderBy('Donations.DonationDateRaw', 'desc');
    res.json(donations);
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
        'Participants.ParticipantEmail'
      )
      .orderBy('DonationSummary.TotalDonations', 'desc');
    res.json(summary);
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
          DonationAmountRaw
        })
        .returning('*');

      // Update or create summary - TotalDonations should reflect sum of all their donations
      const summary = await db('DonationSummary')
        .where({ ParticipantID: participantId })
        .first();

      if (summary) {
        // Recalculate total from all donations to ensure accuracy
        const allDonations = await db('Donations')
          .where({ ParticipantID: participantId })
          .sum('DonationAmountRaw as total')
          .first();
        
        const newTotal = allDonations?.total ? parseFloat(allDonations.total) : 0;
        
        await db('DonationSummary')
          .where({ ParticipantID: participantId })
          .update({
            TotalDonations: newTotal
          });
      } else {
        await db('DonationSummary')
          .insert({
            ParticipantID: participantId,
            TotalDonations: DonationAmountRaw
          });
      }

      res.status(201).json(donation);
    } else {
      // Anonymous donation - return success
      // Note: Anonymous donations don't create Donations records or update DonationSummary
      // The total endpoint sums from DonationSummary, so anonymous donations won't be counted
      // If you want to track anonymous donations, you'd need to create Donations records with null ParticipantID
      res.status(201).json({ 
        message: 'Donation received',
        amount: DonationAmountRaw,
        anonymous: true 
      });
    }
  } catch (error) {
    next(error);
  }
});

export default router;

