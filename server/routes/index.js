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

router.get('/portal/dashboard', requireAuth, (req, res) => {
  res.render('portal/dashboard', { title: 'Dashboard - Ella Rises Portal' });
});

router.get('/portal/profile', requireAuth, (req, res) => {
  res.render('portal/profile', { title: 'Profile - Ella Rises Portal' });
});

router.get('/portal/events', requireAuth, (req, res) => {
  res.render('portal/events', { title: 'Events - Ella Rises Portal' });
});

router.get('/portal/milestones', requireAuth, (req, res) => {
  res.render('portal/milestones', { title: 'Milestones - Ella Rises Portal' });
});

router.get('/portal/survey/:eventId', requireAuth, (req, res) => {
  res.render('portal/survey', { 
    title: 'Survey - Ella Rises Portal',
    eventId: req.params.eventId 
  });
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

