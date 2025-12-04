// Types matching your database schema

export interface Participant {
  ParticipantID: number;
  ParticipantEmail: string;
  ParticipantFirstName: string;
  ParticipantLastName: string;
  ParticipantDOB: string;
  ParticipantRole: string;
  ParticipantPhone: string;
  ParticipantCity: string;
  ParticipantState: string;
  ParticipantZip: string;
  ParticipantSchoolOrEmployer: string | null;
  ParticipantFieldOfInterest: 'Arts' | 'STEM' | 'Both';
  ParticipantPhotoPath: string | null;
}

// User table was removed - auth is now handled via Participant.PasswordHash

export interface EventTemplate {
  EventName: string;
  EventType: string;
  EventDescription: string;
  EventRecurrencePattern: string;
  EventDefaultCapacity: number;
}

export interface Event {
  EventID: number;
  EventName: string;
  EventDateTimeStart: string;
  EventDateTimeEnd: string;
  EventLocation: string;
  EventCapacity: number;
  EventRegistrationDeadline: string;
  EventPhotoPath: string | null;
  // Computed fields from API
  isRegistered?: boolean;
  spotsRemaining?: number;
}

export interface Registration {
  RegistrationID: number;
  ParticipantID: number;
  EventID: number;
  RegistrationStatus: string;
  RegistrationAttendedFlag: boolean;
  RegistrationCheckInTime: string | null;
  RegistrationCreatedAt: string;
  // Joined event data
  Event?: Event;
}

export interface MilestoneType {
  MilestoneID: number;
  MilestoneTitle: string;
}

export interface Milestone {
  MilestoneID: number;
  ParticipantID: number;
  MilestoneDate: string;
  MilestoneTitle?: string; // Joined from MilestoneTypes
  CustomLabel?: string; // For "Other" milestones
}

export interface Survey {
  SurveyID: number;
  RegistrationID: number;
  SurveySatisfactionScore: number;
  SurveyUsefulnessScore: number;
  SurveyInstructorScore: number;
  SurveyRecommendationScore: number;
  SurveyOverallScore: number;
  SurveyNPSBucket: 'Detractor' | 'Passive' | 'Promoter';
  SurveyComments: string | null;
  SurveySubmissionDate: string;
}

export interface AuthResponse {
  token: string;
  participant: Participant;
}

export interface SignupData {
  FirstName: string;
  LastName: string;
  Email: string;
  Password: string;
  FieldOfInterest: 'Arts' | 'STEM' | 'Both';
  DateOfBirth: string;
  City: string;
  State: string;
  Zip: string;
  PhoneNumber: string;
  SchoolOrEmployer?: string;
  ProfilePicture?: File;
}

export interface LoginData {
  Email: string;
  Password: string;
}

export interface SurveySubmission {
  SurveySatisfactionScore: number;
  SurveyUsefulnessScore: number;
  SurveyInstructorScore: number;
  SurveyRecommendationScore: number;
  SurveyOverallScore: number;
  SurveyComments?: string;
}
