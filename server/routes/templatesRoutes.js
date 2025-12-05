import express from 'express';
import { db } from '../db/connection.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for template photo uploads
const templatePhotoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../public/uploads/templates');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'template-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadTemplatePhoto = multer({
  storage: templatePhotoStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

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

// Upload template photo (admin only)
router.post('/:id/photo', requireAuth, requireRole('admin'), uploadTemplatePhoto.single('photo'), async (req, res, next) => {
  try {
    const eventName = decodeURIComponent(req.params.id);
    
    if (!req.file) {
      return res.status(400).json({ message: 'No photo uploaded' });
    }

    const photoPath = '/uploads/templates/' + req.file.filename;

    // Get existing template to check for old photo
    const existing = await db('EventsTemplates')
      .where({ EventName: eventName })
      .first();

    if (!existing) {
      // Delete uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Template not found' });
    }

    // Delete old photo if exists
    if (existing.EventTemplatePhotoPath) {
      const oldPath = path.join(__dirname, '../../public', existing.EventTemplatePhotoPath);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Update template with new photo path
    const [updated] = await db('EventsTemplates')
      .where({ EventName: eventName })
      .update({ EventTemplatePhotoPath: photoPath })
      .returning('*');

    res.json(updated);
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
});

// Delete template photo (admin only)
router.delete('/:id/photo', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const eventName = decodeURIComponent(req.params.id);

    const existing = await db('EventsTemplates')
      .where({ EventName: eventName })
      .first();

    if (!existing) {
      return res.status(404).json({ message: 'Template not found' });
    }

    if (existing.EventTemplatePhotoPath) {
      const photoPath = path.join(__dirname, '../../public', existing.EventTemplatePhotoPath);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    const [updated] = await db('EventsTemplates')
      .where({ EventName: eventName })
      .update({ EventTemplatePhotoPath: null })
      .returning('*');

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

