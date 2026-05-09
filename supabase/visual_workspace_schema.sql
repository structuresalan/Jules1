-- SimplifyStruct Visual Workspace Supabase schema
-- Run this in the Supabase SQL editor after enabling Auth.
-- Engineers can edit. Clients can comment only. Members can read project data.

create extension if not exists "pgcrypto";

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  project_number text,
  client_name text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$ begin
  create type public.project_role as enum ('owner', 'engineer', 'client', 'viewer');
exception when duplicate_object then null;
end $$;

create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.project_role not null default 'engineer',
  created_at timestamptz not null default now(),
  unique(project_id, user_id)
);

create table if not exists public.boards (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  board_type text not null default 'plan',
  storage_path text,
  scale_label text,
  scale_factor numeric,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  item_type text not null,
  item_name text not null,
  section text,
  location text,
  elevation text,
  status text not null default 'Field Verify',
  priority text not null default 'Medium',
  condition text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.markups (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  board_id uuid references public.boards(id) on delete cascade,
  item_id uuid references public.project_items(id) on delete set null,
  markup_type text not null,
  label text,
  status text,
  color text,
  geometry jsonb not null default '{}'::jsonb,
  style jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_photos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  board_id uuid references public.boards(id) on delete set null,
  item_id uuid references public.project_items(id) on delete set null,
  markup_id uuid references public.markups(id) on delete set null,
  storage_path text not null,
  caption text,
  taken_at timestamptz,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  item_id uuid references public.project_items(id) on delete set null,
  name text not null,
  document_type text not null,
  reference text,
  storage_path text,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  item_id uuid references public.project_items(id) on delete cascade,
  markup_id uuid references public.markups(id) on delete set null,
  body text not null,
  resolved boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.cost_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  item_id uuid references public.project_items(id) on delete set null,
  description text not null,
  quantity numeric not null default 1,
  unit text not null default 'EA',
  unit_cost numeric not null default 0,
  status text not null default 'Allowance',
  created_at timestamptz not null default now()
);

create table if not exists public.relationships (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  source_type text not null,
  source_id uuid not null,
  target_type text not null,
  target_id uuid not null,
  relation text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.report_exports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  export_type text not null,
  storage_path text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.boards enable row level security;
alter table public.project_items enable row level security;
alter table public.markups enable row level security;
alter table public.site_photos enable row level security;
alter table public.documents enable row level security;
alter table public.comments enable row level security;
alter table public.cost_items enable row level security;
alter table public.relationships enable row level security;
alter table public.report_exports enable row level security;

create or replace function public.is_project_member(target_project_id uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.project_members
    where project_id = target_project_id and user_id = auth.uid()
  );
$$;

create or replace function public.project_role(target_project_id uuid)
returns public.project_role language sql stable security definer as $$
  select role from public.project_members
  where project_id = target_project_id and user_id = auth.uid()
  limit 1;
$$;

create or replace function public.can_edit_project(target_project_id uuid)
returns boolean language sql stable security definer as $$
  select public.project_role(target_project_id) in ('owner', 'engineer');
$$;

create policy "Project members can read projects" on public.projects
for select using (public.is_project_member(id));

create policy "Authenticated users can create projects" on public.projects
for insert with check (auth.uid() is not null);

create policy "Owners and engineers can update projects" on public.projects
for update using (public.can_edit_project(id)) with check (public.can_edit_project(id));

create policy "Members can read project members" on public.project_members
for select using (public.is_project_member(project_id));

create policy "Owners can manage project members" on public.project_members
for all using (public.project_role(project_id) = 'owner') with check (public.project_role(project_id) = 'owner');

create policy "Members read boards" on public.boards for select using (public.is_project_member(project_id));
create policy "Engineers edit boards" on public.boards for all using (public.can_edit_project(project_id)) with check (public.can_edit_project(project_id));

create policy "Members read items" on public.project_items for select using (public.is_project_member(project_id));
create policy "Engineers edit items" on public.project_items for all using (public.can_edit_project(project_id)) with check (public.can_edit_project(project_id));

create policy "Members read markups" on public.markups for select using (public.is_project_member(project_id));
create policy "Engineers edit markups" on public.markups for all using (public.can_edit_project(project_id)) with check (public.can_edit_project(project_id));

create policy "Members read photos" on public.site_photos for select using (public.is_project_member(project_id));
create policy "Engineers edit photos" on public.site_photos for all using (public.can_edit_project(project_id)) with check (public.can_edit_project(project_id));

create policy "Members read documents" on public.documents for select using (public.is_project_member(project_id));
create policy "Engineers edit documents" on public.documents for all using (public.can_edit_project(project_id)) with check (public.can_edit_project(project_id));

create policy "Members read comments" on public.comments for select using (public.is_project_member(project_id));
create policy "Members add comments" on public.comments for insert with check (public.is_project_member(project_id));
create policy "Engineers resolve comments" on public.comments for update using (public.can_edit_project(project_id)) with check (public.can_edit_project(project_id));

create policy "Members read cost items" on public.cost_items for select using (public.is_project_member(project_id));
create policy "Engineers edit cost items" on public.cost_items for all using (public.can_edit_project(project_id)) with check (public.can_edit_project(project_id));

create policy "Members read relationships" on public.relationships for select using (public.is_project_member(project_id));
create policy "Engineers edit relationships" on public.relationships for all using (public.can_edit_project(project_id)) with check (public.can_edit_project(project_id));

create policy "Members read exports" on public.report_exports for select using (public.is_project_member(project_id));
create policy "Engineers create exports" on public.report_exports for all using (public.can_edit_project(project_id)) with check (public.can_edit_project(project_id));

-- Storage buckets to create:
-- project-boards, site-photos, documents, report-exports
