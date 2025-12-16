-- Existing profiles table (ensure idempotency)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade not null primary key,
  email text,
  
  -- Basic Info
  title text,
  name text,
  gender text,
  age int,
  height text,
  weight text,
  "skinColor" text,
  "bloodGroup" text,
  diet text,
  bio text,

  -- Social & Religious
  caste text,
  gotra text,

  -- Location & Birth
  "birthPlace" text,
  "birthTime" text,

  -- Native Location
  "nativeCountry" text,
  "nativeState" text,
  "nativeCity" text,

  -- Current Location
  "currentCountry" text,
  "currentState" text,
  "currentCity" text,

  -- Education & Career
  "educationLevel" text,
  "educationStream" text,
  "educationDegree" text,
  education text,
  occupation text,
  salary text,

  -- Family Details
  father jsonb,
  mother jsonb,
  "paternalSide" jsonb,
  siblings jsonb,

  -- Health
  "healthIssues" text[],

  -- Preferences
  "partnerAgeMin" text,
  "partnerAgeMax" text,
  expectations text[],

  is_demo boolean default false,
  updated_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Interactions Table
create table if not exists public.interactions (
  id uuid default gen_random_uuid() primary key,
  "fromUserId" uuid references auth.users(id) on delete cascade not null,
  "toUserId" uuid references auth.users(id) on delete cascade not null,
  type text check (type in ('INTERESTED', 'REMOVED')),
  timestamp bigint, -- storing JS timestamp for compatibility
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique("fromUserId", "toUserId")
);

-- RLS
alter table public.profiles enable row level security;
alter table public.interactions enable row level security;

-- Policies
create policy "Public profiles are viewable by everyone" on profiles for select using ( true );
create policy "Users can insert their own profile" on profiles for insert with check ( auth.uid() = id );
create policy "Users can update own profile" on profiles for update using ( auth.uid() = id );

create policy "Users can view their own sent interactions" on interactions for select using ( auth.uid() = "fromUserId" );
create policy "Users can insert their own interactions" on interactions for insert with check ( auth.uid() = "fromUserId" );

-- Storage
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;
create policy "Avatar images are publicly accessible" on storage.objects for select using ( bucket_id = 'avatars' );
create policy "Anyone can upload an avatar" on storage.objects for insert with check ( bucket_id = 'avatars' );
