import express from 'express';
import authRoutes, { accountRouter } from './authRoutes.js';
import participantsRoutes from './participantsRoutes.js';
import eventsRoutes from './eventsRoutes.js';
import templatesRoutes from './templatesRoutes.js';
import registrationsRoutes from './registrationsRoutes.js';
import milestonesRoutes from './milestonesRoutes.js';
import donationsRoutes from './donationsRoutes.js';
import surveysRoutes from './surveysRoutes.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { db } from '../db/connection.js';
import { uploadParticipantPhoto, getUploadPath, deleteUploadedFile, handleUploadError } from '../middleware/upload.js';

const router = express.Router();

// Public pages
router.get('/', (req, res) => {
  res.render('index', { title: 'Ella Rises - Empowering Women in STEAM' });
});

router.get('/about', (req, res) => {
  res.render('about', { title: 'About Us - Ella Rises' });
});

router.get('/events', (req, res) => {
  res.render('events', { title: 'Events - Ella Rises' });
});

router.get('/contact', (req, res) => {
  res.render('contact', { title: 'Contact Us - Ella Rises' });
});

router.get('/press', (req, res) => {
  res.render('press', { title: 'Press + Stories - Ella Rises' });
});

router.get('/donate', (req, res) => {
  res.render('donate', { title: 'Donate - Ella Rises' });
});

router.get('/donate/payment', (req, res) => {
  const amount = parseFloat(req.query.amount) || 0;
  const message = req.query.message || '';
  
  // Validate amount
  if (!amount || amount <= 0 || isNaN(amount)) {
    return res.redirect('/donate?error=invalid_amount');
  }
  
  res.render('donate-payment', { 
    title: 'Payment Information - Ella Rises',
    amount: amount,
    message
  });
});

router.get('/donate/thank-you', (req, res) => {
  res.render('donate-thank-you', { title: 'Thank You - Ella Rises' });
});

// Portal routes
router.get('/portal/auth', (req, res) => {
  if (req.session.user) {
    return res.redirect('/portal/dashboard');
  }
  res.render('portal/auth', { title: 'Login - Ella Rises Portal' });
});

router.get('/portal/dashboard', requireAuth, async (req, res, next) => {
  try {
    const participantId = req.session.user.participantId;
    
    // Fetch participant data (exclude deleted)
    const participant = await db('Participants')
      .where({ ParticipantID: participantId })
      .where({ IsDeleted: false })
      .first();
    
    if (!participant) {
      // If participant is deleted, destroy session and redirect to login
      req.session.destroy(() => {});
      return res.redirect('/portal/auth?deleted=1');
    }
    
    // Fetch donations summary
    const donationsSummary = await db('DonationSummary')
      .where({ ParticipantID: participantId })
      .first();
    
    // Fetch milestones (achieved and planned)
    const allMilestones = await db('Milestones')
      .join('MilestonesTypes', 'Milestones.MilestoneID', 'MilestonesTypes.MilestoneID')
      .where({ 'Milestones.ParticipantID': participantId })
      .select(
        'Milestones.*',
        'MilestonesTypes.MilestoneTitle'
      )
      .orderBy('Milestones.MilestoneDate', 'desc');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futurePlaceholder = new Date('2099-12-31');
    futurePlaceholder.setHours(0, 0, 0, 0);
    
    const achievedMilestones = allMilestones.filter(m => {
      const milestoneDate = new Date(m.MilestoneDate);
      milestoneDate.setHours(0, 0, 0, 0);
      // Exclude placeholder date (future milestones)
      return milestoneDate <= today && milestoneDate.getTime() !== futurePlaceholder.getTime();
    });
    
    const plannedMilestones = allMilestones.filter(m => {
      const milestoneDate = new Date(m.MilestoneDate);
      milestoneDate.setHours(0, 0, 0, 0);
      // Include placeholder date (future milestones without dates)
      return milestoneDate.getTime() === futurePlaceholder.getTime() || milestoneDate > today;
    });
    
    // Fetch registrations with event details
    const registrations = await db('Registrations')
      .join('Events', 'Registrations.EventID', 'Events.EventID')
      .join('EventsTemplates', 'Events.EventName', 'EventsTemplates.EventName')
      .where({ 'Registrations.ParticipantID': participantId })
      .select(
        'Registrations.*',
        'Events.EventID',
        'Events.EventName',
        'Events.EventDateTimeStart',
        'Events.EventDateTimeEnd',
        'Events.EventLocation',
        'EventsTemplates.EventTemplatePhotoPath'
      )
      .orderBy('Events.EventDateTimeStart', 'desc');
    
    const now = new Date();
    const upcomingEvents = registrations.filter(reg => {
      const eventDate = new Date(reg.EventDateTimeStart);
      return eventDate > now;
    });
    
    const pastEvents = registrations
      .filter(reg => {
        const eventDate = new Date(reg.EventDateTimeStart);
        // Handle different database representations of boolean (true, 1, 't', 'true')
        const attended = reg.RegistrationAttendedFlag === true || 
                         reg.RegistrationAttendedFlag === 1 || 
                         reg.RegistrationAttendedFlag === 't' || 
                         reg.RegistrationAttendedFlag === 'true';
        return eventDate <= now && attended;
      })
      .slice(0, 5); // Most recent 5
    
    // Check which past events have surveys
    const pastEventIds = pastEvents.map(e => e.RegistrationID);
    const surveys = pastEventIds.length > 0 
      ? await db('Surveys')
          .whereIn('RegistrationID', pastEventIds)
          .select('RegistrationID')
      : [];
    
    const surveyRegistrationIds = new Set(surveys.map(s => s.RegistrationID));
    
    // Mark which events have surveys
    pastEvents.forEach(event => {
      event.hasSurvey = surveyRegistrationIds.has(event.RegistrationID);
    });
    
    res.render('portal/dashboard', { 
      title: 'Dashboard - Ella Rises Portal',
      participant,
      donationsSummary: donationsSummary || { TotalDonations: 0 },
      achievedMilestones,
      plannedMilestones,
      upcomingEvents,
      pastEvents,
      updated: req.query.updated === '1' || false
    });
  } catch (error) {
    next(error);
  }
});

