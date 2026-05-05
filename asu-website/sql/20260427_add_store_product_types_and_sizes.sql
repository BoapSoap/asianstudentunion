alter table public.products
  add column if not exists product_type text not null default 'clothing',
  add column if not exists size_options text[] not null default array['S', 'M', 'L', 'XL', '2XL']::text[];

update public.products
set product_type = 'clothing'
where product_type is null or btrim(product_type) = '';

update public.products
set size_options = array['S', 'M', 'L', 'XL', '2XL']::text[]
where product_type = 'clothing'
  and (size_options is null or cardinality(size_options) = 0);

update public.products
set size_options = array[]::text[]
where product_type = 'general';

alter table public.products
  drop constraint if exists products_product_type_check;

alter table public.products
  add constraint products_product_type_check
  check (product_type in ('clothing', 'general'));

alter table public.products
  drop constraint if exists products_size_options_not_null_entries_check;

alter table public.products
  add constraint products_size_options_not_null_entries_check
  check (array_position(size_options, null) is null);

alter table public.products
  drop constraint if exists products_clothing_has_size_options_check;

alter table public.products
  add constraint products_clothing_has_size_options_check
  check (product_type <> 'clothing' or cardinality(size_options) > 0);
