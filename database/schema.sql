-- Ella Rises Portal Database Schema
-- PostgreSQL Database Setup Script
-- Run this script to create all required tables for local development

-- Create database (run this separately if needed)
-- CREATE DATABASE ella_rises;

-- Connect to the database
-- \c ella_rises;

-- ============================================================================
-- TABLE: Participants
-- ============================================================================
CREATE TABLE IF NOT EXISTS "Participants" (
    "ParticipantID" SERIAL PRIMARY KEY,
    "ParticipantEmail" VARCHAR(255) NOT NULL UNIQUE,
    "ParticipantFirstName" VARCHAR(100) NOT NULL,
    "ParticipantLastName" VARCHAR(100) NOT NULL,
    "ParticipantDOB" DATE,
    "ParticipantRole" VARCHAR(50) DEFAULT 'participant',
    "ParticipantPhone" VARCHAR(20),
    "ParticipantCity" VARCHAR(100),
    "ParticipantState" VARCHAR(50),
    "ParticipantZip" VARCHAR(10),
    "ParticipantSchoolOrEmployer" VARCHAR(255),
    "ParticipantFieldOfInterest" VARCHAR(50) DEFAULT 'Both',
    "ParticipantPhotoPath" VARCHAR(500),
    "PasswordHash" TEXT
);

-- ============================================================================
-- TABLE: EventsTemplates
-- ============================================================================
CREATE TABLE IF NOT EXISTS "EventsTemplates" (
    "EventName" VARCHAR(255) PRIMARY KEY,
    "EventType" VARCHAR(100),
    "EventDescription" TEXT,
    "EventRecurrencePattern" VARCHAR(100),
    "EventDefaultCapacity" INTEGER,
    "EventTemplatePhotoPath" VARCHAR(500)
);

-- ============================================================================
-- TABLE: Events
-- ============================================================================
CREATE TABLE IF NOT EXISTS "Events" (
    "EventID" SERIAL PRIMARY KEY,
    "EventName" VARCHAR(255) NOT NULL REFERENCES "EventsTemplates"("EventName") ON DELETE RESTRICT,
    "EventDateTimeStart" TIMESTAMP NOT NULL,
    "EventDateTimeEnd" TIMESTAMP,
    "EventLocation" VARCHAR(255),
    "EventCapacity" INTEGER,
    "EventRegistrationDeadline" TIMESTAMP
);

-- ============================================================================
-- TABLE: Registrations
-- ============================================================================
CREATE TABLE IF NOT EXISTS "Registrations" (
    "RegistrationID" SERIAL PRIMARY KEY,
    "EventID" INTEGER NOT NULL REFERENCES "Events"("EventID") ON DELETE CASCADE,
    "ParticipantID" INTEGER NOT NULL REFERENCES "Participants"("ParticipantID") ON DELETE CASCADE,
    "RegistrationStatus" VARCHAR(50) DEFAULT 'registered',
    "RegistrationAttendedFlag" BOOLEAN DEFAULT FALSE,
    "RegistrationCheckInTime" TIMESTAMP,
    UNIQUE("EventID", "ParticipantID")
);