router.get('/portal/profile', requireAuth, (req, res) => {
  res.render('portal/profile', { title: 'Profile - Ella Rises Portal' });
});

router.get('/portal/profile/edit', requireAuth, async (req, res, next) => {
  try {
    const participantId = req.session.user.participantId;
    const participant = await db('Participants')
      .where({ ParticipantID: participantId })
      .where({ IsDeleted: false })
      .first();
    
    if (!participant) {
      // If participant is deleted, destroy session and redirect to login
      req.session.destroy(() => {});
      return res.redirect('/portal/auth?deleted=1');
    }
    
    res.render('portal/profile-edit', { 
      title: 'Edit Profile - Ella Rises Portal',
      participant 
    });
  } catch (error) {
    next(error);
  }
});

router.post('/portal/profile/edit', requireAuth, uploadParticipantPhoto, handleUploadError, async (req, res, next) => {
  try {
    const participantId = req.session.user.participantId;
    
    // Get existing participant (exclude deleted)
    const existing = await db('Participants')
      .where({ ParticipantID: participantId })
      .where({ IsDeleted: false })
      .first();
    
    if (!existing) {
      // If participant is deleted, destroy session and return 401
      req.session.destroy(() => {});
      return res.status(401).json({ message: 'Participant not found' });
    }
    
    // Build update data from form fields (excluding PasswordHash)
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
      'ParticipantFieldOfInterest'
    ];
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined && req.body[field] !== '') {
        updateData[field] = req.body[field] || null;
      }
    });
    
    // Handle photo upload if provided
    if (req.file) {
      // Delete old photo if it exists
      if (existing.ParticipantPhotoPath) {
        await deleteUploadedFile(existing.ParticipantPhotoPath);
      }
      // For S3 uploads, req.file.location contains the full S3 URL
      // For backward compatibility, also check req.file.key and construct URL if needed
      updateData.ParticipantPhotoPath = req.file.location || getUploadPath('participants', req.file.key || req.file.filename);
    }
    // If no photo uploaded, keep existing ParticipantPhotoPath
    
    // Update participant
    const [updated] = await db('Participants')
      .where({ ParticipantID: participantId })
      .update(updateData)
      .returning('*');
    
    if (!updated) {
      return res.status(404).json({ message: 'Participant not found' });
    }
    
    // Update session with new name
    req.session.user.firstName = updated.ParticipantFirstName;
    req.session.user.lastName = updated.ParticipantLastName;
    
    res.redirect('/portal/dashboard?updated=1');
  } catch (error) {
    next(error);
  }
});

