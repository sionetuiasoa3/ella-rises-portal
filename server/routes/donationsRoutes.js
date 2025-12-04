import express from 'express';
import { db } from '../db/connection.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// List all donations (admin only)
router.get('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const donations = await db('Donations')
      .join('Participants', 'Donations.ParticipantID', 'Participants.ParticipantID')
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

// Get donation summary
router.get('/summary', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const summary = await db('DonationsSummary')
      .join('Participants', 'DonationsSummary.ParticipantID', 'Participants.ParticipantID')
      .select(
        'DonationsSummary.*',
        'Participants.ParticipantFirstName',
        'Participants.ParticipantLastName',
        'Participants.ParticipantEmail'
      )
      .orderBy('DonationsSummary.TotalDonations', 'desc');
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

// Create donation (participant or admin)
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { ParticipantID, DonationDateRaw, DonationAmountRaw, Message, Anonymous } = req.body;

    // Determine participant ID: from body or current user session
    const participantId = ParticipantID || req.session.user?.participantId;

    if (!participantId || !DonationAmountRaw) {
      return res.status(400).json({ 
        message: 'ParticipantID and DonationAmountRaw are required' 
      });
    }

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

    // Update or create summary
    const summary = await db('DonationsSummary')
      .where({ ParticipantID: participantId })
      .first();

    if (summary) {
      await db('DonationsSummary')
        .where({ ParticipantID: participantId })
        .update({
          TotalDonations: db.raw('?? + ?', ['TotalDonations', DonationAmountRaw])
        });
    } else {
      await db('DonationsSummary')
        .insert({
          ParticipantID: participantId,
          TotalDonations: DonationAmountRaw
        });
    }

    res.status(201).json(donation);
  } catch (error) {
    next(error);
  }
});

export default router;

