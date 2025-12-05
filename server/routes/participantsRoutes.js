import express from 'express';
import bcrypt from 'bcrypt';
import { db } from '../db/connection.js';
import { requireAuth, requireRole, requireOwnershipOrAdmin } from '../middleware/auth.js';
import { uploadParticipantPhoto, getUploadPath, deleteUploadedFile, handleUploadError } from '../middleware/upload.js';

const router = express.Router();

// List all participants (admin only) - Exclude deleted participants and donors
router.get('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const participants = await db('Participants')
      .where({ IsDeleted: false })
      .whereNot({ ParticipantRole: 'donor' })
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

// Validate phone number (10 digits only)
    if (ParticipantPhone && !/^\d{10}$/.test(ParticipantPhone)) {
      return res.status(400).json({ message: 'Phone number must be exactly 10 digits' });
    }

    // Format phone number with dashes (XXX-XXX-XXXX)
    const formattedPhone = ParticipantPhone 
      ? `${ParticipantPhone.slice(0,3)}-${ParticipantPhone.slice(3,6)}-${ParticipantPhone.slice(6)}`
      : null;

    // Validate zip code (5 digits only)
    if (ParticipantZip && !/^\d{5}$/.test(ParticipantZip)) {
      return res.status(400).json({ message: 'Zip code must be exactly 5 digits' });
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
        ParticipantPhone: formattedPhone,
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

    // Validate phone number (10 digits only)
    if (req.body.ParticipantPhone && !/^\d{10}$/.test(req.body.ParticipantPhone)) {
      return res.status(400).json({ message: 'Phone number must be exactly 10 digits' });
    }

    // Format phone number with dashes (XXX-XXX-XXXX) if provided
    if (req.body.ParticipantPhone) {
      req.body.ParticipantPhone = `${req.body.ParticipantPhone.slice(0,3)}-${req.body.ParticipantPhone.slice(3,6)}-${req.body.ParticipantPhone.slice(6)}`;
    }

    // Validate zip code (5 digits only)
    if (req.body.ParticipantZip && !/^\d{5}$/.test(req.body.ParticipantZip)) {
      return res.status(400).json({ message: 'Zip code must be exactly 5 digits' });
    }

    // Check if participant exists and is not deleted before updating
    const existing = await db('Participants')
      .where({ ParticipantID: participantId })
      .where({ IsDeleted: false })
      .first();

    if (!existing) {
      return res.status(404).json({ message: 'Participant not found' });
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

    // Only admins can change email and role
    if (req.session.user.role === 'admin') {
      // Handle email update (only admins can change email)
      if (req.body.ParticipantEmail !== undefined) {
        // If email is being changed, check for duplicates
        if (req.body.ParticipantEmail !== existing.ParticipantEmail) {
          const emailExists = await db('Participants')
            .where({ ParticipantEmail: req.body.ParticipantEmail })
            .where({ IsDeleted: false })
            .whereNot({ ParticipantID: participantId })
            .first();

          if (emailExists) {
            return res.status(400).json({ message: 'A participant with this email already exists' });
          }
        }

        updateData.ParticipantEmail = req.body.ParticipantEmail;
      }

      // Handle role update (only admins can change role)
      if (req.body.ParticipantRole) {
        updateData.ParticipantRole = req.body.ParticipantRole;
      }
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

// Upload/update participant photo (admin only)
router.post('/:id/photo', requireAuth, requireRole('admin'), uploadParticipantPhoto, handleUploadError, async (req, res, next) => {
  try {
    const participantId = parseInt(req.params.id);
    
    if (!req.file) {
      return res.status(400).json({ message: 'No photo file provided' });
    }

    // Get existing participant to check for old photo
    const existing = await db('Participants')
      .where({ ParticipantID: participantId })
      .first();

    if (!existing) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    // Delete old photo if it exists
    if (existing.ParticipantPhotoPath) {
      await deleteUploadedFile(existing.ParticipantPhotoPath);
    }

    // Update with new photo path
    // For S3 uploads, req.file.location contains the full S3 URL
    // For backward compatibility, also check req.file.key and construct URL if needed
    const photoPath = req.file.location || getUploadPath('participants', req.file.key || req.file.filename);
    const [updated] = await db('Participants')
      .where({ ParticipantID: participantId })
      .update({ ParticipantPhotoPath: photoPath })
      .returning('*');

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Delete participant photo (admin only)
router.delete('/:id/photo', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const participantId = parseInt(req.params.id);

    const existing = await db('Participants')
      .where({ ParticipantID: participantId })
      .first();

    if (!existing) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    if (existing.ParticipantPhotoPath) {
      await deleteUploadedFile(existing.ParticipantPhotoPath);
    }

    const [updated] = await db('Participants')
      .where({ ParticipantID: participantId })
      .update({ ParticipantPhotoPath: null })
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

