import express from 'express';
import bcrypt from 'bcrypt';
import { db } from '../db/connection.js';
import { requireAuth, requireRole, requireOwnershipOrAdmin } from '../middleware/auth.js';

const router = express.Router();

// List all participants (admin only) - Exclude deleted participants
router.get('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const participants = await db('Participants')
      .where({ IsDeleted: false })
      .select('*')
      .orderBy('ParticipantLastName', 'asc');
    res.json(participants);
  } catch (error) {
    next(error);
  }
});

// Create new participant (admin only)
router.post('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const {
      ParticipantFirstName,
      ParticipantLastName,
      ParticipantEmail,
      ParticipantPhone,
      ParticipantRole,
      ParticipantDOB,
      ParticipantCity,
      ParticipantState,
      ParticipantZip,
      ParticipantSchoolOrEmployer,
      ParticipantFieldOfInterest
    } = req.body;

    if (!ParticipantFirstName || !ParticipantLastName || !ParticipantEmail) {
      return res.status(400).json({ message: 'First name, last name, and email are required' });
    }

    // Check if email already exists (excluding deleted participants)
    const existing = await db('Participants')
      .where({ ParticipantEmail })
      .where({ IsDeleted: false })
      .first();

    if (existing) {
      return res.status(400).json({ message: 'A participant with this email already exists' });
    }

    const [participant] = await db('Participants')
      .insert({
        ParticipantFirstName,
        ParticipantLastName,
        ParticipantEmail,
        ParticipantPhone: ParticipantPhone || null,
        ParticipantRole: ParticipantRole || 'participant',
        ParticipantDOB: ParticipantDOB || null,
        ParticipantCity: ParticipantCity || null,
        ParticipantState: ParticipantState || null,
        ParticipantZip: ParticipantZip || null,
        ParticipantSchoolOrEmployer: ParticipantSchoolOrEmployer || null,
        ParticipantFieldOfInterest: ParticipantFieldOfInterest || 'Both'
      })
      .returning('*');

    res.status(201).json(participant);
  } catch (error) {
    next(error);
  }
});

// Get participant by ID (admin or self)
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const participantId = parseInt(req.params.id);
    
    // Check if user is admin or viewing their own profile
    if (req.session.user.role !== 'admin' && req.session.user.participantId !== participantId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const participant = await db('Participants')
      .where({ ParticipantID: participantId })
      .where({ IsDeleted: false })
      .first();

    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    res.json(participant);
  } catch (error) {
    next(error);
  }
});

// Update participant (admin or self)
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const participantId = parseInt(req.params.id);
    
    // Check if user is admin or updating their own profile
    if (req.session.user.role !== 'admin' && req.session.user.participantId !== participantId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updateData = {};
    const allowedFields = [
      'ParticipantFirstName',
      'ParticipantLastName',
      'ParticipantDOB',
      'ParticipantPhone',
      'ParticipantCity',
      'ParticipantState',
      'ParticipantZip',
      'ParticipantSchoolOrEmployer',
      'ParticipantFieldOfInterest',
      'ParticipantPhotoPath'
    ];

    // Only admins can change role
    if (req.session.user.role === 'admin' && req.body.ParticipantRole) {
      updateData.ParticipantRole = req.body.ParticipantRole;
    }

    // Only allow password updates if provided
    if (req.body.Password) {
      updateData.PasswordHash = await bcrypt.hash(req.body.Password, 10);
    }

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Check if participant exists and is not deleted before updating
    const existing = await db('Participants')
      .where({ ParticipantID: participantId })
      .where({ IsDeleted: false })
      .first();

    if (!existing) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    const [updated] = await db('Participants')
      .where({ ParticipantID: participantId })
      .update(updateData)
      .returning('*');

    if (!updated) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Delete participant (admin only) - Soft delete with anonymization
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const participantId = parseInt(req.params.id);
    
    // Check if participant exists and is not already deleted
    const participant = await db('Participants')
      .where({ ParticipantID: participantId })
      .where({ IsDeleted: false })
      .first();

    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    // Soft delete + anonymization (keeping ParticipantSchoolOrEmployer and ParticipantFieldOfInterest)
    // Log values before deletion for debugging
    console.log('Before deletion - School:', participant.ParticipantSchoolOrEmployer, 'Field:', participant.ParticipantFieldOfInterest);
    
    const updated = await db('Participants')
      .where({ ParticipantID: participantId })
      .update({
        IsDeleted: true,
        DeletedAt: db.fn.now(),
        ParticipantFirstName: null,
        ParticipantLastName: null,
        ParticipantEmail: null,
        ParticipantDOB: null,
        ParticipantPhone: null,
        ParticipantCity: null,
        ParticipantState: null,
        ParticipantZip: null,
        PasswordHash: null
        // Note: ParticipantSchoolOrEmployer and ParticipantFieldOfInterest are NOT updated - they are preserved
      });

    if (!updated) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    // Verify the values were preserved
    const afterDelete = await db('Participants')
      .where({ ParticipantID: participantId })
      .first();
    console.log('After deletion - School:', afterDelete?.ParticipantSchoolOrEmployer, 'Field:', afterDelete?.ParticipantFieldOfInterest);

    res.json({ message: 'Profile deleted and anonymized.' });
  } catch (error) {
    next(error);
  }
});

