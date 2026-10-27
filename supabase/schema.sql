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

-- ---------------------------------------------------------------------
-- 8. Manage admins from the admin page (applied Oct. 27, 2026)
--    Only admins with can_manage = true (Brian) can add or remove admins.
--    Managers can't be added or removed from the page, only here in SQL.
-- ---------------------------------------------------------------------
alter table public.admins add column if not exists can_manage boolean not null default false;
alter table public.admins add column if not exists added_by extensions.citext;
alter table public.admins drop constraint if exists admins_staff_email;
alter table public.admins add constraint admins_staff_email
  check (email ~* '^[^@\s]+@(aiacanada\.com|i-car\.ca)$');
update public.admins set can_manage = true where email = 'brian.beehler@aiacanada.com';

create or replace function private.can_manage_admins()
returns boolean language sql stable security definer
set search_path = public, extensions
as $$
  select exists (select 1 from public.admins
                 where email = (auth.jwt() ->> 'email')::extensions.citext and can_manage);
$$;
revoke all on function private.can_manage_admins() from public;
grant execute on function private.can_manage_admins() to authenticated;

drop policy if exists "Admins can see the admin list" on public.admins;
drop policy if exists "Admins see themselves, managers see all" on public.admins;
create policy "Admins see themselves, managers see all" on public.admins for select to authenticated
  using (email = (auth.jwt() ->> 'email')::extensions.citext or private.can_manage_admins());

drop policy if exists "Managers add admins" on public.admins;
create policy "Managers add admins" on public.admins for insert to authenticated
  with check (private.can_manage_admins() and can_manage = false
              and added_by = (auth.jwt() ->> 'email')::extensions.citext);

drop policy if exists "Managers remove admins" on public.admins;
create policy "Managers remove admins" on public.admins for delete to authenticated
  using (private.can_manage_admins() and can_manage = false);

grant insert, delete on public.admins to authenticated;

