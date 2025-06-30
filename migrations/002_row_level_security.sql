-- ============================================
-- ✅ Step 1: Enable RLS on All Tables
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE factories ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ✅ Step 2: Grant Permissions to service_role
-- ============================================
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================
-- ✅ Step 3: Add Policies for All Tables
-- ============================================

-- USERS
CREATE POLICY "Allow full access" ON users USING (true) WITH CHECK (true);

-- CUSTOMERS
CREATE POLICY "Allow full access" ON customers USING (true) WITH CHECK (true);

-- ORDERS
CREATE POLICY "Allow full access" ON orders USING (true) WITH CHECK (true);

-- ORDER_DETAILS
CREATE POLICY "Allow full access" ON order_details USING (true) WITH CHECK (true);

-- PRODUCTS
CREATE POLICY "Allow full access" ON products USING (true) WITH CHECK (true);

-- ITEMS
CREATE POLICY "Allow full access" ON items USING (true) WITH CHECK (true);

-- STOCK
CREATE POLICY "Allow full access" ON stock USING (true) WITH CHECK (true);

-- FACTORY
CREATE POLICY "Allow full access" ON factories USING (true) WITH CHECK (true);

-- COMPANY
CREATE POLICY "Allow full access" ON companies USING (true) WITH CHECK (true);

-- ACTIVITY_LOG
CREATE POLICY "Allow full access" ON activity_log USING (true) WITH CHECK (true);

-- PERMISSIONS
CREATE POLICY "Allow full access" ON permissions USING (true) WITH CHECK (true);

-- ROLES
CREATE POLICY "Allow full access" ON roles USING (true) WITH CHECK (true);

-- ROLE_PERMISSIONS
CREATE POLICY "Allow full access" ON role_permissions USING (true) WITH CHECK (true);

-- ============================================
-- ✅ Step 4: Default Privileges for Future Tables
-- ============================================
ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT USAGE, SELECT ON SEQUENCES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
GRANT ALL ON SEQUENCES TO service_role; 