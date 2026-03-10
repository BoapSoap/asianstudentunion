alter table public.store_settings
  add column if not exists venmo_username text,
  add column if not exists venmo_qr_image_url text,
  add column if not exists zelle_handle text,
  add column if not exists zelle_display_name text;

update public.store_settings
set pickup_instructions = 'Pickup in ASU room.'
where pickup_instructions is null or btrim(pickup_instructions) = '';

alter table public.store_settings
  alter column pickup_instructions set default 'Pickup in ASU room.';

alter table public.orders
  add column if not exists size text,
  add column if not exists payment_method text,
  add column if not exists payment_reference text;

update public.orders
set payment_method = 'venmo'
where payment_method is null;

alter table public.orders
  alter column payment_method set default 'venmo',
  alter column payment_method set not null;

alter table public.orders
  drop constraint if exists orders_payment_method_check;

alter table public.orders
  add constraint orders_payment_method_check
  check (payment_method in ('venmo', 'zelle'));
