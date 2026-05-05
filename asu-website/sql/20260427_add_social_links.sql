create extension if not exists pgcrypto;

create table if not exists public.social_links (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  url text not null,
  icon_url text,
  sort_order integer default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint social_links_label_not_blank check (btrim(label) <> ''),
  constraint social_links_url_not_blank check (btrim(url) <> '')
);

create index if not exists social_links_active_sort_idx
  on public.social_links (is_active, sort_order, created_at);

create or replace function public.set_social_links_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_social_links_updated_at on public.social_links;

create trigger set_social_links_updated_at
before update on public.social_links
for each row
execute function public.set_social_links_updated_at();

insert into public.social_links (label, url, sort_order, is_active)
select 'Instagram', 'https://www.instagram.com/asianstudentunion/', 1, true
where not exists (
  select 1 from public.social_links where url = 'https://www.instagram.com/asianstudentunion/'
);

insert into public.social_links (label, url, sort_order, is_active)
select 'TikTok', 'https://www.tiktok.com/@sfsuasianstudentunion', 2, true
where not exists (
  select 1 from public.social_links where url = 'https://www.tiktok.com/@sfsuasianstudentunion'
);

insert into public.social_links (label, url, sort_order, is_active)
select 'Discord', 'https://discord.com/invite/m485CGmEWr', 3, true
where not exists (
  select 1 from public.social_links where url = 'https://discord.com/invite/m485CGmEWr'
);
