import express from 'express';
import { db } from '../db/connection.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

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

