-- LIGA Bulan Document Manager — Postgres schema + RLS
-- Runnable via `supabase db push` or the Supabase SQL editor.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('admin', 'client')),
  name text not null,
  login_id text unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.barangays (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

create table public.officials (
  id uuid primary key default gen_random_uuid(),
  barangay_id uuid not null references public.barangays (id) on delete cascade,
  position text not null,
  name text not null
);

create table public.client_barangays (
  client_id uuid not null references public.profiles (id) on delete cascade,
  barangay_id uuid not null references public.barangays (id) on delete cascade,
  primary key (client_id, barangay_id)
);

create table public.forms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  category text not null default 'Procurement',
  published boolean not null default false,
  current_version integer not null default 1,
  updated_at date not null default (timezone('utc', now()))::date
);

create table public.form_versions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms (id) on delete cascade,
  version integer not null,
  created_at date not null default (timezone('utc', now()))::date,
  change_note text,
  page_size text not null default 'Letter',
  orientation text not null default 'portrait',
  margins jsonb not null default '{"top":20,"right":18,"bottom":20,"left":18}'::jsonb,
  elements jsonb not null default '[]'::jsonb,
  unique (form_id, version)
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms (id) on delete restrict,
  form_version_id uuid not null references public.form_versions (id) on delete restrict,
  barangay_id uuid not null references public.barangays (id) on delete restrict,
  client_id uuid not null references public.profiles (id) on delete restrict,
  status text not null default 'draft' check (status in ('draft', 'submitted')),
  data jsonb not null default '{}'::jsonb,
  tables jsonb not null default '{}'::jsonb,
  official_snapshot jsonb not null default '{}'::jsonb,
  created_at date not null default (timezone('utc', now()))::date,
  updated_at date not null default (timezone('utc', now()))::date,
  submitted_at date
);

create index officials_barangay_id_idx on public.officials (barangay_id);
create index client_barangays_barangay_id_idx on public.client_barangays (barangay_id);
create index form_versions_form_id_idx on public.form_versions (form_id);
create index submissions_form_id_idx on public.submissions (form_id);
create index submissions_client_id_idx on public.submissions (client_id);
create index submissions_barangay_id_idx on public.submissions (barangay_id);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.assigned_barangay_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select barangay_id from public.client_barangays where client_id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Grants (anon has no table access; authenticated is gated by RLS)
-- ---------------------------------------------------------------------------

grant usage on schema public to authenticated, service_role;

grant select, insert, update, delete on all tables in schema public to authenticated, service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.assigned_barangay_ids() to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.barangays enable row level security;
alter table public.officials enable row level security;
alter table public.client_barangays enable row level security;
alter table public.forms enable row level security;
alter table public.form_versions enable row level security;
alter table public.submissions enable row level security;

-- profiles
create policy profiles_select on public.profiles
  for select to authenticated
  using (public.is_admin() or id = auth.uid());

create policy profiles_update on public.profiles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- barangays
create policy barangays_select on public.barangays
  for select to authenticated
  using (public.is_admin() or id in (select public.assigned_barangay_ids()));

create policy barangays_insert on public.barangays
  for insert to authenticated
  with check (public.is_admin());

create policy barangays_update on public.barangays
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy barangays_delete on public.barangays
  for delete to authenticated
  using (public.is_admin());

-- officials
create policy officials_select on public.officials
  for select to authenticated
  using (public.is_admin() or barangay_id in (select public.assigned_barangay_ids()));

create policy officials_insert on public.officials
  for insert to authenticated
  with check (public.is_admin());

create policy officials_update on public.officials
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy officials_delete on public.officials
  for delete to authenticated
  using (public.is_admin());

-- client_barangays
create policy client_barangays_select on public.client_barangays
  for select to authenticated
  using (public.is_admin() or client_id = auth.uid());

create policy client_barangays_insert on public.client_barangays
  for insert to authenticated
  with check (public.is_admin());

create policy client_barangays_delete on public.client_barangays
  for delete to authenticated
  using (public.is_admin());

-- forms
create policy forms_select on public.forms
  for select to authenticated
  using (public.is_admin() or published = true);

create policy forms_insert on public.forms
  for insert to authenticated
  with check (public.is_admin());

create policy forms_update on public.forms
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy forms_delete on public.forms
  for delete to authenticated
  using (public.is_admin());

-- form_versions
create policy form_versions_select on public.form_versions
  for select to authenticated
  using (
    public.is_admin()
    or exists (select 1 from public.forms f where f.id = form_id and f.published = true)
  );

create policy form_versions_insert on public.form_versions
  for insert to authenticated
  with check (public.is_admin());

create policy form_versions_update on public.form_versions
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy form_versions_delete on public.form_versions
  for delete to authenticated
  using (public.is_admin());

-- submissions
create policy submissions_select on public.submissions
  for select to authenticated
  using (public.is_admin() or client_id = auth.uid());

create policy submissions_insert on public.submissions
  for insert to authenticated
  with check (
    public.is_admin()
    or (
      client_id = auth.uid()
      and barangay_id in (select public.assigned_barangay_ids())
      and exists (select 1 from public.forms f where f.id = form_id and f.published = true)
      and exists (
        select 1
        from public.form_versions fv
        where fv.id = form_version_id and fv.form_id = form_id
      )
    )
  );

create policy submissions_update on public.submissions
  for update to authenticated
  using (public.is_admin() or client_id = auth.uid())
  with check (
    public.is_admin()
    or (
      client_id = auth.uid()
      and barangay_id in (select public.assigned_barangay_ids())
      and exists (select 1 from public.forms f where f.id = form_id and f.published = true)
      and exists (
        select 1
        from public.form_versions fv
        where fv.id = form_version_id and fv.form_id = form_id
      )
    )
  );

create policy submissions_delete on public.submissions
  for delete to authenticated
  using (public.is_admin());
