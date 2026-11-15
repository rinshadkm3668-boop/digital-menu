-- =====================================================================
-- RIGHT CHOICE COOLBAR — database schema, security (RLS) and storage
-- Run this ONCE in Supabase Dashboard -> SQL Editor -> New query.
-- Then run supabase/claim_owner.sql after you create your owner account.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------- Tables ----------------------------------------------------

create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 60),
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.products (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid references public.categories(id) on delete set null,
  name         text not null check (char_length(name) between 1 and 120),
  description  text not null default '' check (char_length(description) <= 500),
  price        numeric(10,2) not null check (price >= 0),
  image_path   text,                         -- path inside the 'menu-images' bucket
  diet         text not null default 'veg' check (diet in ('veg','non_veg','beverage')),
  status       text not null default 'available' check (status in ('available','sold_out','hidden')),
  is_demo      boolean not null default false,
  sort_order   int  not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_status_idx   on public.products(status);

-- Single-row settings table (the id is forced to 1)
create table if not exists public.settings (
  id               int primary key default 1 check (id = 1),
  business_name    text not null default 'Right Choice Coolbar',
  tagline          text not null default 'Fresh • Cool • Delicious',
  phone            text not null default '',
  address          text not null default '',
  cover_image_path text,
  updated_at       timestamptz not null default now()
);
insert into public.settings (id) values (1) on conflict (id) do nothing;

-- Owner registry: holds exactly ONE row, the owner's auth user id.
create table if not exists public.owner_config (
  id        boolean primary key default true check (id),
  owner_id  uuid not null unique
);

-- keep updated_at fresh
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

drop trigger if exists settings_touch on public.settings;
create trigger settings_touch before update on public.settings
  for each row execute function public.touch_updated_at();

-- ---------- Owner check -----------------------------------------------

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.owner_config where owner_id = auth.uid()
  );
$$;

revoke all on function public.is_owner() from public;
grant execute on function public.is_owner() to anon, authenticated;

-- ---------- Row Level Security ---------------------------------------

alter table public.categories   enable row level security;
alter table public.products     enable row level security;
alter table public.settings     enable row level security;
alter table public.owner_config enable row level security;
-- owner_config gets NO policies: nobody can read or write it through the API.

-- Public (customers): read-only, and never hidden products
drop policy if exists "public read categories" on public.categories;
create policy "public read categories" on public.categories
  for select using (true);

drop policy if exists "public read visible products" on public.products;
create policy "public read visible products" on public.products
  for select using (status <> 'hidden');

drop policy if exists "public read settings" on public.settings;
create policy "public read settings" on public.settings
  for select using (true);

-- Owner: full control
drop policy if exists "owner all categories" on public.categories;
create policy "owner all categories" on public.categories
  for all using (public.is_owner()) with check (public.is_owner());

drop policy if exists "owner all products" on public.products;
create policy "owner all products" on public.products
  for all using (public.is_owner()) with check (public.is_owner());

drop policy if exists "owner all settings" on public.settings;
create policy "owner all settings" on public.settings
  for all using (public.is_owner()) with check (public.is_owner());

-- ---------- Storage (product photos) ---------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('menu-images', 'menu-images', true, 2097152,
        array['image/webp','image/jpeg','image/png'])
on conflict (id) do update
  set public = true,
      file_size_limit = 2097152,
      allowed_mime_types = array['image/webp','image/jpeg','image/png'];

-- Anyone may VIEW images (bucket is public); only the owner may write.
drop policy if exists "owner insert menu images" on storage.objects;
create policy "owner insert menu images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'menu-images' and public.is_owner());

drop policy if exists "owner update menu images" on storage.objects;
create policy "owner update menu images" on storage.objects
  for update to authenticated
  using (bucket_id = 'menu-images' and public.is_owner());

drop policy if exists "owner delete menu images" on storage.objects;
create policy "owner delete menu images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'menu-images' and public.is_owner());

drop policy if exists "owner list menu images" on storage.objects;
create policy "owner list menu images" on storage.objects
  for select to authenticated
  using (bucket_id = 'menu-images' and public.is_owner());

-- ---------- Starter categories ---------------------------------------

insert into public.categories (name, sort_order)
select v.name, v.ord from (values
  ('Tea & Coffee',1),('Milkshakes',2),('Falooda',3),('Fresh Juices',4),
  ('Ice Cream',5),('Snacks',6),('Fried Chicken',7),('Burgers',8),
  ('Sandwiches',9),('Shawarma',10),('Bakery Items',11),
  ('Sweets & Desserts',12),('Special Items',13)
) as v(name, ord)
where not exists (select 1 from public.categories);

-- ---------- DEMO products (PLACEHOLDER prices — edit or delete) ------

insert into public.products (category_id, name, description, price, diet, status, is_demo, sort_order)
select c.id, p.name, p.descr, p.price, p.diet, 'available', true, p.ord
from (values
  ('Tea & Coffee','Masala Chai','Spiced milk tea brewed fresh.',20,'beverage',1),
  ('Tea & Coffee','Filter Coffee','Strong South Indian style coffee.',25,'beverage',2),
  ('Milkshakes','Chocolate Shake','Thick chocolate shake with ice cream.',90,'beverage',1),
  ('Milkshakes','Oreo Shake','Creamy Oreo blended shake.',100,'beverage',2),
  ('Falooda','Royal Falooda','Rose syrup, vermicelli, jelly and ice cream.',120,'veg',1),
  ('Fresh Juices','Watermelon Juice','Fresh pressed, no added sugar.',50,'beverage',1),
  ('Fresh Juices','Fresh Lime Soda','Sweet, salt or mixed.',35,'beverage',2),
  ('Ice Cream','Vanilla Scoop','Classic vanilla ice cream.',40,'veg',1),
  ('Snacks','French Fries','Crispy salted fries.',70,'veg',1),
  ('Fried Chicken','Fried Chicken (2 pc)','Crispy spicy fried chicken pieces.',120,'non_veg',1),
  ('Fried Chicken','Chicken Wings (6 pc)','Hot and crunchy wings.',140,'non_veg',2),
  ('Burgers','Chicken Burger','Crispy chicken patty with sauce and lettuce.',110,'non_veg',1),
  ('Burgers','Veg Burger','Veg patty with fresh salad.',80,'veg',2),
  ('Sandwiches','Grilled Veg Sandwich','Toasted with cheese and veggies.',70,'veg',1),
  ('Shawarma','Chicken Shawarma','Classic roll with garlic sauce.',90,'non_veg',1),
  ('Bakery Items','Chocolate Donut','Soft donut with chocolate glaze.',40,'veg',1),
  ('Sweets & Desserts','Gulab Jamun (2 pc)','Warm and syrupy.',50,'veg',1),
  ('Special Items','Right Choice Special Combo','Chef''s special combo plate.',250,'non_veg',1)
) as p(cat, name, descr, price, diet, ord)
join public.categories c on c.name = p.cat
where not exists (select 1 from public.products);
