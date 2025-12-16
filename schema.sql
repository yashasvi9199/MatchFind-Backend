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
alter table public.profiles 
  add constraint IF NOT EXISTS profiles_email_key unique ("email");

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

-- 4. Triggers (Auto-update updated_at)
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