router.get('/portal/events', requireAuth, async (req, res, next) => {
  try {
    const participantId = req.session.user.participantId;
    console.log('[/portal/events] Fetching events for participant:', participantId);
    
    // Fetch all upcoming events
    const allEvents = await db('Events')
      .join('EventsTemplates', 'Events.EventName', 'EventsTemplates.EventName')
      .where('Events.EventDateTimeStart', '>=', db.fn.now())
      .select(
        'Events.*',
        'EventsTemplates.EventType',
        'EventsTemplates.EventDescription',
        'EventsTemplates.EventTemplatePhotoPath'
      )
      .orderBy('Events.EventDateTimeStart', 'asc');
    
    console.log('[/portal/events] Found', allEvents.length, 'upcoming events');
    
    // Fetch user's registrations
    const registrations = await db('Registrations')
      .where({ ParticipantID: participantId })
      .select('EventID', 'RegistrationStatus');
    
    const registeredEventIds = new Set(registrations.map(r => r.EventID));
    
    // Mark which events the user is registered for
    const eventsWithRegistration = allEvents.map(event => ({
      ...event,
      isRegistered: registeredEventIds.has(event.EventID)
    }));
    
    res.render('portal/events', { 
      title: 'Events - Ella Rises Portal',
      events: eventsWithRegistration
    });
  } catch (error) {
    console.error('[/portal/events] Error:', error);
    next(error);
  }
});

router.get('/portal/milestones', requireAuth, (req, res) => {
  res.render('portal/milestones', { title: 'Milestones - Ella Rises Portal' });
});

router.get('/portal/survey/:eventId', requireAuth, async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const participantId = req.session.user.participantId;
    
    // Get event and registration info
    const registration = await db('Registrations')
      .join('Events', 'Registrations.EventID', 'Events.EventID')
      .where({ 'Registrations.EventID': eventId, 'Registrations.ParticipantID': participantId })
      .select('Registrations.*', 'Events.EventName', 'Events.EventDateTimeStart')
      .first();
    
    if (!registration) {
      return res.redirect('/portal/dashboard');
    }
    
    // Check if survey already exists
    const existingSurvey = await db('Surveys')
      .where({ RegistrationID: registration.RegistrationID })
      .first();
    
    if (existingSurvey) {
      return res.redirect('/portal/dashboard?survey=completed');
    }
    
    res.render('portal/survey', { 
      title: 'Survey - Ella Rises Portal',
      eventId,
      eventName: registration.EventName,
      registrationId: registration.RegistrationID
    });
  } catch (error) {
    next(error);
  }
});

router.get('/portal/donate', requireAuth, (req, res) => {
  res.render('portal/donate', { title: 'Donate - Ella Rises Portal' });
});

// Admin routes
router.get('/admin/login', (req, res) => {
  if (req.session.user?.role === 'admin') {
    return res.redirect('/admin');
  }
  res.render('admin/login', { title: 'Admin Login - Ella Rises' });
});

router.get('/admin', requireAuth, requireRole('admin'), (req, res) => {
  res.render('admin/dashboard', { title: 'Admin Dashboard - Ella Rises' });
});

router.get('/admin/participants', requireAuth, requireRole('admin'), (req, res) => {
  res.render('admin/participants', { title: 'Participants - Admin' });
});

router.get('/admin/participants/:id', requireAuth, requireRole('admin'), (req, res) => {
  res.render('admin/participant-detail', { 
    title: 'Participant Details - Admin',
    participantId: req.params.id 
  });
});

router.get('/admin/event-templates', requireAuth, requireRole('admin'), (req, res) => {
  res.render('admin/event-templates', { title: 'Event Templates - Admin' });
});

router.get('/admin/events', requireAuth, requireRole('admin'), (req, res) => {
  res.render('admin/events', { title: 'Events - Admin' });
});

router.get('/admin/events/:eventId/registrations', requireAuth, requireRole('admin'), (req, res) => {
  res.render('admin/registrations', { 
    title: 'Event Registrations - Admin',
    eventId: req.params.eventId 
  });
});

router.get('/admin/milestones', requireAuth, requireRole('admin'), (req, res) => {
  res.render('admin/milestones', { title: 'Milestones - Admin' });
});

router.get('/admin/donations', requireAuth, requireRole('admin'), (req, res) => {
  res.render('admin/donations', { title: 'Donations - Admin' });
});

// Account / password creation routes (non-API, EJS views)
router.use('/', accountRouter);

// API routes
router.use('/api/auth', authRoutes);
router.use('/api/participants', participantsRoutes);
router.use('/api/events', eventsRoutes);
router.use('/api/event-templates', templatesRoutes);
router.use('/api/registrations', registrationsRoutes);
router.use('/api/milestone-types', milestonesRoutes);
router.use('/api/milestones', milestonesRoutes);
router.use('/api/donations', donationsRoutes);
router.use('/api/surveys', surveysRoutes);

// 404 handler
router.use((req, res) => {
  res.status(404).render('not-found', { title: 'Page Not Found - Ella Rises' });
});

export default router;

