-- Run this in your Supabase SQL Editor

create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  name text,
  avatar_url text,
  daily_calorie_limit integer not null default 2000,
  daily_protein_limit integer not null default 50,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists meal_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  image_url text,
  food_items jsonb not null default '[]',
  total_calories integer not null default 0,
  total_protein numeric(6,1) not null default 0,
  total_carbs numeric(6,1) not null default 0,
  total_fat numeric(6,1) not null default 0,
  analysis_text text,
  logged_at timestamptz not null default now(),
  created_at timestamptz default now()
);

create index if not exists meal_logs_user_logged_at on meal_logs (user_id, logged_at desc);

-- Row Level Security
alter table profiles enable row level security;
alter table meal_logs enable row level security;

create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can view own meals"
  on meal_logs for select using (auth.uid() = user_id);

create policy "Users can insert own meals"
  on meal_logs for insert with check (auth.uid() = user_id);

create policy "Users can delete own meals"
  on meal_logs for delete using (auth.uid() = user_id);
