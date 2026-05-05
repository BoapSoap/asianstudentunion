create extension if not exists pgcrypto;

create table if not exists public.admin_notice_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  notice_key text not null unique,
  acknowledged_by uuid references auth.users(id) on delete set null,
  acknowledged_by_email text,
  acknowledged_at timestamptz not null default now()
);

alter table public.admin_notice_acknowledgements enable row level security;
