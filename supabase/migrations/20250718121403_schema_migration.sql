-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.activity_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  module_name text NOT NULL,
  record_id text,
  change_log text,
  modified_at timestamp with time zone NOT NULL DEFAULT now(),
  modified_by jsonb NOT NULL,
  from_module character varying,
  to_module character varying,
  CONSTRAINT activity_log_pkey PRIMARY KEY (id)
);
CREATE TABLE public.companies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  factory_id uuid,
  name character varying NOT NULL,
  phone character varying,
  address text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_deleted boolean DEFAULT false,
  CONSTRAINT companies_pkey PRIMARY KEY (id)
);
CREATE TABLE public.customers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  address text,
  phone character varying,
  email character varying,
  status character varying DEFAULT 'active'::character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_deleted boolean DEFAULT false,
  CONSTRAINT customers_pkey PRIMARY KEY (id)
);
CREATE TABLE public.factories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid,
  location character varying,
  address text,
  phone character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_deleted boolean DEFAULT false,
  CONSTRAINT factories_pkey PRIMARY KEY (id),
  CONSTRAINT fk_factories_company FOREIGN KEY (company_id) REFERENCES public.companies(id)
);
CREATE TABLE public.items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  availability boolean DEFAULT true,
  factory_id uuid,
  company_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_deleted boolean DEFAULT false,
  sku character varying,
  category character varying,
  default_supplier character varying,
  unit_of_measure character varying,
  average_cost numeric,
  value_in_stock numeric,
  in_stock numeric,
  expected numeric,
  committed numeric,
  safety_stock numeric,
  calculated_stock numeric,
  location character varying,
  CONSTRAINT items_pkey PRIMARY KEY (id),
  CONSTRAINT items_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id),
  CONSTRAINT items_factory_id_fkey FOREIGN KEY (factory_id) REFERENCES public.factories(id)
);
CREATE TABLE public.order_detail_ingredients (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_details_id uuid,
  order_id uuid,
  item_id uuid,
  quantity numeric NOT NULL,
  status character varying DEFAULT 'pending'::character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_deleted boolean DEFAULT false,
  factory_id uuid,
  company_id uuid,
  CONSTRAINT order_detail_ingredients_pkey PRIMARY KEY (id),
  CONSTRAINT order_detail_ingredients_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id),
  CONSTRAINT order_detail_ingredients_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id),
  CONSTRAINT order_detail_ingredients_factory_id_fkey FOREIGN KEY (factory_id) REFERENCES public.factories(id),
  CONSTRAINT order_detail_ingredients_order_details_id_fkey FOREIGN KEY (order_details_id) REFERENCES public.order_details(id),
  CONSTRAINT order_detail_ingredients_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);
