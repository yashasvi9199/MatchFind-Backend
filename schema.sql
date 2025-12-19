-- -----------------------------------------------------------------------------
-- Schema Migration: Improvements & Optimization
-- Run this in Supabase SQL Editor to update the existing structure.
-- -----------------------------------------------------------------------------

-- 1. Performance Indices
-- Based on RishteyView filters (caste, gotra, gender, etc.)
create index if not exists idx_profiles_caste on public.profiles("caste");
create index if not exists idx_profiles_gotra on public.profiles("gotra");
create index if not exists idx_profiles_gender on public.profiles("gender");

-- Based on MatchView (interactions querying)
create index if not exists idx_interactions_from_type on public.interactions("fromUserId", "type");
create index if not exists idx_interactions_to_type on public.interactions("toUserId", "type");

-- 2. Constraints (Data Integrity)
-- Ensure unique emails in profiles if they are used for lookups
-- Postgres does not support "ADD CONSTRAINT IF NOT EXISTS", so we drop it first to be safe (idempotent)
alter table public.profiles drop constraint if exists profiles_email_key;
alter table public.profiles add constraint profiles_email_key unique ("email");

-- 3. Views for Easier Querying
-- Helper view to find mutual matches (both users liked each other)
create or replace view public.matches as
select 
  i1."fromUserId" as "user1",
  i1."toUserId" as "user2",
  greatest(i1.created_at, i2.created_at) as "matched_at"
from interactions i1
join interactions i2 
  on i1."fromUserId" = i2."toUserId" 
  and i1."toUserId" = i2."fromUserId"
where i1.type = 'INTERESTED' 
  and i2.type = 'INTERESTED';

-- 4. Role Management
-- Add 'role' column (user/admin)
alter table public.profiles 
add column if not exists "role" text default 'user' check (role in ('user', 'admin'));

-- 5. Row Level Security (RLS) for Admin
-- Enable RLS if not already enabled
alter table public.profiles enable row level security;

-- Policy: Admins can do anything
create policy "Admins can select all" 
on public.profiles for select 
using (
  auth.uid() in (select id from public.profiles where role = 'admin')
);

create policy "Admins can update all" 
on public.profiles for update 
using (
  auth.uid() in (select id from public.profiles where role = 'admin')
);

create policy "Admins can delete all" 
on public.profiles for delete 
using (
  auth.uid() in (select id from public.profiles where role = 'admin')
);

-- Policy: Users see others (public profiles) - Assuming 'authenticated' role
create policy "Users can see all public profiles"
on public.profiles for select
to authenticated
using (true);

-- Policy: Users can update own profile
create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id);

-- Policy: Users can insert own profile
create policy "Users can insert own profile"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);


-- 6. Triggers (Auto-update updated_at)
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_profile_updated on public.profiles;
create trigger on_profile_updated
  before update on public.profiles
  for each row
  execute procedure public.handle_updated_at();

-- 7. Profile Completion Tracking
alter table public.profiles
add column if not exists "is_complete_profile" boolean default false;

-- -----------------------------------------------------------------------------
-- Schema Migration: Occupation/Business Restructure
-- Run this in Supabase SQL Editor
-- -----------------------------------------------------------------------------

-- 1. Add new occupation-related columns
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS "occupation_type" text CHECK (occupation_type IN ('Job', 'Business'));

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS "company_name" text;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS "designation" text;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS "business_name" text;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS "business_category" text;

-- 2. Migrate existing occupation data to occupation_type (optional - based on existing data patterns)
-- This is a best-effort migration; manual review may be needed
-- UPDATE public.profiles
-- SET occupation_type = 'Job'
-- WHERE occupation IS NOT NULL AND occupation != '';

-- 3. (Optional) Drop old occupation column if no longer needed
-- run 2 first for migration to prevent data loss
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS "occupation";

-- 4. Add index for occupation_type for filtering
CREATE INDEX IF NOT EXISTS idx_profiles_occupation_type ON public.profiles("occupation_type");

-- 5. Add "Computer Science" to educationStream (handled in frontend dropdown - no DB change needed)

-- 6. Ensure salary column rename logic for Business as "Annual Turnover" (frontend label change - no DB change)