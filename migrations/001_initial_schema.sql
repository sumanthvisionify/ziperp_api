create table public.activity_log (
  id uuid not null default gen_random_uuid (),
  module_name text not null,
  record_id text null,
  change_log text null,
  time_stamp timestamp with time zone not null default now(),
  performed_by jsonb not null,
  constraint activity_log_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_activity_log_user_id on public.activity_log using btree (module_name) TABLESPACE pg_default;

create index IF not exists idx_activity_log_order_id on public.activity_log using btree (record_id) TABLESPACE pg_default;;

create table public.companies (
  id uuid not null default gen_random_uuid (),
  factory_id uuid null,
  name character varying(255) not null,
  phone character varying(50) null,
  address text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  is_deleted boolean null default false,
  constraint companies_pkey primary key (id),
  constraint fk_companies_factory foreign KEY (factory_id) references factories (id) on delete set null
) TABLESPACE pg_default;

create trigger update_companies_updated_at BEFORE
update on companies for EACH row
execute FUNCTION update_updated_at_column ();

create table public.customers (
  id uuid not null default gen_random_uuid (),
  name character varying(255) not null,
  address text null,
  phone character varying(50) null,
  email character varying(255) null,
  status character varying(50) null default 'active'::character varying,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  is_deleted boolean null default false,
  constraint customers_pkey primary key (id)
) TABLESPACE pg_default;

create trigger update_customers_updated_at BEFORE
update on customers for EACH row
execute FUNCTION update_updated_at_column ();

create table public.factories (
  id uuid not null default gen_random_uuid (),
  company_id uuid null,
  location character varying(255) null,
  address text null,
  phone character varying(50) null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  is_deleted boolean null default false,
  constraint factories_pkey primary key (id),
  constraint fk_factories_company foreign KEY (company_id) references companies (id) on delete set null
) TABLESPACE pg_default;

create trigger update_factories_updated_at BEFORE
update on factories for EACH row
execute FUNCTION update_updated_at_column ();

create table public.items (
  id uuid not null default gen_random_uuid (),
  name character varying(255) not null,
  availability boolean null default true,
  factory_id uuid null,
  company_id uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  is_deleted boolean null default false,
  constraint items_pkey primary key (id),
  constraint items_company_id_fkey foreign KEY (company_id) references companies (id) on delete set null,
  constraint items_factory_id_fkey foreign KEY (factory_id) references factories (id) on delete set null
) TABLESPACE pg_default;

create trigger update_items_updated_at BEFORE
update on items for EACH row
execute FUNCTION update_updated_at_column ();

create table public.order_detail_ingredients (
  id uuid not null default gen_random_uuid (),
  order_details_id uuid null,
  order_id uuid null,
  item_id uuid null,
  quantity numeric(15, 2) not null,
  status character varying(50) null default 'pending'::character varying,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  is_deleted boolean null default false,
  factory_id uuid null,
  company_id uuid null,
  constraint order_detail_ingredients_pkey primary key (id),
  constraint order_detail_ingredients_company_id_fkey foreign KEY (company_id) references companies (id) on delete set null,
  constraint order_detail_ingredients_factory_id_fkey foreign KEY (factory_id) references factories (id) on delete set null,
  constraint order_detail_ingredients_item_id_fkey foreign KEY (item_id) references items (id) on delete set null,
  constraint order_detail_ingredients_order_details_id_fkey foreign KEY (order_details_id) references order_details (id) on delete CASCADE,
  constraint order_detail_ingredients_order_id_fkey foreign KEY (order_id) references orders (id) on delete CASCADE
) TABLESPACE pg_default;

create trigger update_order_detail_ingredients_updated_at BEFORE
update on order_detail_ingredients for EACH row
execute FUNCTION update_updated_at_column ();

create table public.order_details (
  id uuid not null default gen_random_uuid (),
  order_id uuid null,
  product_id uuid null,
  status character varying(50) null default 'pending'::character varying,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  is_deleted boolean null default false,
  factory_id uuid null,
  company_id uuid null,
  constraint order_details_pkey primary key (id),
  constraint order_details_company_id_fkey foreign KEY (company_id) references companies (id) on delete set null,
  constraint order_details_factory_id_fkey foreign KEY (factory_id) references factories (id) on delete set null,
  constraint order_details_order_id_fkey foreign KEY (order_id) references orders (id) on delete CASCADE,
  constraint order_details_product_id_fkey foreign KEY (product_id) references products (id) on update CASCADE on delete set null
) TABLESPACE pg_default;

create trigger update_order_details_updated_at BEFORE
update on order_details for EACH row
execute FUNCTION update_updated_at_column ();

create table public.orders (
  id uuid not null default gen_random_uuid (),
  customer_id uuid null,
  order_date date not null,
  status character varying(50) null default 'pending'::character varying,
  is_deleted boolean null default false,
  company_id uuid null,
  factory_id uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  total_price numeric null default '1200'::numeric,
  order_number bigint null,
  constraint orders_pkey primary key (id),
  constraint orders_company_id_fkey foreign KEY (company_id) references companies (id) on delete set null,
  constraint orders_customer_id_fkey foreign KEY (customer_id) references customers (id) on delete set null,
  constraint orders_factory_id_fkey foreign KEY (factory_id) references factories (id) on delete set null
) TABLESPACE pg_default;

create trigger update_orders_updated_at BEFORE
update on orders for EACH row
execute FUNCTION update_updated_at_column ();

create trigger update_orders_updated_at BEFORE
update on orders for EACH row
execute FUNCTION update_updated_at_column ();

create table public.permissions (
  id uuid not null default gen_random_uuid (),
  module_name character varying(100) not null,
  can_read boolean null default false,
  can_write boolean null default false,
  can_delete boolean null default false,
  can_manage_users boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint permissions_pkey primary key (id)
) TABLESPACE pg_default;

create trigger update_permissions_updated_at BEFORE
update on permissions for EACH row
execute FUNCTION update_updated_at_column ();

create table public.products (
  id uuid not null default gen_random_uuid (),
  name character varying(255) not null,
  description text null,
  base_unit character varying(50) null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  is_deleted boolean null default false,
  constraint products_pkey primary key (id)
) TABLESPACE pg_default;

create trigger update_products_updated_at BEFORE
update on products for EACH row
execute FUNCTION update_updated_at_column ();

create table public.products (
  id uuid not null default gen_random_uuid (),
  name character varying(255) not null,
  description text null,
  base_unit character varying(50) null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  is_deleted boolean null default false,
  constraint products_pkey primary key (id)
) TABLESPACE pg_default;

create trigger update_products_updated_at BEFORE
update on products for EACH row
execute FUNCTION update_updated_at_column ();

create table public.purchase_orders (
  id text not null default generate_purchase_order_id (),
  supplier_id uuid null,
  created_at timestamp with time zone null default now(),
  expected_at date null,
  status text null default 'pending'::text,
  order_cost numeric(12, 2) null default 0,
  invoice_number text null,
  constraint purchase_orders_pkey primary key (id),
  constraint purchase_orders_supplier_id_fkey foreign KEY (supplier_id) references suppliers (id)
) TABLESPACE pg_default;

create table public.role_permissions (
  role_id uuid not null,
  permission_id uuid not null,
  created_at timestamp with time zone null default now(),
  constraint role_permissions_pkey primary key (role_id, permission_id),
  constraint role_permissions_permission_id_fkey foreign KEY (permission_id) references permissions (id) on delete CASCADE,
  constraint role_permissions_role_id_fkey foreign KEY (role_id) references roles (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.roles (
  id uuid not null default gen_random_uuid (),
  role_name character varying(100) not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint roles_pkey primary key (id),
  constraint roles_role_name_key unique (role_name)
) TABLESPACE pg_default;

create trigger update_roles_updated_at BEFORE
update on roles for EACH row
execute FUNCTION update_updated_at_column ();

create table public.stock (
  id uuid not null default gen_random_uuid (),
  item_id uuid null,
  factory_id uuid null,
  item_type public.item_type_enum not null,
  available_quantity numeric(15, 2) null default 0,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  product_id uuid null,
  status text null default 'in_stock'::text,
  constraint stock_pkey primary key (id),
  constraint stock_factory_id_fkey foreign KEY (factory_id) references factories (id) on delete set null,
  constraint stock_item_id_fkey foreign KEY (item_id) references items (id) on delete CASCADE,
  constraint stock_product_id_fkey foreign KEY (product_id) references products (id) on delete CASCADE,
  constraint only_one_reference check (
    (
      (
        (item_id is not null)
        and (product_id is null)
      )
      or (
        (item_id is null)
        and (product_id is not null)
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_stock_product_id on public.stock using btree (product_id) TABLESPACE pg_default;

create index IF not exists idx_stock_item_id on public.stock using btree (item_id) TABLESPACE pg_default;

create index IF not exists idx_stock_factory_id on public.stock using btree (factory_id) TABLESPACE pg_default;

create trigger update_stock_updated_at BEFORE
update on stock for EACH row
execute FUNCTION update_updated_at_column ();

create table public.suppliers (
  id uuid not null default gen_random_uuid (),
  name text not null,
  email text not null,
  phone text null,
  is_deleted boolean null default false,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  status text null default 'active'::text,
  constraint suppliers_pkey primary key (id),
  constraint suppliers_email_key unique (email),
  constraint suppliers_status_check check (
    (
      status = any (array['active'::text, 'inactive'::text])
    )
  )
) TABLESPACE pg_default;

create table public.users (
  id uuid not null default gen_random_uuid (),
  name character varying(255) not null,
  email character varying(255) not null,
  password_hash character varying(255) not null,
  role_id uuid null,
  factory_id uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  is_deleted boolean null default false,
  constraint users_pkey primary key (id),
  constraint users_email_key unique (email),
  constraint users_factory_id_fkey foreign KEY (factory_id) references factories (id) on delete set null,
  constraint users_role_id_fkey foreign KEY (role_id) references roles (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_users_email on public.users using btree (email) TABLESPACE pg_default;

create index IF not exists idx_users_role_id on public.users using btree (role_id) TABLESPACE pg_default;

create index IF not exists idx_users_factory_id on public.users using btree (factory_id) TABLESPACE pg_default;

create trigger update_users_updated_at BEFORE
update on users for EACH row
execute FUNCTION update_updated_at_column ();