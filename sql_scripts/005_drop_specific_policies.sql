-- Drop activity_log specific policies
DROP POLICY IF EXISTS "Activity_log: allow insert" ON activity_log;
DROP POLICY IF EXISTS "Activity_log: allow read" ON activity_log;
DROP POLICY IF EXISTS "Activity_log: allow update" ON activity_log;
DROP POLICY IF EXISTS "Allow delete for all" ON activity_log;
DROP POLICY IF EXISTS "Allow insert for all" ON activity_log;
DROP POLICY IF EXISTS "Allow read for all" ON activity_log;
DROP POLICY IF EXISTS "Allow update for all" ON activity_log;
DROP POLICY IF EXISTS "service_role full access" ON activity_log;

-- Drop all policies on all tables
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$; 