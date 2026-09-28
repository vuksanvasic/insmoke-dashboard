-- In Smoke We Trust — baza za finansijski dashboard
-- Pokreni ceo fajl jednom: Supabase → SQL Editor → New query → nalepi → Run.

-- 1) Članovi: ko sme da uđe u alat i šta sme da radi.
--    role = 'editor' (unosi i menja brojeve) ili 'viewer' (samo gleda)
create table if not exists public.members (
  email      text primary key check (email = lower(email)),
  role       text not null default 'editor' check (role in ('editor', 'viewer')),
  name       text,
  created_at timestamptz not null default now()
);

-- 2) Meseci: jedan red = jedan mesec (ključ npr. '2026-09'), svi uneti podaci + izračunati rezime.
create table if not exists public.months (
  key        text primary key check (key ~ '^\d{4}-\d{2}$'),
  period     text,
  state      jsonb not null,
  summary    jsonb,
  updated_at timestamptz not null default now(),
  updated_by text,
  client     text
);

-- 3) Koji mesec je trenutno otvoren.
create table if not exists public.app_meta (
  id      int primary key default 1 check (id = 1),
  current text
);

-- Uloga prijavljenog korisnika (ili null ako nije član).
create or replace function public.member_role()
returns text
language sql stable security definer
set search_path = public
as $$
  select role from public.members where email = lower(coalesce(auth.jwt() ->> 'email', ''))
$$;

alter table public.members  enable row level security;
alter table public.months   enable row level security;
alter table public.app_meta enable row level security;

-- Članovi vide samo svoj red (alat tako proverava pristup). Spisak članova menjaš u Table Editoru.
drop policy if exists "member reads own row" on public.members;
create policy "member reads own row" on public.members
  for select to authenticated using (email = lower(auth.jwt() ->> 'email'));

-- Meseci: čitaju svi članovi, upisuju i menjaju samo editori. Brisanje nije dozvoljeno iz alata.
drop policy if exists "members read months" on public.months;
create policy "members read months" on public.months
  for select to authenticated using (public.member_role() is not null);
drop policy if exists "editors insert months" on public.months;
create policy "editors insert months" on public.months
  for insert to authenticated with check (public.member_role() = 'editor');
drop policy if exists "editors update months" on public.months;
create policy "editors update months" on public.months
  for update to authenticated using (public.member_role() = 'editor') with check (public.member_role() = 'editor');

drop policy if exists "members read meta" on public.app_meta;
create policy "members read meta" on public.app_meta
  for select to authenticated using (public.member_role() is not null);
drop policy if exists "editors insert meta" on public.app_meta;
create policy "editors insert meta" on public.app_meta
  for insert to authenticated with check (public.member_role() = 'editor');
drop policy if exists "editors update meta" on public.app_meta;
create policy "editors update meta" on public.app_meta
  for update to authenticated using (public.member_role() = 'editor') with check (public.member_role() = 'editor');

-- Uživo osvežavanje: kad neko sačuva mesec, drugi odmah vide promenu.
do $$
begin
  alter publication supabase_realtime add table public.months;
exception when duplicate_object then null;
end $$;

-- 4) Dodaj sebe kao prvog člana (zameni email svojim, malim slovima) pa pokreni i ovaj red:
-- insert into public.members (email, role, name) values ('tvoj.email@primer.rs', 'editor', 'Ime Prezime');
