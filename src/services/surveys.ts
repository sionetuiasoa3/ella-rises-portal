import api from './api';
import type { Survey, SurveySubmission } from '@/types/portal';

// Mock mode - matches other services
const MOCK_MODE = true;

const mockSurveys: Map<string, Survey> = new Map();

export const surveysService = {
  async getMySurvey(eventId: number): Promise<Survey | null> {
    if (MOCK_MODE) {
      const key = `1-${eventId}`; // participantId-eventId
      return mockSurveys.get(key) || null;
    }
    try {
      return await api.get<Survey>(`/events/${eventId}/surveys/me`);
    } catch (error) {
      // Return null if no survey exists (404)
      if ((error as { status?: number }).status === 404) {
        return null;
      }
      throw error;
    }
  },

  async submit(eventId: number, data: SurveySubmission): Promise<Survey> {
    if (MOCK_MODE) {
      const survey: Survey = {
        SurveyID: Date.now(),
        RegistrationID: eventId,
        SurveySatisfactionScore: data.SurveySatisfactionScore,
        SurveyUsefulnessScore: data.SurveyUsefulnessScore,
        SurveyInstructorScore: data.SurveyInstructorScore,
        SurveyRecommendationScore: data.SurveyRecommendationScore,
        SurveyOverallScore: data.SurveyOverallScore,
        SurveyNPSBucket: calculateNPSBucket(data.SurveyRecommendationScore),
        SurveyComments: data.SurveyComments || null,
        SurveySubmissionDate: new Date().toISOString(),
      };
      const key = `1-${eventId}`;
      mockSurveys.set(key, survey);
      return survey;
    }
    return api.post<Survey>(`/events/${eventId}/surveys`, data);
  },
};

// Helper to calculate NPS bucket from recommendation score
export const calculateNPSBucket = (score: number): 'Detractor' | 'Passive' | 'Promoter' => {
  if (score <= 2) return 'Detractor';
  if (score === 3) return 'Passive';
  return 'Promoter';
};

export default surveysService;
