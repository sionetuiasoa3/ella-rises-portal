import express from 'express';
import { db } from '../db/connection.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// List all events with optional filtering
router.get('/', async (req, res, next) => {
  try {
    const { type, time, location } = req.query;

    let query = db('Events')
      .join('EventsTemplates', 'Events.EventName', 'EventsTemplates.EventName')
      .select(
        'Events.*',
        'EventsTemplates.EventType',
        'EventsTemplates.EventDescription',
        'EventsTemplates.EventTemplatePhotoPath'
      );

    if (type && type !== 'all') {
      query = query.where('EventsTemplates.EventType', type);
    }

    if (location) {
      query = query.whereILike('Events.EventLocation', `%${location}%`);
    }

    if (time === 'upcoming') {
      query = query.where('Events.EventDateTimeStart', '>=', db.fn.now());
    } else if (time === 'past') {
      query = query.where('Events.EventDateTimeStart', '<', db.fn.now());
    }

    const events = await query.orderBy('Events.EventDateTimeStart', 'asc');
    res.json(events);
  } catch (error) {
    next(error);
  }
});

// Get event by ID
router.get('/:id', async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.id);
    
    const event = await db('Events')
      .join('EventsTemplates', 'Events.EventName', 'EventsTemplates.EventName')
      .where({ 'Events.EventID': eventId })
      .select(
        'Events.*',
        'EventsTemplates.EventType',
        'EventsTemplates.EventDescription',
        'EventsTemplates.EventTemplatePhotoPath'
      )
      .first();

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    next(error);
  }
});

// Create event (admin only)
router.post('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const {
      EventName,
      EventDateTimeStart,
      EventDateTimeEnd,
      EventLocation,
      EventCapacity,
      EventRegistrationDeadline
    } = req.body;

    if (!EventName || !EventDateTimeStart) {
      return res.status(400).json({ 
        message: 'EventName and EventDateTimeStart are required' 
      });
    }

    // Verify template exists
    const template = await db('EventsTemplates')
      .where({ EventName })
      .first();

    if (!template) {
      return res.status(400).json({ message: 'Event template not found' });
    }

    // Explicitly exclude EventID - it should auto-increment (SERIAL)
    // Convert date strings to proper Date objects if needed
    const insertData = {
      EventName,
      EventDateTimeStart: EventDateTimeStart ? new Date(EventDateTimeStart) : null,
      EventDateTimeEnd: EventDateTimeEnd ? new Date(EventDateTimeEnd) : null,
      EventLocation: EventLocation || null,
      EventCapacity: EventCapacity ? parseInt(EventCapacity, 10) : (template.EventDefaultCapacity || null),
      EventRegistrationDeadline: EventRegistrationDeadline ? new Date(EventRegistrationDeadline) : null
    };

    // Remove any undefined values and explicitly exclude EventID
    Object.keys(insertData).forEach(key => {
      if (insertData[key] === undefined || key === 'EventID') {
        delete insertData[key];
      }
    });

    const [event] = await db('Events')
      .insert(insertData)
      .returning('*');

    res.status(201).json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    next(error);
  }
});

// Update event (admin only)
router.put('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.id);
    
    const updateData = {};
    const allowedFields = [
      'EventName',
      'EventDateTimeStart',
      'EventDateTimeEnd',
      'EventLocation',
      'EventCapacity',
      'EventRegistrationDeadline'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const [updated] = await db('Events')
      .where({ EventID: eventId })
      .update(updateData)
      .returning('*');

    if (!updated) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Delete event (admin only)
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.id);
    
    const deleted = await db('Events')
      .where({ EventID: eventId })
      .del();

    if (!deleted) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get event registrations (admin only)
router.get('/:id/registrations', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.id);
    
    const registrations = await db('Registrations')
      .join('Participants', 'Registrations.ParticipantID', 'Participants.ParticipantID')
      .where({ 'Registrations.EventID': eventId })
      .where({ 'Participants.IsDeleted': false })
      .select(
        'Registrations.*',
        'Participants.ParticipantFirstName',
        'Participants.ParticipantLastName',
        'Participants.ParticipantEmail'
      )
      .orderBy('Registrations.RegistrationCreatedAt', 'desc');

    res.json(registrations);
  } catch (error) {
    next(error);
  }
});

export default router;

