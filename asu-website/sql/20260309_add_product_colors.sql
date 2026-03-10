create extension if not exists pgcrypto;

create table if not exists public.product_colors (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  hex_color text not null,
  preview_image_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint product_colors_name_not_blank check (btrim(name) <> ''),
  constraint product_colors_hex_check check (hex_color ~ '^#[0-9A-Fa-f]{6}$')
);

create index if not exists product_colors_product_id_idx
  on public.product_colors(product_id);

create unique index if not exists product_colors_product_name_uidx
  on public.product_colors(product_id, lower(name));

alter table public.orders
  add column if not exists color_id uuid references public.product_colors(id) on delete set null,
  add column if not exists color_name text,
  add column if not exists color_hex text;

create index if not exists orders_color_id_idx
  on public.orders(color_id);
