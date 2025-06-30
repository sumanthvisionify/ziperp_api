-- ============================================
-- ✅ Step 1: Drop All Existing Policies
-- ============================================
DROP POLICY IF EXISTS "Activity_log: allow insert" ON activity_log;
DROP POLICY IF EXISTS "Activity_log: allow read" ON activity_log;
DROP POLICY IF EXISTS "Activity_log: allow update" ON activity_log;
DROP POLICY IF EXISTS "Allow delete for all" ON activity_log;
DROP POLICY IF EXISTS "Allow insert for all" ON activity_log;
DROP POLICY IF EXISTS "Allow read for all" ON activity_log;
DROP POLICY IF EXISTS "Allow update for all" ON activity_log;
DROP POLICY IF EXISTS "service_role full access" ON activity_log;

-- Do the same for all other tables
DROP POLICY IF EXISTS "Allow full access" ON users;
DROP POLICY IF EXISTS "Allow full access" ON customers;
DROP POLICY IF EXISTS "Allow full access" ON orders;
DROP POLICY IF EXISTS "Allow full access" ON order_details;
DROP POLICY IF EXISTS "Allow full access" ON products;
DROP POLICY IF EXISTS "Allow full access" ON items;
DROP POLICY IF EXISTS "Allow full access" ON stock;
DROP POLICY IF EXISTS "Allow full access" ON factories;
DROP POLICY IF EXISTS "Allow full access" ON companies;
DROP POLICY IF EXISTS "Allow full access" ON permissions;
DROP POLICY IF EXISTS "Allow full access" ON roles;
DROP POLICY IF EXISTS "Allow full access" ON role_permissions;

-- ============================================
-- ✅ Step 2: Grant Full Access to service_role
-- ============================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ============================================
-- ✅ Step 3: Verify RLS is Disabled
-- ============================================
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_details DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE items DISABLE ROW LEVEL SECURITY;
ALTER TABLE stock DISABLE ROW LEVEL SECURITY;
ALTER TABLE factories DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions DISABLE ROW LEVEL SECURITY; 