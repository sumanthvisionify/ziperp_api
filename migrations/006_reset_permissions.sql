-- Reset table ownership to postgres
ALTER TABLE IF EXISTS public.users OWNER TO postgres;
ALTER TABLE IF EXISTS public.customers OWNER TO postgres;
ALTER TABLE IF EXISTS public.orders OWNER TO postgres;
ALTER TABLE IF EXISTS public.order_details OWNER TO postgres;
ALTER TABLE IF EXISTS public.products OWNER TO postgres;
ALTER TABLE IF EXISTS public.items OWNER TO postgres;
ALTER TABLE IF EXISTS public.stock OWNER TO postgres;
ALTER TABLE IF EXISTS public.factories OWNER TO postgres;
ALTER TABLE IF EXISTS public.companies OWNER TO postgres;
ALTER TABLE IF EXISTS public.activity_log OWNER TO postgres;
ALTER TABLE IF EXISTS public.permissions OWNER TO postgres;
ALTER TABLE IF EXISTS public.roles OWNER TO postgres;
ALTER TABLE IF EXISTS public.role_permissions OWNER TO postgres;

-- Revoke all existing privileges
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM PUBLIC;

-- Grant access to postgres
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO postgres;

-- Grant access to service_role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON SCHEMA public TO service_role;

-- Grant access to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Verify RLS is disabled for all tables
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_details DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.factories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions DISABLE ROW LEVEL SECURITY; 