-- ===========================================
-- MakeScript Production Database Schema
-- ===========================================

-- Create a table for public profiles
create table profiles (
  id uuid references auth.users not null primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  username text unique,
  full_name text,
  avatar_url text,
  website text,
  plan text default 'free' check (plan in ('free', 'creator', 'studio')),
  credits integer default 3,
  stripe_customer_id text,
  stripe_subscription_id text,
  
  constraint username_length check (char_length(username) >= 3)
);

-- Set up Row Level Security (RLS)
-- See https://supabase.com/docs/guides/auth/row-level-security for more details.
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- This trigger automatically creates a profile entry when a new user signs up via Supabase Auth.
-- See https://supabase.com/docs/guides/auth/managing-user-data#using-triggers for more details.
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, plan, credits)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', 'free', 3);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ===========================================
-- Session/activity tracking (optional)
-- ===========================================

-- Track user sessions for analytics
create table user_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_active_at timestamp with time zone default timezone('utc'::text, now()) not null,
  ip_address text,
  user_agent text,
  device_type text
);

alter table user_sessions enable row level security;

create policy "Users can view their own sessions." on user_sessions
  for select using (auth.uid() = user_id);

create policy "Users can insert their own sessions." on user_sessions
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own sessions." on user_sessions
  for update using (auth.uid() = user_id);

-- ===========================================
-- Usage tracking (for credits/limits)
-- ===========================================

-- Track video generations for credit usage
create table usage_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  action_type text not null check (action_type in ('video_generate', 'ai_generate', 'transcription', 'export')),
  credits_used integer default 1,
  metadata jsonb default '{}'::jsonb
);

alter table usage_logs enable row level security;

create policy "Users can view their own usage." on usage_logs
  for select using (auth.uid() = user_id);

-- Admin/Service role can insert usage logs
create policy "Service role can insert usage logs." on usage_logs
  for insert with check (true);

-- ===========================================
-- Helper functions
-- ===========================================

-- Function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Trigger to update updated_at on profiles
create trigger update_profiles_updated_at
  before update on profiles
  for each row execute procedure public.update_updated_at_column();

-- Function to check user credits
create or replace function public.check_user_credits(user_id uuid, required_credits integer)
returns boolean as $$
declare
  current_credits integer;
begin
  select credits into current_credits from profiles where id = user_id;
  return current_credits >= required_credits;
end;
$$ language plpgsql security definer;

-- Function to deduct credits
create or replace function public.deduct_user_credits(user_id uuid, credits_to_deduct integer)
returns boolean as $$
declare
  current_credits integer;
  new_credits integer;
begin
  select credits into current_credits from profiles where id = user_id;
  
  if current_credits < credits_to_deduct then
    return false;
  end if;
  
  new_credits = current_credits - credits_to_deduct;
  
  update profiles set credits = new_credits where id = user_id;
  
  return true;
end;
$$ language plpgsql security definer;

-- Function to add credits (for purchases/referrals)
create or replace function public.add_user_credits(user_id uuid, credits_to_add integer)
returns integer as $$
declare
  new_credits integer;
begin
  update profiles set credits = credits + credits_to_add where id = user_id returning credits into new_credits;
  return new_credits;
end;
$$ language plpgsql security definer;

-- ===========================================
-- Indexes for better query performance
-- ===========================================

create index profiles_email_idx on profiles (id);
create index profiles_plan_idx on profiles (plan);
create index profiles_stripe_customer_idx on profiles (stripe_customer_id);
create index user_sessions_user_idx on user_sessions (user_id);
create index user_sessions_last_active_idx on user_sessions (last_active_at);
create index usage_logs_user_idx on usage_logs (user_id);
create index usage_logs_created_idx on usage_logs (created_at);
create index usage_logs_action_type_idx on usage_logs (action_type);

-- ===========================================
-- Supabase Auth Settings (apply in dashboard)
-- ===========================================
-- In your Supabase dashboard, configure:
-- 1. Enable email verification (Settings > Authentication > Email)
-- 2. Set SITE_URL to your production URL
-- 3. Add additional redirect URLs for OAuth
-- 4. Enable Google OAuth provider if desired
-- 5. Configure email templates for verification/reset