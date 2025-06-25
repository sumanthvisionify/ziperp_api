-- Row Level Security (RLS) Policies for ERP System
-- Enable RLS on all tables

-- Enable RLS on main tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE factories ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_detail_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Create function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT r.role_name 
    FROM users u 
    JOIN roles r ON u.role_id = r.id 
    WHERE u.id = user_uuid
    AND u.is_deleted = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get current user's factory
CREATE OR REPLACE FUNCTION get_user_factory(user_uuid UUID)
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT u.factory_id 
    FROM users u 
    WHERE u.id = user_uuid
    AND u.is_deleted = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user has permission for module
CREATE OR REPLACE FUNCTION user_has_permission(user_uuid UUID, module_name TEXT, permission_type TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM users u
    JOIN roles r ON u.role_id = r.id
    JOIN role_permissions rp ON r.id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE u.id = user_uuid
    AND u.is_deleted = false
    AND p.module_name = module_name
    AND (
      (permission_type = 'read' AND p.can_read = true) OR
      (permission_type = 'write' AND p.can_write = true) OR
      (permission_type = 'delete' AND p.can_delete = true) OR
      (permission_type = 'manage_users' AND p.can_manage_users = true)
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- COMPANIES TABLE POLICIES
-- ========================================

-- Super admin and admin can see all companies
CREATE POLICY "companies_select_policy" ON companies
  FOR SELECT
  USING (
    get_user_role(auth.uid()) IN ('super_admin', 'admin') OR
    (get_user_role(auth.uid()) IN ('manager', 'operator', 'viewer') AND 
     EXISTS (
       SELECT 1 FROM factories f WHERE f.company_id = companies.id AND f.id = get_user_factory(auth.uid())
     ))
  );

-- Only super admin can insert/update/delete companies
CREATE POLICY "companies_insert_policy" ON companies
  FOR INSERT
  WITH CHECK (get_user_role(auth.uid()) = 'super_admin');

CREATE POLICY "companies_update_policy" ON companies
  FOR UPDATE
  USING (get_user_role(auth.uid()) = 'super_admin');

CREATE POLICY "companies_delete_policy" ON companies
  FOR DELETE
  USING (get_user_role(auth.uid()) = 'super_admin');

-- ========================================
-- FACTORIES TABLE POLICIES
-- ========================================

-- Users can see factories in their company or their assigned factory
CREATE POLICY "factories_select_policy" ON factories
  FOR SELECT
  USING (
    get_user_role(auth.uid()) IN ('super_admin', 'admin') OR
    (get_user_role(auth.uid()) IN ('manager', 'operator', 'viewer') AND 
     (factories.id = get_user_factory(auth.uid()) OR 
      EXISTS (SELECT 1 FROM factories f2 WHERE f2.company_id = factories.company_id AND f2.id = get_user_factory(auth.uid()))))
  );

-- Only super admin and admin can modify factories
CREATE POLICY "factories_insert_policy" ON factories
  FOR INSERT
  WITH CHECK (get_user_role(auth.uid()) IN ('super_admin', 'admin'));

CREATE POLICY "factories_update_policy" ON factories
  FOR UPDATE
  USING (get_user_role(auth.uid()) IN ('super_admin', 'admin'));

CREATE POLICY "factories_delete_policy" ON factories
  FOR DELETE
  USING (get_user_role(auth.uid()) IN ('super_admin', 'admin'));

-- ========================================
-- USERS TABLE POLICIES
-- ========================================

-- Users can see other users in their factory/company hierarchy
CREATE POLICY "users_select_policy" ON users
  FOR SELECT
  USING (
    get_user_role(auth.uid()) IN ('super_admin', 'admin') OR
    (get_user_role(auth.uid()) = 'manager' AND users.factory_id = get_user_factory(auth.uid())) OR
    users.id = auth.uid()
  );

-- Only super admin and admin can create users
CREATE POLICY "users_insert_policy" ON users
  FOR INSERT
  WITH CHECK (
    get_user_role(auth.uid()) IN ('super_admin', 'admin') OR
    (get_user_role(auth.uid()) = 'manager' AND user_has_permission(auth.uid(), 'Settings', 'write'))
  );

-- Users can update themselves, managers can update users in their factory
CREATE POLICY "users_update_policy" ON users
  FOR UPDATE
  USING (
    get_user_role(auth.uid()) IN ('super_admin', 'admin') OR
    (get_user_role(auth.uid()) = 'manager' AND users.factory_id = get_user_factory(auth.uid())) OR
    users.id = auth.uid()
  );

-- Only super admin and admin can delete users
CREATE POLICY "users_delete_policy" ON users
  FOR DELETE
  USING (get_user_role(auth.uid()) IN ('super_admin', 'admin'));

-- ========================================
-- ORDERS TABLE POLICIES
-- ========================================

-- Users can see orders from their factory
CREATE POLICY "orders_select_policy" ON orders
  FOR SELECT
  USING (
    get_user_role(auth.uid()) IN ('super_admin', 'admin') OR
    (user_has_permission(auth.uid(), 'Sales', 'read') AND 
     (orders.factory_id = get_user_factory(auth.uid()) OR get_user_factory(auth.uid()) IS NULL))
  );

-- Users with Sales write permission can create orders
CREATE POLICY "orders_insert_policy" ON orders
  FOR INSERT
  WITH CHECK (
    user_has_permission(auth.uid(), 'Sales', 'write') AND
    (orders.factory_id = get_user_factory(auth.uid()) OR get_user_factory(auth.uid()) IS NULL)
  );

-- Users with Sales write permission can update orders in their factory
CREATE POLICY "orders_update_policy" ON orders
  FOR UPDATE
  USING (
    user_has_permission(auth.uid(), 'Sales', 'write') AND
    (orders.factory_id = get_user_factory(auth.uid()) OR get_user_factory(auth.uid()) IS NULL)
  );

-- Users with Sales delete permission can delete orders
CREATE POLICY "orders_delete_policy" ON orders
  FOR DELETE
  USING (
    user_has_permission(auth.uid(), 'Sales', 'delete') AND
    (orders.factory_id = get_user_factory(auth.uid()) OR get_user_factory(auth.uid()) IS NULL)
  );

-- ========================================
-- ORDER DETAILS TABLE POLICIES
-- ========================================

-- Users can see order details if they can see the parent order
CREATE POLICY "order_details_select_policy" ON order_details
  FOR SELECT
  USING (
    get_user_role(auth.uid()) IN ('super_admin', 'admin') OR
    (user_has_permission(auth.uid(), 'Sales', 'read') AND 
     EXISTS (SELECT 1 FROM orders o WHERE o.id = order_details.order_id AND 
             (o.factory_id = get_user_factory(auth.uid()) OR get_user_factory(auth.uid()) IS NULL)))
  );

-- Apply same permissions as orders for insert/update/delete
CREATE POLICY "order_details_insert_policy" ON order_details
  FOR INSERT
  WITH CHECK (
    user_has_permission(auth.uid(), 'Sales', 'write') AND
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_details.order_id AND 
            (o.factory_id = get_user_factory(auth.uid()) OR get_user_factory(auth.uid()) IS NULL))
  );

CREATE POLICY "order_details_update_policy" ON order_details
  FOR UPDATE
  USING (
    user_has_permission(auth.uid(), 'Sales', 'write') AND
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_details.order_id AND 
            (o.factory_id = get_user_factory(auth.uid()) OR get_user_factory(auth.uid()) IS NULL))
  );