-- ============================================================================
-- TABLE: Surveys
-- ============================================================================
CREATE TABLE IF NOT EXISTS "Surveys" (
    "SurveyID" SERIAL PRIMARY KEY,
    "RegistrationID" INTEGER NOT NULL UNIQUE REFERENCES "Registrations"("RegistrationID") ON DELETE CASCADE,
    "SurveySatisfactionScore" INTEGER CHECK ("SurveySatisfactionScore" >= 1 AND "SurveySatisfactionScore" <= 5),
    "SurveyUsefulnessScore" INTEGER CHECK ("SurveyUsefulnessScore" >= 1 AND "SurveyUsefulnessScore" <= 5),
    "SurveyInstructorScore" INTEGER CHECK ("SurveyInstructorScore" >= 1 AND "SurveyInstructorScore" <= 5),
    "SurveyRecommendationScore" INTEGER CHECK ("SurveyRecommendationScore" >= 1 AND "SurveyRecommendationScore" <= 10),
    "SurveyOverallScore" INTEGER CHECK ("SurveyOverallScore" >= 1 AND "SurveyOverallScore" <= 5),
    "SurveyNPSBucket" VARCHAR(50),
    "SurveyComments" TEXT,
    "SurveySubmissionDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE: MilestonesTypes
-- ============================================================================
CREATE TABLE IF NOT EXISTS "MilestonesTypes" (
    "MilestoneID" SERIAL PRIMARY KEY,
    "MilestoneTitle" VARCHAR(255) NOT NULL UNIQUE
);

-- ============================================================================
-- TABLE: Milestones
-- ============================================================================
CREATE TABLE IF NOT EXISTS "Milestones" (
    "MilestoneID" INTEGER NOT NULL REFERENCES "MilestonesTypes"("MilestoneID") ON DELETE RESTRICT,
    "ParticipantID" INTEGER NOT NULL REFERENCES "Participants"("ParticipantID") ON DELETE CASCADE,
    "MilestoneDate" DATE NOT NULL,
    PRIMARY KEY ("MilestoneID", "ParticipantID", "MilestoneDate")
);

-- ============================================================================
-- TABLE: Donations
-- ============================================================================
CREATE TABLE IF NOT EXISTS "Donations" (
    "DonationID" SERIAL PRIMARY KEY,
    "ParticipantID" INTEGER REFERENCES "Participants"("ParticipantID") ON DELETE SET NULL,
    "DonationNumber" INTEGER NOT NULL,
    "DonationDateRaw" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "DonationAmountRaw" DECIMAL(10, 2) NOT NULL,
    UNIQUE("ParticipantID", "DonationNumber")
);

-- ============================================================================
-- TABLE: DonationsSummary
-- ============================================================================
CREATE TABLE IF NOT EXISTS "DonationsSummary" (
    "ParticipantID" INTEGER PRIMARY KEY REFERENCES "Participants"("ParticipantID") ON DELETE CASCADE,
    "TotalDonations" DECIMAL(10, 2) DEFAULT 0
);

-- ============================================================================
-- TABLE: PasswordTokens
-- ============================================================================
CREATE TABLE IF NOT EXISTS "PasswordTokens" (
    "Id" SERIAL PRIMARY KEY,
    "ParticipantID" INTEGER NOT NULL REFERENCES "Participants"("ParticipantID") ON DELETE CASCADE,
    "Token" UUID NOT NULL UNIQUE,
    "Purpose" VARCHAR(50) NOT NULL,
    "ExpiresAt" TIMESTAMP NOT NULL,
    "UsedAt" TIMESTAMP,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES for Performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_participants_email ON "Participants"("ParticipantEmail");
CREATE INDEX IF NOT EXISTS idx_events_datetime ON "Events"("EventDateTimeStart");
CREATE INDEX IF NOT EXISTS idx_registrations_event ON "Registrations"("EventID");
CREATE INDEX IF NOT EXISTS idx_registrations_participant ON "Registrations"("ParticipantID");
CREATE INDEX IF NOT EXISTS idx_milestones_participant ON "Milestones"("ParticipantID");
CREATE INDEX IF NOT EXISTS idx_donations_participant ON "Donations"("ParticipantID");
CREATE INDEX IF NOT EXISTS idx_password_tokens_token ON "PasswordTokens"("Token");
CREATE INDEX IF NOT EXISTS idx_password_tokens_participant ON "PasswordTokens"("ParticipantID");

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Insert a test admin participant (optional - for testing)
-- NOTE: You'll need to set the password hash using the application's signup/login flow
-- or generate a bcrypt hash manually. The PasswordHash field can be NULL initially.
INSERT INTO "Participants" (
    "ParticipantEmail",
    "ParticipantFirstName",
    "ParticipantLastName",
    "ParticipantRole",
    "PasswordHash"
) VALUES (
    'admin@test.com',
    'Admin',
    'User',
    'admin',
    NULL  -- Set password through the application or use bcrypt to hash your password
) ON CONFLICT ("ParticipantEmail") DO NOTHING;

-- Insert some sample milestone types
INSERT INTO "MilestonesTypes" ("MilestoneTitle") VALUES
    ('Completed Workshop'),
    ('Attended Event'),
    ('Received Scholarship'),
    ('Mentorship Program'),
    ('Leadership Training')
ON CONFLICT ("MilestoneTitle") DO NOTHING;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. All table and column names use PascalCase to match the application code
-- 2. Foreign key constraints ensure referential integrity
-- 3. Unique constraints prevent duplicate registrations and donations
-- 4. Check constraints validate survey score ranges
-- 5. Indexes improve query performance for common lookups
-- 6. The PasswordHash column stores bcrypt hashed passwords
-- 7. PasswordTokens table supports password creation/reset flows

