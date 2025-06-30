-- ============================================
-- ✅ Step 1: Disable RLS on All Tables
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

-- ============================================
-- ✅ Step 2: Drop All Policies
-- ============================================
DROP POLICY IF EXISTS "Allow full access" ON users;
DROP POLICY IF EXISTS "Allow full access" ON customers;
DROP POLICY IF EXISTS "Allow full access" ON orders;
DROP POLICY IF EXISTS "Allow full access" ON order_details;
DROP POLICY IF EXISTS "Allow full access" ON products;
DROP POLICY IF EXISTS "Allow full access" ON items;
DROP POLICY IF EXISTS "Allow full access" ON stock;
DROP POLICY IF EXISTS "Allow full access" ON factories;
DROP POLICY IF EXISTS "Allow full access" ON companies;
DROP POLICY IF EXISTS "Allow full access" ON activity_log;
DROP POLICY IF EXISTS "Allow full access" ON permissions;
DROP POLICY IF EXISTS "Allow full access" ON roles;
DROP POLICY IF EXISTS "Allow full access" ON role_permissions; 