CREATE POLICY "order_details_delete_policy" ON order_details
  FOR DELETE
  USING (
    user_has_permission(auth.uid(), 'Sales', 'delete') AND
    EXISTS (SELECT 1 FROM orders o WHERE o.id = order_details.order_id AND 
            (o.factory_id = get_user_factory(auth.uid()) OR get_user_factory(auth.uid()) IS NULL))
  );

-- ========================================
-- ITEMS TABLE POLICIES
-- ========================================

-- Users can see items from their factory
CREATE POLICY "items_select_policy" ON items
  FOR SELECT
  USING (
    get_user_role(auth.uid()) IN ('super_admin', 'admin') OR
    (user_has_permission(auth.uid(), 'Stock', 'read') AND 
     (items.factory_id = get_user_factory(auth.uid()) OR get_user_factory(auth.uid()) IS NULL))
  );

-- Users with Stock write permission can manage items in their factory
CREATE POLICY "items_insert_policy" ON items
  FOR INSERT
  WITH CHECK (
    user_has_permission(auth.uid(), 'Stock', 'write') AND
    (items.factory_id = get_user_factory(auth.uid()) OR get_user_factory(auth.uid()) IS NULL)
  );

CREATE POLICY "items_update_policy" ON items
  FOR UPDATE
  USING (
    user_has_permission(auth.uid(), 'Stock', 'write') AND
    (items.factory_id = get_user_factory(auth.uid()) OR get_user_factory(auth.uid()) IS NULL)
  );

