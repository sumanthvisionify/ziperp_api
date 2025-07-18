-- Add shipping_details table
create table public.shipping_details (
  id uuid not null default gen_random_uuid (),
  order_id uuid not null,
  status text not null default 'not_shipped'::text,
  shipped_date date null,
  shipping_address text null,
  constraint shipping_details_pkey primary key (id),
  constraint shipping_details_order_id_fkey foreign KEY (order_id) references orders (id) on update CASCADE on delete CASCADE
) TABLESPACE pg_default;

-- Create index on order_id for better performance
create index IF not exists idx_shipping_details_order_id on public.shipping_details using btree (order_id) TABLESPACE pg_default;

-- Create index on status for filtering
create index IF not exists idx_shipping_details_status on public.shipping_details using btree (status) TABLESPACE pg_default;

-- Grant permissions
GRANT ALL ON public.shipping_details TO postgres;
GRANT ALL ON public.shipping_details TO service_role;
GRANT ALL ON public.shipping_details TO authenticated;

-- Disable RLS for shipping_details table
ALTER TABLE public.shipping_details DISABLE ROW LEVEL SECURITY; 