// Delete own profile (self-delete) - Soft delete with anonymization
router.delete('/me', requireAuth, async (req, res, next) => {
  try {
    const participantId = req.session.user.participantId;
    
    // Check if participant exists and is not already deleted
    const participant = await db('Participants')
      .where({ ParticipantID: participantId })
      .where({ IsDeleted: false })
      .first();

    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    // Soft delete + anonymization (keeping ParticipantSchoolOrEmployer and ParticipantFieldOfInterest)
    // Log values before deletion for debugging
    console.log('Before self-deletion - School:', participant.ParticipantSchoolOrEmployer, 'Field:', participant.ParticipantFieldOfInterest);
    
    await db('Participants')
      .where({ ParticipantID: participantId })
      .update({
        IsDeleted: true,
        DeletedAt: db.fn.now(),
        ParticipantFirstName: null,
        ParticipantLastName: null,
        ParticipantEmail: null,
        ParticipantDOB: null,
        ParticipantPhone: null,
        ParticipantCity: null,
        ParticipantState: null,
        ParticipantZip: null,
        PasswordHash: null
        // Note: ParticipantSchoolOrEmployer and ParticipantFieldOfInterest are NOT updated - they are preserved
      });

    // Verify the values were preserved
    const afterDelete = await db('Participants')
      .where({ ParticipantID: participantId })
      .first();
    console.log('After self-deletion - School:', afterDelete?.ParticipantSchoolOrEmployer, 'Field:', afterDelete?.ParticipantFieldOfInterest);

    // Destroy session to log user out
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
      }
    });

    res.json({ message: 'Profile deleted and anonymized.' });
  } catch (error) {
    next(error);
  }
});

// Toggle admin role (admin only)
router.put('/:id/toggle-admin', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const participantId = parseInt(req.params.id);
    
    const participant = await db('Participants')
      .where({ ParticipantID: participantId })
      .where({ IsDeleted: false })
      .first();
    
    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    const newRole = participant.ParticipantRole === 'admin' ? 'participant' : 'admin';
    
    const [updated] = await db('Participants')
      .where({ ParticipantID: participantId })
      .update({ ParticipantRole: newRole })
      .returning('*');

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Get current user's registrations
router.get('/me/registrations', requireAuth, async (req, res, next) => {
  try {
    const participantId = req.session.user.participantId;

    const registrations = await db('Registrations')
      .join('Events', 'Registrations.EventID', 'Events.EventID')
      .where({ 'Registrations.ParticipantID': participantId })
      .select(
        'Registrations.*',
        'Events.EventID',
        'Events.EventName',
        'Events.EventDateTimeStart',
        'Events.EventDateTimeEnd',
        'Events.EventLocation'
      )
      .orderBy('Events.EventDateTimeStart', 'desc');

    res.json(registrations);
  } catch (error) {
    next(error);
  }
});

// Get participant registrations
router.get('/:id/registrations', requireAuth, async (req, res, next) => {
  try {
    const participantId = parseInt(req.params.id);
    
    if (req.session.user.role !== 'admin' && req.session.user.participantId !== participantId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const registrations = await db('Registrations')
      .join('Events', 'Registrations.EventID', 'Events.EventID')
      .where({ 'Registrations.ParticipantID': participantId })
      .select(
        'Registrations.*',
        'Events.EventName',
        'Events.EventDateTimeStart',
        'Events.EventDateTimeEnd',
        'Events.EventLocation'
      )
      .orderBy('Registrations.RegistrationCreatedAt', 'desc');

    res.json(registrations);
  } catch (error) {
    next(error);
  }
});

// Get participant milestones
router.get('/:id/milestones', requireAuth, async (req, res, next) => {
  try {
    const participantId = parseInt(req.params.id);
    
    if (req.session.user.role !== 'admin' && req.session.user.participantId !== participantId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const milestones = await db('Milestones')
      .join('MilestonesTypes', 'Milestones.MilestoneID', 'MilestonesTypes.MilestoneID')
      .where({ 'Milestones.ParticipantID': participantId })
      .select(
        'Milestones.*',
        'MilestonesTypes.MilestoneTitle'
      )
      .orderBy('Milestones.MilestoneDate', 'desc');

    res.json(milestones);
  } catch (error) {
    next(error);
  }
});

// Get participant donations
router.get('/:id/donations', requireAuth, async (req, res, next) => {
  try {
    const participantId = parseInt(req.params.id);
    
    if (req.session.user.role !== 'admin' && req.session.user.participantId !== participantId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const donations = await db('Donations')
      .where({ ParticipantID: participantId })
      .orderBy('DonationDateRaw', 'desc');

    const summary = await db('DonationSummary')
      .where({ ParticipantID: participantId })
      .first();

    res.json({
      donations,
      summary: summary || { TotalDonations: 0 }
    });
  } catch (error) {
    next(error);
  }
});

export default router;