CREATE TABLE public.order_details (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid,
  product_id uuid,
  status character varying DEFAULT 'pending'::character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_deleted boolean DEFAULT false,
  factory_id uuid,
  company_id uuid,
  product_quantity bigint NOT NULL DEFAULT 1,
  product_properties jsonb DEFAULT '{}'::jsonb,
  price_per_unit numeric,
  total_tax numeric DEFAULT 0.00,
  line_no integer,
  order_details_number text,
  CONSTRAINT order_details_pkey PRIMARY KEY (id),
  CONSTRAINT order_details_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id),
  CONSTRAINT order_details_factory_id_fkey FOREIGN KEY (factory_id) REFERENCES public.factories(id),
  CONSTRAINT order_details_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_details_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_id uuid,
  order_date date NOT NULL,
  status character varying DEFAULT 'pending'::character varying,
  is_deleted boolean DEFAULT false,
  company_id uuid,
  factory_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  total_price numeric DEFAULT 1200,
  order_number bigint,
  expected_date date,
  total_discount numeric DEFAULT 0.00,
  total_tax numeric DEFAULT 0.00,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id),
  CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id),
  CONSTRAINT orders_factory_id_fkey FOREIGN KEY (factory_id) REFERENCES public.factories(id)
);
CREATE TABLE public.permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  module_name character varying NOT NULL,
  can_read boolean DEFAULT false,
  can_write boolean DEFAULT false,
  can_delete boolean DEFAULT false,
  can_manage_users boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT permissions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  description text,
  base_unit character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_deleted boolean DEFAULT false,
  tax_rate numeric NOT NULL DEFAULT 15.00 CHECK (tax_rate >= 0::numeric),
  sku character varying,
  category character varying,
  default_supplier character varying,
  unit_of_measure character varying,
  average_cost numeric,
  value_in_stock numeric,
  in_stock numeric,
  expected numeric,
  committed numeric,
  safety_stock numeric,
  calculated_stock numeric,
  location character varying,
  CONSTRAINT products_pkey PRIMARY KEY (id)
);
CREATE TABLE public.purchase_orders (
  id text NOT NULL DEFAULT generate_purchase_order_id(),
  supplier_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  expected_at date,
  status text DEFAULT 'pending'::text,
  order_cost numeric DEFAULT 0,
  invoice_number text,
  item_id uuid,
  quantity bigint DEFAULT 0 CHECK (quantity >= 0),
  CONSTRAINT purchase_orders_pkey PRIMARY KEY (id),
  CONSTRAINT purchase_orders_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id),
  CONSTRAINT purchase_orders_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id)
);
CREATE TABLE public.role_permissions (
  role_id uuid NOT NULL,
  permission_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id),
  CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id),
  CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id)
);
CREATE TABLE public.roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  role_name character varying NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT roles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.shipping_details (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'not_shipped'::text,
  shipped_date date,
  shipping_address text,
  shipping_method text,
  notes text,
  carrier text,
  shipping_cost numeric DEFAULT 0.00,
  tracking_number text,
  CONSTRAINT shipping_details_pkey PRIMARY KEY (id),
  CONSTRAINT shipping_details_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);
CREATE TABLE public.stock (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  item_id uuid,
  factory_id uuid,
  item_type text NOT NULL,
  available_quantity numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  product_id uuid,
  status text DEFAULT 'in_stock'::text,
  expected_quantity numeric DEFAULT 0,
  sku character varying,
  category character varying,
  default_supplier character varying,
  unit_of_measure character varying,
  average_cost numeric,
  value_in_stock numeric,
  in_stock numeric,
  expected numeric,
  committed numeric,
  safety_stock numeric,
  calculated_stock numeric,
  location character varying,
  CONSTRAINT stock_pkey PRIMARY KEY (id),
  CONSTRAINT stock_factory_id_fkey FOREIGN KEY (factory_id) REFERENCES public.factories(id),
  CONSTRAINT stock_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT stock_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id)
);
CREATE TABLE public.stock_movements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  stock_id uuid NOT NULL,
  movement_type text NOT NULL CHECK (movement_type = ANY (ARRAY['in'::text, 'out'::text, 'adjustment'::text])),
  quantity_change numeric NOT NULL,
  cost_per_unit numeric,
  balance_after numeric,
  value_in_stock_after numeric,
  average_cost_after numeric,
  reference_type text,
  reference_id text,
  company_id uuid,
  factory_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  remarks text,
  CONSTRAINT stock_movements_pkey PRIMARY KEY (id),
  CONSTRAINT fk_stock_movements_factory FOREIGN KEY (factory_id) REFERENCES public.factories(id),
  CONSTRAINT fk_stock_movements_company FOREIGN KEY (company_id) REFERENCES public.companies(id),
  CONSTRAINT fk_stock_movements_stock FOREIGN KEY (stock_id) REFERENCES public.stock(id)
);
CREATE TABLE public.suppliers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text])),
  lead_time bigint DEFAULT 4,
  CONSTRAINT suppliers_pkey PRIMARY KEY (id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  password_hash character varying NOT NULL,
  role_id uuid,
  factory_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_deleted boolean DEFAULT false,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id),
  CONSTRAINT users_factory_id_fkey FOREIGN KEY (factory_id) REFERENCES public.factories(id)
);
create trigger update_users_updated_at BEFORE
update on users for EACH row
execute FUNCTION update_updated_at_column ();

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
