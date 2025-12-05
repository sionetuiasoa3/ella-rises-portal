-- Fix Events table EventID column (from ChatGPT)
-- This script uses pg_get_serial_sequence to properly handle sequence creation and linking

-- Optional: see current definition of EventID before changes
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
  AND table_name = 'Events'
  AND column_name = 'EventID';

DO $$
DECLARE
    seq_name text;
    seq_qual text;
    max_id   bigint;
BEGIN
    -- Try to get the sequence already associated with EventID (SERIAL/IDENTITY)
    SELECT pg_get_serial_sequence('"Events"', 'EventID')
    INTO seq_name;
    
    -- If there is no sequence associated, create/link one
    IF seq_name IS NULL THEN
        -- base name for our sequence
        seq_name := 'Events_EventID_seq';
        
        -- fully qualified, correctly quoted identifier: public."Events_EventID_seq"
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
        
        -- Attach sequence as default for EventID
        EXECUTE format(
            'ALTER TABLE "Events" ALTER COLUMN "EventID" SET DEFAULT nextval(%L)',
            seq_qual   -- this becomes 'public."Events_EventID_seq"'
        );
        
        -- Make the sequence owned by the column
        EXECUTE format(
            'ALTER SEQUENCE %s OWNED BY "Events"."EventID"',
            seq_qual
        );
    ELSE
        -- If pg_get_serial_sequence returned something, use it as-is
        -- e.g., 'public."Events_EventID_seq"' or 'public.events_eventid_seq'
        seq_qual := seq_name;
    END IF;
    
    -- Now sync the sequence to the current max(EventID)
    EXECUTE 'SELECT COALESCE(MAX("EventID"), 0) FROM "Events"'
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
  AND table_name = 'Events'
  AND column_name = 'EventID';

