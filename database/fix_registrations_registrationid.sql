-- Fix Registrations table RegistrationID column sequence
-- This script uses pg_get_serial_sequence to properly handle sequence creation and linking

-- Optional: see current definition of RegistrationID before changes
SELECT
    table_schema,
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    is_identity,
    identity_generation
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'Registrations'
  AND column_name = 'RegistrationID';

DO $$
DECLARE
    seq_name text;
    seq_qual text;
    max_id   bigint;
BEGIN
    -- Try to get the sequence already associated with RegistrationID (SERIAL/IDENTITY)
    SELECT pg_get_serial_sequence('"Registrations"', 'RegistrationID')
    INTO seq_name;
    
    -- If there is no sequence associated, create/link one
    IF seq_name IS NULL THEN
        -- base name for our sequence
        seq_name := 'Registrations_RegistrationID_seq';
        
        -- fully qualified, correctly quoted identifier: public."Registrations_RegistrationID_seq"
        seq_qual := format('public.%I', seq_name);
        
        -- Create the sequence if it doesn't already exist
        IF NOT EXISTS (
            SELECT 1
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relkind = 'S'
              AND c.relname = seq_name
              AND n.nspname = 'public'
        ) THEN
            EXECUTE format('CREATE SEQUENCE %s', seq_qual);
        END IF;
        
        -- Attach sequence as default for RegistrationID
        EXECUTE format(
            'ALTER TABLE "Registrations" ALTER COLUMN "RegistrationID" SET DEFAULT nextval(%L)',
            seq_qual   -- this becomes 'public."Registrations_RegistrationID_seq"'
        );
        
        -- Make the sequence owned by the column
        EXECUTE format(
            'ALTER SEQUENCE %s OWNED BY "Registrations"."RegistrationID"',
            seq_qual
        );
    ELSE
        -- If pg_get_serial_sequence returned something, use it as-is
        -- e.g., 'public."Registrations_RegistrationID_seq"' or 'public.registrations_registrationid_seq'
        seq_qual := seq_name;
    END IF;
    
    -- Now sync the sequence to the current max(RegistrationID)
    EXECUTE 'SELECT COALESCE(MAX("RegistrationID"), 0) FROM "Registrations"'
    INTO max_id;
    
    EXECUTE format(
        'SELECT setval(%L, %s, true)',
        seq_qual,   -- same correctly-qualified name
        max_id
    );
END
$$;

-- Verify after changes
SELECT
    table_schema,
    table_name,
    column_name,
    column_default,
    is_identity,
    identity_generation
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'Registrations'
  AND column_name = 'RegistrationID';

