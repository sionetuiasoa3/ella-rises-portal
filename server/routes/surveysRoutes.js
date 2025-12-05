import express from 'express';
import { db } from '../db/connection.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all surveys with participant and event info (admin only)
router.get('/all', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const surveys = await db('Surveys')
      .join('Registrations', 'Surveys.RegistrationID', 'Registrations.RegistrationID')
      .join('Events', 'Registrations.EventID', 'Events.EventID')
      .join('Participants', 'Registrations.ParticipantID', 'Participants.ParticipantID')
      .select(
        'Surveys.*',
        'Registrations.EventID',
        'Registrations.ParticipantID',
        'Events.EventName',
        'Events.EventDateTimeStart',
        'Participants.ParticipantFirstName',
        'Participants.ParticipantLastName',
        'Participants.ParticipantEmail'
      )
      .orderBy('Surveys.SurveySubmissionDate', 'desc');
    
    res.json(surveys);
  } catch (error) {
    next(error);
  }
});

// Get survey statistics (admin only) - MUST be before /:id
router.get('/stats', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const stats = await db('Surveys')
      .avg('SurveySatisfactionScore as avgSatisfaction')
      .avg('SurveyUsefulnessScore as avgUsefulness')
      .avg('SurveyInstructorScore as avgInstructor')
      .avg('SurveyRecommendationScore as avgRecommendation')
      .avg('SurveyOverallScore as avgOverall')
      .count('* as totalSurveys')
      .first();
    
    res.json({
      avgSatisfaction: parseFloat(stats.avgSatisfaction) || 0,
      avgUsefulness: parseFloat(stats.avgUsefulness) || 0,
      avgInstructor: parseFloat(stats.avgInstructor) || 0,
      avgRecommendation: parseFloat(stats.avgRecommendation) || 0,
      avgOverall: parseFloat(stats.avgOverall) || 0,
      totalSurveys: parseInt(stats.totalSurveys) || 0
    });
  } catch (error) {
    next(error);
  }
});

// Get survey by ID (admin only)
router.get('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const surveyId = parseInt(req.params.id);
    
    const survey = await db('Surveys')
      .join('Registrations', 'Surveys.RegistrationID', 'Registrations.RegistrationID')
      .join('Events', 'Registrations.EventID', 'Events.EventID')
      .join('Participants', 'Registrations.ParticipantID', 'Participants.ParticipantID')
      .where({ 'Surveys.SurveyID': surveyId })
      .select(
        'Surveys.*',
        'Registrations.EventID',
        'Registrations.ParticipantID',
        'Events.EventName',
        'Participants.ParticipantFirstName',
        'Participants.ParticipantLastName',
        'Participants.ParticipantEmail'
      )
      .first();
    
    if (!survey) {
      return res.status(404).json({ message: 'Survey not found' });
    }
    
    res.json(survey);
  } catch (error) {
    next(error);
  }
});

// Update survey (admin only)
router.put('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const surveyId = parseInt(req.params.id);
    const {
      SurveySatisfactionScore,
      SurveyUsefulnessScore,
      SurveyInstructorScore,
      SurveyRecommendationScore,
      SurveyComments
    } = req.body;
    
    // Calculate overall score
    const scores = [
      SurveySatisfactionScore,
      SurveyUsefulnessScore,
      SurveyInstructorScore,
      SurveyRecommendationScore
    ].filter(s => s != null).map(s => parseInt(s));
    
    const calculatedOverallScore = scores.length > 0 
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;

    // Determine NPS bucket
    let calculatedNPSBucket = null;
    if (SurveyRecommendationScore != null) {
      const recScore = parseInt(SurveyRecommendationScore);
      if (recScore <= 3) {
        calculatedNPSBucket = 'Detractor';
      } else if (recScore === 4) {
        calculatedNPSBucket = 'Passive';
      } else if (recScore === 5) {
        calculatedNPSBucket = 'Promoter';
      }
    }
    
    const [updated] = await db('Surveys')
      .where({ SurveyID: surveyId })
      .update({
        SurveySatisfactionScore,
        SurveyUsefulnessScore,
        SurveyInstructorScore,
        SurveyRecommendationScore,
        SurveyOverallScore: calculatedOverallScore,
        SurveyNPSBucket: calculatedNPSBucket,
        SurveyComments
      })
      .returning('*');
    
    if (!updated) {
      return res.status(404).json({ message: 'Survey not found' });
    }
    
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Delete survey (admin only)
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const surveyId = parseInt(req.params.id);
    
    const deleted = await db('Surveys')
      .where({ SurveyID: surveyId })
      .del();
    
    if (!deleted) {
      return res.status(404).json({ message: 'Survey not found' });
    }
    
    res.json({ message: 'Survey deleted successfully' });
  } catch (error) {
    next(error);
  }
});

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

    // Calculate overall score as average of the four scores (integer)
    const scores = [
      SurveySatisfactionScore,
      SurveyUsefulnessScore,
      SurveyInstructorScore,
      SurveyRecommendationScore
    ].filter(s => s != null).map(s => parseInt(s));
    
    const calculatedOverallScore = scores.length > 0 
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;

    // Determine NPS bucket based on recommendation score
    let calculatedNPSBucket = null;
    if (SurveyRecommendationScore != null) {
      const recScore = parseInt(SurveyRecommendationScore);
      if (recScore <= 3) {
        calculatedNPSBucket = 'Detractor';
      } else if (recScore === 4) {
        calculatedNPSBucket = 'Passive';
      } else if (recScore === 5) {
        calculatedNPSBucket = 'Promoter';
      }
    }

    const [survey] = await db('Surveys')
      .insert({
        RegistrationID,
        SurveySatisfactionScore: SurveySatisfactionScore || null,
        SurveyUsefulnessScore: SurveyUsefulnessScore || null,
        SurveyInstructorScore: SurveyInstructorScore || null,
        SurveyRecommendationScore: SurveyRecommendationScore || null,
        SurveyOverallScore: calculatedOverallScore,
        SurveyNPSBucket: calculatedNPSBucket,
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

