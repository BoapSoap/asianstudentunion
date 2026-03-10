create table if not exists public.admin_activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  actor_email text not null,
  actor_role text,
  action text not null,
  entity_type text not null,
  entity_id text,
  summary text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists admin_activity_logs_created_at_idx
  on public.admin_activity_logs (created_at desc);

create index if not exists admin_activity_logs_entity_type_idx
  on public.admin_activity_logs (entity_type, created_at desc);

alter table public.orders
  add column if not exists status_updated_at timestamptz not null default timezone('utc', now()),
  add column if not exists last_internal_paid_reminder_at timestamptz,
  add column if not exists internal_paid_reminder_count integer not null default 0,
  add column if not exists last_customer_ready_reminder_at timestamptz,
  add column if not exists customer_ready_reminder_count integer not null default 0;

update public.orders
set status_updated_at = coalesce(status_updated_at, created_at, timezone('utc', now()));
