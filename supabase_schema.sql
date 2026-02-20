-- 1. PROFILES Table (Extends Supabase Auth)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  username text,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone,

  constraint username_length check (char_length(username) >= 3)
);

-- 2. WORKOUTS Table (Templates)
create table public.workouts (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  description text,
  type text check (type in ('Strength', 'Cardio', 'HIIT', 'Mobility', 'Recovery')),
  duration_minutes integer,
  difficulty text check (difficulty in ('Beginner', 'Intermediate', 'Advanced')),
  user_id uuid references public.profiles(id) -- if null, it's a "system" workout
);

-- 3. EXERCISES Table (Library)
create table public.exercises (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  category text, -- 'Legs', 'Chest', etc.
  video_url text
);

-- 4. WORKOUT_EXERCISES (Join Table for Template Structure)
create table public.workout_exercises (
  id uuid default uuid_generate_v4() primary key,
  workout_id uuid references public.workouts(id) on delete cascade not null,
  exercise_id uuid references public.exercises(id) not null,
  order_index integer not null, -- 1st, 2nd, 3rd exercise
  target_sets integer default 3,
  target_reps integer default 10,
  rest_seconds integer default 60
);

-- 5. WORKOUT_LOGS (Completed Workouts)
create table public.workout_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  workout_id uuid references public.workouts(id), -- optional, could be ad-hoc
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone,
  status text default 'in_progress', -- 'completed', 'cancelled'
  notes text
);

-- 6. EXERCISE_LOGS (Sets performed)
create table public.exercise_logs (
  id uuid default uuid_generate_v4() primary key,
  workout_log_id uuid references public.workout_logs(id) on delete cascade not null,
  exercise_id uuid references public.exercises(id) not null,
  set_number integer,
  reps_completed integer,
  weight_kg numeric,
  is_completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 7. SCHEDULE (Calendar)
create table public.schedule (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  workout_id uuid references public.workouts(id) not null,
  scheduled_date date not null,
  is_completed boolean default false
);

-- RLS POLICIES (Security)
alter table public.profiles enable row level security;
alter table public.workouts enable row level security;
alter table public.exercises enable row level security;
alter table public.workout_logs enable row level security;
alter table public.exercise_logs enable row level security;
alter table public.schedule enable row level security;

-- Allow users to view/edit their own profile
create policy "Public profiles are viewable by everyone." on profiles for select using ( true );
create policy "Users can insert their own profile." on profiles for insert with check ( auth.uid() = id );
create policy "Users can update own profile." on profiles for update using ( auth.uid() = id );

-- Workouts: System workouts visible to all, User workouts only to owner
create policy "Workouts are viewable by everyone" on workouts for select using ( true );
create policy "Users can insert own workouts" on workouts for insert with check ( auth.uid() = user_id );

-- Logs: Private
create policy "Users can view own logs" on workout_logs for select using ( auth.uid() = user_id );
create policy "Users can insert own logs" on workout_logs for insert with check ( auth.uid() = user_id );

-- Schedule: Private
create policy "Users can view own schedule" on schedule for select using ( auth.uid() = user_id );
create policy "Users can insert own schedule" on schedule for insert with check ( auth.uid() = user_id );
create policy "Users can update own schedule" on schedule for update using ( auth.uid() = user_id );
create policy "Users can delete own schedule" on schedule for delete using ( auth.uid() = user_id );

-- TRIGGERS (Auto-create profile)
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- SEED DATA (Optional Starter Content)
INSERT INTO public.exercises (name, category) VALUES 
('Barbell Squat', 'Legs'),
('Bench Press', 'Chest'),
('Deadlift', 'Back'),
('Overhead Press', 'Shoulders'),
('Pull Up', 'Back'),
('Dumbbell Lunge', 'Legs'),
('Plank', 'Core'),
('Push Up', 'Chest');
