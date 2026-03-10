-- Update store order lifecycle to:
-- paid -> in_progress -> ready_for_pickup

alter table public.orders
  drop constraint if exists orders_status_check;

update public.orders
set status = 'in_progress'
where status = 'ready';

update public.orders
set status = 'ready_for_pickup'
where status = 'picked_up';

alter table public.orders
  add constraint orders_status_check
  check (status in ('paid', 'in_progress', 'ready_for_pickup'));
