-- Database Setup for Waraka (Supabase)
-- Use this script in the Supabase SQL Editor to ensure all tables and triggers are correctly set up.

-- 1. Create the PROFILES table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
  username text UNIQUE NOT NULL,
  display_name text,
  total_contributions integer DEFAULT 0,
  current_streak integer DEFAULT 0,
  last_contribution_date date,
  points integer DEFAULT 0,
  is_suspended boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Create the achievement-related tables
CREATE TABLE IF NOT EXISTS public.achievements (
  slug text PRIMARY KEY,
  title text NOT NULL,
  description text,
  points integer DEFAULT 0,
  icon_name text
);

CREATE TABLE IF NOT EXISTS public.contributor_achievements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  contributor_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  achievement_slug text REFERENCES public.achievements(slug) ON DELETE CASCADE,
  unlocked_at timestamp with time zone DEFAULT now(),
  UNIQUE(contributor_id, achievement_slug)
);

-- 3. The handles_new_user function and trigger
-- This is CRITICAL for signup to work!
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'username'
  );
  RETURN new;
END;
$$;

-- Drop trigger if it already exists to avoid duplication
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Policies
-- Profiles are viewable by everyone
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

-- Profiles are editable by owners
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
