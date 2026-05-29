alter table public.officers
  add column if not exists is_current boolean not null default true,
  add column if not exists term_label text,
  add column if not exists archived_at timestamptz;

update public.officers
set is_current = true
where is_current is null;

create index if not exists officers_current_sort_idx
  on public.officers (is_current, sort_order, role, name);

create index if not exists officers_archive_term_idx
  on public.officers (term_label, archived_at desc)
  where is_current = false;
