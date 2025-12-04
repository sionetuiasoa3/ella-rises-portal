import express from 'express';
import { db } from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Submit survey
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const {
      RegistrationID,
      SurveySatisfactionScore,
      SurveyUsefulnessScore,
      SurveyInstructorScore,
      SurveyRecommendationScore,
      SurveyOverallScore,
      SurveyNPSBucket,
      SurveyComments
    } = req.body;

    if (!RegistrationID) {
      return res.status(400).json({ message: 'RegistrationID is required' });
    }

    // Verify registration exists and belongs to user
    const registration = await db('Registrations')
      .where({ RegistrationID })
      .first();

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    // Check permissions: admin or own registration
    if (req.session.user.role !== 'admin' && 
        req.session.user.participantId !== registration.ParticipantID) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if survey already exists
    const existing = await db('Surveys')
      .where({ RegistrationID })
      .first();

    if (existing) {
      return res.status(400).json({ message: 'Survey already submitted for this registration' });
    }

    const [survey] = await db('Surveys')
      .insert({
        RegistrationID,
        SurveySatisfactionScore: SurveySatisfactionScore || null,
        SurveyUsefulnessScore: SurveyUsefulnessScore || null,
        SurveyInstructorScore: SurveyInstructorScore || null,
        SurveyRecommendationScore: SurveyRecommendationScore || null,
        SurveyOverallScore: SurveyOverallScore || null,
        SurveyNPSBucket: SurveyNPSBucket || null,
        SurveyComments: SurveyComments || null,
        SurveySubmissionDate: new Date()
      })
      .returning('*');

    res.status(201).json(survey);
  } catch (error) {
    next(error);
  }
});

// Get survey for event/participant pair
router.get('/event/:eventId/participant/:participantId', requireAuth, async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const participantId = parseInt(req.params.participantId);

    // Check permissions: admin or own survey
    if (req.session.user.role !== 'admin' && 
        req.session.user.participantId !== participantId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Find registration
    const registration = await db('Registrations')
      .where({ EventID: eventId, ParticipantID: participantId })
      .first();

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    // Get survey
    const survey = await db('Surveys')
      .where({ RegistrationID: registration.RegistrationID })
      .first();

    if (!survey) {
      return res.status(404).json({ message: 'Survey not found' });
    }

    res.json(survey);
  } catch (error) {
    next(error);
  }
});

export default router;