CREATE POLICY "items_delete_policy" ON items
  FOR DELETE
  USING (
    user_has_permission(auth.uid(), 'Stock', 'delete') AND
    (items.factory_id = get_user_factory(auth.uid()) OR get_user_factory(auth.uid()) IS NULL)
  );

-- ========================================
-- STOCK TABLE POLICIES
-- ========================================

-- Users can see stock from their factory
CREATE POLICY "stock_select_policy" ON stock
  FOR SELECT
  USING (
    get_user_role(auth.uid()) IN ('super_admin', 'admin') OR
    (user_has_permission(auth.uid(), 'Stock', 'read') AND 
     (stock.factory_id = get_user_factory(auth.uid()) OR get_user_factory(auth.uid()) IS NULL))
  );

-- Users with Stock write permission can manage stock in their factory
CREATE POLICY "stock_insert_policy" ON stock
  FOR INSERT
  WITH CHECK (
    user_has_permission(auth.uid(), 'Stock', 'write') AND
    (stock.factory_id = get_user_factory(auth.uid()) OR get_user_factory(auth.uid()) IS NULL)
  );

CREATE POLICY "stock_update_policy" ON stock
  FOR UPDATE
  USING (
    user_has_permission(auth.uid(), 'Stock', 'write') AND
    (stock.factory_id = get_user_factory(auth.uid()) OR get_user_factory(auth.uid()) IS NULL)
  );

CREATE POLICY "stock_delete_policy" ON stock
  FOR DELETE
  USING (
    user_has_permission(auth.uid(), 'Stock', 'delete') AND
    (stock.factory_id = get_user_factory(auth.uid()) OR get_user_factory(auth.uid()) IS NULL)
  );

-- ========================================
-- ACTIVITY LOG POLICIES
-- ========================================

-- Users can see activity logs related to their factory or their own actions
CREATE POLICY "activity_log_select_policy" ON activity_log
  FOR SELECT
  USING (
    get_user_role(auth.uid()) IN ('super_admin', 'admin') OR
    activity_log.user_id = auth.uid() OR
    (get_user_role(auth.uid()) = 'manager' AND 
     EXISTS (SELECT 1 FROM users u WHERE u.id = activity_log.user_id AND u.factory_id = get_user_factory(auth.uid())))
  );

-- Only the system can insert activity logs (through service functions)
CREATE POLICY "activity_log_insert_policy" ON activity_log
  FOR INSERT
  WITH CHECK (true); -- Allow inserts from application logic

-- No direct updates or deletes on activity logs
CREATE POLICY "activity_log_update_policy" ON activity_log
  FOR UPDATE
  USING (false);

CREATE POLICY "activity_log_delete_policy" ON activity_log
  FOR DELETE
  USING (false); 