-- =====================================================================
-- AIA Canada / I-CAR Canada staff digital business cards
-- Run this once in Supabase: Dashboard > SQL Editor > New query > Run
-- =====================================================================

create extension if not exists citext;

-- ---------------------------------------------------------------------
-- 1. Who counts as staff
--    [CONFIRM WITH IT] the email domains staff sign in with.
-- ---------------------------------------------------------------------
create or replace function public.is_staff()
returns boolean
language sql stable
set search_path = public
as $$
  select coalesce(
    lower(auth.jwt() ->> 'email') ~ '@(aiacanada\.com|i-car\.ca)$',
    false
  );
$$;

-- ---------------------------------------------------------------------
-- 2. Marcom admins (can edit, hide or remove any card)
-- ---------------------------------------------------------------------
create table if not exists public.admins (
  email citext primary key,
  added_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where email = (auth.jwt() ->> 'email')::citext
  );
$$;

drop policy if exists "Admins can see the admin list" on public.admins;
create policy "Admins can see the admin list"
  on public.admins for select to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------
-- 3. Card profiles (one per staff member)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  slug        text not null unique
              check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) between 3 and 60),
  org         text not null default 'aia' check (org in ('aia', 'icar')),
  lang        text not null default 'en'  check (lang in ('en', 'fr')),
  first_name  text not null check (length(first_name) between 1 and 60),
  last_name   text not null check (length(last_name)  between 1 and 60),
  title_en    text check (length(title_en) <= 120),
  title_fr    text check (length(title_fr) <= 120),
  email       text not null check (length(email) <= 200),
  work_phone  text check (length(work_phone) <= 40),
  work_ext    text check (length(work_ext)   <= 10),
  mobile      text check (length(mobile)     <= 40),
  show_mobile boolean not null default false,
  linkedin    text check (length(linkedin) <= 200),
  photo_path  text check (length(photo_path) <= 200),
  published   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch
  before update on public.profiles
  for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;

-- Anyone (including people who scan a QR code) can read published cards.
drop policy if exists "Published cards are public" on public.profiles;
create policy "Published cards are public"
  on public.profiles for select to anon, authenticated
  using (published or id = auth.uid() or public.is_admin());

-- Staff create their own card, using their own work email.
drop policy if exists "Staff create their own card" on public.profiles;
create policy "Staff create their own card"
  on public.profiles for insert to authenticated
  with check (
    id = auth.uid()
    and public.is_staff()
    and lower(email) = lower(auth.jwt() ->> 'email')
  );

-- Staff edit their own card; admins edit any card.
drop policy if exists "Staff edit their own card" on public.profiles;
create policy "Staff edit their own card"
  on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (
    public.is_admin()
    or (id = auth.uid() and public.is_staff() and lower(email) = lower(auth.jwt() ->> 'email'))
  );

-- Staff delete their own card; admins delete any card.
drop policy if exists "Staff delete their own card" on public.profiles;
create policy "Staff delete their own card"
  on public.profiles for delete to authenticated
  using (id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------
-- 4. Photo storage (public read, staff write only in their own folder)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "Staff read own photo folder" on storage.objects;
create policy "Staff read own photo folder"
  on storage.objects for select to authenticated
  using (bucket_id = 'photos' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

drop policy if exists "Staff upload own photo" on storage.objects;
create policy "Staff upload own photo"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and public.is_staff()
              and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

drop policy if exists "Staff replace own photo" on storage.objects;
create policy "Staff replace own photo"
  on storage.objects for update to authenticated
  using (bucket_id = 'photos' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

drop policy if exists "Staff remove own photo" on storage.objects;
create policy "Staff remove own photo"
  on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- ---------------------------------------------------------------------
-- 5. Security hardening (applied after Supabase's security check)
--    Moves citext out of public and keeps the admin check out of the API.
-- ---------------------------------------------------------------------
alter extension citext set schema extensions;
create schema if not exists private;
grant usage on schema private to anon, authenticated;

create or replace function private.is_admin()
returns boolean
language sql stable security definer
set search_path = public, extensions
as $$
  select exists (select 1 from public.admins where email = (auth.jwt() ->> 'email')::extensions.citext);
$$;
revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to anon, authenticated;

drop policy if exists "Admins can see the admin list" on public.admins;
create policy "Admins can see the admin list" on public.admins for select to authenticated using (private.is_admin());

drop policy if exists "Published cards are public" on public.profiles;
create policy "Published cards are public" on public.profiles for select to anon, authenticated
  using (published or id = auth.uid() or private.is_admin());

drop policy if exists "Staff edit their own card" on public.profiles;
create policy "Staff edit their own card" on public.profiles for update to authenticated
  using (id = auth.uid() or private.is_admin())
  with check (private.is_admin() or (id = auth.uid() and public.is_staff() and lower(email) = lower(auth.jwt() ->> 'email')));

drop policy if exists "Staff delete their own card" on public.profiles;
create policy "Staff delete their own card" on public.profiles for delete to authenticated
  using (id = auth.uid() or private.is_admin());

drop policy if exists "Staff read own photo folder" on storage.objects;
create policy "Staff read own photo folder" on storage.objects for select to authenticated
  using (bucket_id = 'photos' and ((storage.foldername(name))[1] = auth.uid()::text or private.is_admin()));
drop policy if exists "Staff upload own photo" on storage.objects;
create policy "Staff upload own photo" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and public.is_staff() and ((storage.foldername(name))[1] = auth.uid()::text or private.is_admin()));
drop policy if exists "Staff replace own photo" on storage.objects;
create policy "Staff replace own photo" on storage.objects for update to authenticated
  using (bucket_id = 'photos' and ((storage.foldername(name))[1] = auth.uid()::text or private.is_admin()));
drop policy if exists "Staff remove own photo" on storage.objects;
create policy "Staff remove own photo" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and ((storage.foldername(name))[1] = auth.uid()::text or private.is_admin()));

drop function if exists public.is_admin();

-- ---------------------------------------------------------------------
-- 6. Add the first Marcom admin  [REPLACE WITH THE ADMIN'S WORK EMAIL]
-- ---------------------------------------------------------------------
insert into public.admins (email) values ('[ADMIN EMAIL]@aiacanada.com')
on conflict do nothing;

-- ---------------------------------------------------------------------
-- 7. Card addresses the site uses for itself (applied Oct. 27, 2026)
-- ---------------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_slug_not_reserved;
alter table public.profiles add constraint profiles_slug_not_reserved
  check (slug not in ('my-card', 'admin', 'index', 'assets', 'supabase'));