-- ---------------------------------------------------------------------
-- 9. Address book (applied Oct. 27, 2026)
--    Private to each staff member unless they share a contact with the team.
--    Only signed-in staff can read. Visitors can only send details through submit_contact().
-- ---------------------------------------------------------------------
create table if not exists public.contacts (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references auth.users(id) on delete cascade,
  owner_email     text not null default (auth.jwt() ->> 'email'),
  first_name      text not null check (length(first_name) between 1 and 80),
  last_name       text not null default '' check (length(last_name) <= 80),
  company         text check (length(company) <= 120),
  title           text check (length(title) <= 120),
  email           text check (length(email) <= 200 and (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  phone           text check (length(phone) <= 40),
  notes           text check (length(notes) <= 2000),
  event_tag       text check (length(event_tag) <= 80),
  source          text not null default 'manual' check (source in ('manual', 'exchange')),
  lang            text not null default 'en' check (lang in ('en', 'fr')),
  consent_at      timestamptz,
  consent_version text,
  updates_opt_in  boolean not null default false,
  updates_opt_in_at timestamptz,
  shared          boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists contacts_owner_idx on public.contacts (owner_id, created_at desc);
create index if not exists contacts_shared_idx on public.contacts (created_at desc) where shared;

alter table public.contacts enable row level security;
revoke all on public.contacts from anon;
grant select, insert, update, delete on public.contacts to authenticated;

drop policy if exists "Staff see own and shared contacts" on public.contacts;
create policy "Staff see own and shared contacts" on public.contacts for select to authenticated
  using ((select public.is_staff()) and (owner_id = (select auth.uid()) or shared));
drop policy if exists "Staff add their own contacts" on public.contacts;
create policy "Staff add their own contacts" on public.contacts for insert to authenticated
  with check ((select public.is_staff()) and owner_id = (select auth.uid()) and source = 'manual'
              and owner_email = (select auth.jwt() ->> 'email'));
drop policy if exists "Staff edit their own contacts" on public.contacts;
create policy "Staff edit their own contacts" on public.contacts for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()) and (select public.is_staff()));
drop policy if exists "Staff delete their own contacts" on public.contacts;
create policy "Staff delete their own contacts" on public.contacts for delete to authenticated
  using (owner_id = (select auth.uid()));

-- Keeps the record of where a contact came from and what they agreed to.
-- Staff can opt a card-exchange contact out of updates, but never back in.
create or replace function private.contacts_guard()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if new.updates_opt_in then new.updates_opt_in_at := coalesce(new.updates_opt_in_at, now()); end if;
    return new;
  end if;
  new.id := old.id; new.owner_id := old.owner_id; new.owner_email := old.owner_email;
  new.source := old.source; new.created_at := old.created_at;
  new.consent_at := old.consent_at; new.consent_version := old.consent_version;
  if current_user = 'authenticated' and old.source = 'exchange' and new.updates_opt_in and not old.updates_opt_in then
    new.updates_opt_in := false;
  end if;
  if new.updates_opt_in and not old.updates_opt_in then new.updates_opt_in_at := now(); end if;
  if not new.updates_opt_in then new.updates_opt_in_at := null; end if;
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists contacts_guard on public.contacts;
create trigger contacts_guard before insert or update on public.contacts
  for each row execute function private.contacts_guard();

-- Visitors who scan a card send their details here (consent required, 30 per card per 10 minutes,
-- repeat sends by the same email update the existing entry).
create or replace function public.submit_contact(
  p_slug text, p_first_name text, p_last_name text, p_company text, p_title text,
  p_email text, p_phone text, p_note text, p_consent boolean, p_updates boolean, p_lang text)
returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_owner uuid; v_owner_email text; v_recent int; v_existing uuid;
begin
  if not coalesce(p_consent, false) then raise exception 'consent_required' using errcode = '22023'; end if;
  if coalesce(trim(p_first_name), '') = '' then raise exception 'name_required' using errcode = '22023'; end if;
  if coalesce(trim(p_email), '') = '' and coalesce(trim(p_phone), '') = '' then
    raise exception 'email_or_phone_required' using errcode = '22023';
  end if;
  select p.id, p.email into v_owner, v_owner_email
  from public.profiles p where p.slug = lower(p_slug) and p.published;
  if v_owner is null then raise exception 'card_not_found' using errcode = '22023'; end if;
  select count(*) into v_recent from public.contacts
  where owner_id = v_owner and source = 'exchange' and created_at > now() - interval '10 minutes';
  if v_recent >= 30 then raise exception 'too_many' using errcode = '22023'; end if;
  if coalesce(trim(p_email), '') <> '' then
    select c.id into v_existing from public.contacts c
    where c.owner_id = v_owner and lower(c.email) = lower(trim(p_email)) limit 1;
  end if;
  if v_existing is not null then
    update public.contacts set
      first_name = left(trim(p_first_name), 80), last_name = left(coalesce(trim(p_last_name), ''), 80),
      company = nullif(left(trim(p_company), 120), ''), title = nullif(left(trim(p_title), 120), ''),
      phone = coalesce(nullif(left(trim(p_phone), 40), ''), phone),
      notes = case when coalesce(trim(p_note), '') = '' then notes
                   else left(concat_ws(E'\n', notes, trim(p_note)), 2000) end
    where id = v_existing;
    if coalesce(p_updates, false) then
      update public.contacts set updates_opt_in = true, updates_opt_in_at = now() where id = v_existing and not updates_opt_in;
    end if;
    return true;
  end if;
  insert into public.contacts (owner_id, owner_email, first_name, last_name, company, title, email, phone, notes,
                               source, lang, consent_at, consent_version, updates_opt_in, updates_opt_in_at)
  values (v_owner, v_owner_email, left(trim(p_first_name), 80), left(coalesce(trim(p_last_name), ''), 80),
          nullif(left(trim(p_company), 120), ''), nullif(left(trim(p_title), 120), ''),
          nullif(lower(left(trim(p_email), 200)), ''), nullif(left(trim(p_phone), 40), ''),
          nullif(left(trim(p_note), 2000), ''), 'exchange',
          case when p_lang = 'fr' then 'fr' else 'en' end, now(), '2026-10-27',
          coalesce(p_updates, false), case when coalesce(p_updates, false) then now() end);
  return true;
end;
$$;
revoke all on function public.submit_contact(text, text, text, text, text, text, text, text, boolean, boolean, text) from public;
grant execute on function public.submit_contact(text, text, text, text, text, text, text, text, boolean, boolean, text) to anon, authenticated;
