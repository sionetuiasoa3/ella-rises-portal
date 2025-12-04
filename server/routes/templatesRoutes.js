import express from 'express';
import { db } from '../db/connection.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// List all templates with their event dates
router.get('/with-dates', async (req, res, next) => {
  try {
    const templates = await db('EventsTemplates')
      .select('*')
      .orderBy('EventName', 'asc');
    
    // For each template, get its associated events
    const templatesWithDates = await Promise.all(
      templates.map(async (template) => {
        // Get all events for this template
        const allEventsRaw = await db('Events')
          .where({ EventName: template.EventName })
          .whereNotNull('EventDateTimeStart')
          .select('EventID', 'EventDateTimeStart', 'EventDateTimeEnd', 'EventLocation')
          .orderBy('EventDateTimeStart', 'asc');
        
        // Filter to only future events (using current time)
        const now = new Date();
        const futureEvents = allEventsRaw
          .filter(event => {
            if (!event.EventDateTimeStart) return false;
            const eventDate = new Date(event.EventDateTimeStart);
            if (isNaN(eventDate.getTime())) return false;
            return eventDate > now;
          })
          .map(event => ({
            EventID: event.EventID,
            EventDateTimeStart: event.EventDateTimeStart,
            EventDateTimeEnd: event.EventDateTimeEnd || null,
            EventLocation: event.EventLocation || null
          }));
        
        console.log(`Template "${template.EventName}": ${allEventsRaw.length} total events, ${futureEvents.length} future events`);
        
        return {
          ...template,
          events: futureEvents
        };
      })
    );
    
    res.json(templatesWithDates);
  } catch (error) {
    console.error('Error fetching templates with dates:', error);
    next(error);
  }
});

// List all templates
router.get('/', async (req, res, next) => {
  try {
    const templates = await db('EventsTemplates')
      .select('*')
      .orderBy('EventName', 'asc');
    res.json(templates);
  } catch (error) {
    next(error);
  }
});

// Create template (admin only)
router.post('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const {
      EventName,
      EventType,
      EventDescription,
      EventRecurrencePattern,
      EventDefaultCapacity,
      EventTemplatePhotoPath
    } = req.body;

    if (!EventName) {
      return res.status(400).json({ message: 'EventName is required' });
    }

    const [template] = await db('EventsTemplates')
      .insert({
        EventName,
        EventType: EventType || null,
        EventDescription: EventDescription || null,
        EventRecurrencePattern: EventRecurrencePattern || null,
        EventDefaultCapacity: EventDefaultCapacity || null,
        EventTemplatePhotoPath: EventTemplatePhotoPath || null
      })
      .returning('*');

    res.status(201).json(template);
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ message: 'Event template with this name already exists' });
    }
    next(error);
  }
});

// Update template (admin only)
router.put('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const eventName = req.params.id; // EventName is the primary key
    
    const updateData = {};
    const allowedFields = [
      'EventType',
      'EventDescription',
      'EventRecurrencePattern',
      'EventDefaultCapacity',
      'EventTemplatePhotoPath'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Allow renaming if new EventName provided
    if (req.body.EventName && req.body.EventName !== eventName) {
      // Check if new name already exists
      const existing = await db('EventsTemplates')
        .where({ EventName: req.body.EventName })
        .first();
      
      if (existing) {
        return res.status(400).json({ message: 'Event template with this name already exists' });
      }
      
      updateData.EventName = req.body.EventName;
    }

    const [updated] = await db('EventsTemplates')
      .where({ EventName: eventName })
      .update(updateData)
      .returning('*');

    if (!updated) {
      return res.status(404).json({ message: 'Event template not found' });
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Delete template (admin only)
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const eventName = req.params.id; // EventName is the primary key
    
    // Check if any events use this template
    const eventsUsingTemplate = await db('Events')
      .where({ EventName: eventName })
      .count('* as count')
      .first();

    if (parseInt(eventsUsingTemplate.count) > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete template: events are using this template' 
      });
    }

    const deleted = await db('EventsTemplates')
      .where({ EventName: eventName })
      .del();

    if (!deleted) {
      return res.status(404).json({ message: 'Event template not found' });
    }

    res.json({ message: 'Event template deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;

