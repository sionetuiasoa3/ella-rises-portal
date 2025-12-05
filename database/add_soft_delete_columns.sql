-- Add soft delete columns to Participants table
-- Run this script to add IsDeleted and DeletedAt columns

ALTER TABLE "Participants" 
ADD COLUMN IF NOT EXISTS "IsDeleted" BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE "Participants" 
ADD COLUMN IF NOT EXISTS "DeletedAt" TIMESTAMPTZ NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_participants_is_deleted ON "Participants"("IsDeleted");

