create extension if not exists pgcrypto;

create table if not exists public.store_product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  sort_order integer not null default 0,
  is_thumbnail boolean not null default false,
  created_at timestamptz not null default now(),
  constraint store_product_images_image_url_not_blank check (btrim(image_url) <> '')
);

create index if not exists store_product_images_product_id_idx
  on public.store_product_images(product_id);

create index if not exists store_product_images_product_sort_idx
  on public.store_product_images(product_id, sort_order, created_at);

insert into public.store_product_images (product_id, image_url, sort_order, is_thumbnail)
select p.id, p.image_url, 0, true
from public.products p
where p.image_url is not null
  and btrim(p.image_url) <> ''
  and not exists (
    select 1
    from public.store_product_images spi
    where spi.product_id = p.id
  );

with ranked as (
  select
    spi.id,
    spi.product_id,
    row_number() over (
      partition by spi.product_id
      order by
        case when spi.is_thumbnail then 0 else 1 end,
        spi.sort_order asc,
        spi.created_at asc,
        spi.id asc
    ) as rn
  from public.store_product_images spi
)
update public.store_product_images spi
set is_thumbnail = ranked.rn = 1
from ranked
where spi.id = ranked.id;

create unique index if not exists store_product_images_one_thumbnail_idx
  on public.store_product_images(product_id)
  where is_thumbnail;
