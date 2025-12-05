import express from 'express';
import { db } from '../db/connection.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all registrations (admin only)
router.get('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const registrations = await db('Registrations')
      .select('*')
      .orderBy('RegistrationID', 'desc');
    res.json(registrations);
  } catch (error) {
    next(error);
  }
});

// Get registrations for a specific event (admin only)
router.get('/event/:eventId', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.eventId);
    
    // Get event details
    const event = await db('Events')
      .where({ EventID: eventId })
      .first();
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Get registrations with participant info
    const registrations = await db('Registrations')
      .join('Participants', 'Registrations.ParticipantID', 'Participants.ParticipantID')
      .where({ 'Registrations.EventID': eventId })
      .whereNot({ 'Participants.ParticipantRole': 'donor' })
      .where({ 'Participants.IsDeleted': false })
      .select(
        'Registrations.*',
        'Participants.ParticipantFirstName',
        'Participants.ParticipantLastName',
        'Participants.ParticipantEmail',
        'Participants.ParticipantPhone'
      )
      .orderBy('Participants.ParticipantLastName', 'asc');
    
    res.json({
      event,
      registrations
    });
  } catch (error) {
    next(error);
  }
});

// Update attendance for a registration (admin only)
router.patch('/:id/attendance', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const registrationId = parseInt(req.params.id);
    const { attended } = req.body;
    
    if (typeof attended !== 'boolean') {
      return res.status(400).json({ message: 'attended must be a boolean' });
    }
    
    const [updated] = await db('Registrations')
      .where({ RegistrationID: registrationId })
      .update({ 
        RegistrationAttendedFlag: attended,
        RegistrationCheckInTime: attended ? new Date() : null
      })
      .returning('*');
    
    if (!updated) {
      return res.status(404).json({ message: 'Registration not found' });
    }
    
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Create registration
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { EventID, ParticipantID } = req.body;

    if (!EventID) {
      return res.status(400).json({ message: 'EventID is required' });
    }

    // Determine participant ID
    let participantId = ParticipantID;
    if (!participantId) {
      // If not provided, use logged-in user's ID
      if (req.session.user.role === 'user' || req.session.user.role === 'participant') {
        participantId = req.session.user.participantId;
      } else if (req.session.user.role === 'admin') {
        return res.status(400).json({ message: 'Admins cannot register for events' });
      } else {
        return res.status(400).json({ message: 'ParticipantID is required' });
      }
    }

    // Check if user has permission to register this participant
    if (req.session.user.role !== 'admin' && req.session.user.participantId !== participantId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if event exists
    const event = await db('Events')
      .where({ EventID })
      .first();

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if already registered
    const existing = await db('Registrations')
      .where({ EventID, ParticipantID: participantId })
      .first();

    if (existing) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    // Check capacity if set
    if (event.EventCapacity) {
      const currentRegistrations = await db('Registrations')
        .where({ EventID })
        .count('* as count')
        .first();

      if (parseInt(currentRegistrations.count) >= event.EventCapacity) {
        return res.status(400).json({ message: 'Event is at capacity' });
      }
    }

    // Check registration deadline
    if (event.EventRegistrationDeadline) {
      const deadline = new Date(event.EventRegistrationDeadline);
      if (new Date() > deadline) {
        return res.status(400).json({ message: 'Registration deadline has passed' });
      }
    }

    const [registration] = await db('Registrations')
      .insert({
        EventID,
        ParticipantID: participantId,
        RegistrationStatus: 'registered',
        RegistrationAttendedFlag: false
      })
      .returning('*');

    res.status(201).json(registration);
  } catch (error) {
    next(error);
  }
});

// Update registration
router.put('/:id', requireAuth, async (req, res, next) => {
  try {
    const registrationId = parseInt(req.params.id);
    
    // Get registration to check permissions
    const registration = await db('Registrations')
      .where({ RegistrationID: registrationId })
      .first();

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    // Check permissions: admin or own registration
    if (req.session.user.role !== 'admin' && 
        req.session.user.participantId !== registration.ParticipantID) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updateData = {};
    const allowedFields = [
      'RegistrationStatus',
      'RegistrationAttendedFlag',
      'RegistrationCheckInTime'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const [updated] = await db('Registrations')
      .where({ RegistrationID: registrationId })
      .update(updateData)
      .returning('*');

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Delete registration (unregister)
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const registrationId = parseInt(req.params.id);
    
    // Get registration to check permissions
    const registration = await db('Registrations')
      .where({ RegistrationID: registrationId })
      .first();

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    // Check permissions: admin or own registration
    if (req.session.user.role !== 'admin' && 
        req.session.user.participantId !== registration.ParticipantID) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const deleted = await db('Registrations')
      .where({ RegistrationID: registrationId })
      .del();

    res.json({ message: 'Registration deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Unregister from event (convenience route for participants)
router.post('/unregister', requireAuth, async (req, res, next) => {
  try {
    const { EventID } = req.body;
    const participantId = req.session.user.participantId;

    if (!EventID) {
      return res.status(400).json({ message: 'EventID is required' });
    }

    // Find the registration
    const registration = await db('Registrations')
      .where({ EventID, ParticipantID: participantId })
      .first();

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    // Delete the registration
    await db('Registrations')
      .where({ RegistrationID: registration.RegistrationID })
      .del();

    res.json({ message: 'Successfully unregistered from event' });
  } catch (error) {
    next(error);
  }
});

export default router;

