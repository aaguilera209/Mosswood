-- FUNCTION SECURITY FIXES
-- Fix mutable search paths for database functions
-- Run these in your Supabase SQL Editor

-- =========================================
-- PART 1: FIX FUNCTION SEARCH PATHS
-- =========================================

-- Check current function definitions first
SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_result(p.oid) as result_type,
  pg_get_function_arguments(p.oid) as arguments,
  p.prosecdef as security_definer,
  array_to_string(p.proconfig, ', ') as configuration
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname IN ('handle_new_user', 'update_updated_at_column', 'update_daily_analytics', 'handle_user_login')
ORDER BY p.proname;

-- =========================================
-- Fix handle_new_user function
-- =========================================
-- This function creates profiles for new users
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS trigger 
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql AS $$
BEGIN
  -- Create a profile for the new user
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    'viewer' -- Default role
  );
  
  RETURN NEW;
END;
$$;

-- =========================================
-- Fix update_updated_at_column function
-- =========================================
-- This function updates the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column() 
RETURNS trigger 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- =========================================
-- Fix update_daily_analytics function  
-- =========================================
-- This function aggregates daily analytics
CREATE OR REPLACE FUNCTION update_daily_analytics() 
RETURNS trigger 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  -- Update or insert daily analytics record
  INSERT INTO public.analytics_daily (
    video_id,
    date,
    total_views,
    unique_viewers,
    watch_time_total,
    completions,
    new_viewers,
    returning_viewers,
    mobile_views,
    desktop_views
  )
  VALUES (
    NEW.video_id,
    DATE(NEW.created_at),
    1, -- total_views
    CASE WHEN NEW.is_returning_viewer THEN 0 ELSE 1 END, -- unique_viewers
    NEW.watch_duration, -- watch_time_total
    CASE WHEN NEW.completed THEN 1 ELSE 0 END, -- completions
    CASE WHEN NEW.is_returning_viewer THEN 0 ELSE 1 END, -- new_viewers
    CASE WHEN NEW.is_returning_viewer THEN 1 ELSE 0 END, -- returning_viewers
    CASE WHEN NEW.device_type = 'mobile' THEN 1 ELSE 0 END, -- mobile_views
    CASE WHEN NEW.device_type = 'desktop' THEN 1 ELSE 0 END -- desktop_views
  )
  ON CONFLICT (video_id, date) 
  DO UPDATE SET
    total_views = analytics_daily.total_views + 1,
    unique_viewers = analytics_daily.unique_viewers + CASE WHEN NEW.is_returning_viewer THEN 0 ELSE 1 END,
    watch_time_total = analytics_daily.watch_time_total + NEW.watch_duration,
    completions = analytics_daily.completions + CASE WHEN NEW.completed THEN 1 ELSE 0 END,
    new_viewers = analytics_daily.new_viewers + CASE WHEN NEW.is_returning_viewer THEN 0 ELSE 1 END,
    returning_viewers = analytics_daily.returning_viewers + CASE WHEN NEW.is_returning_viewer THEN 1 ELSE 0 END,
    mobile_views = analytics_daily.mobile_views + CASE WHEN NEW.device_type = 'mobile' THEN 1 ELSE 0 END,
    desktop_views = analytics_daily.desktop_views + CASE WHEN NEW.device_type = 'desktop' THEN 1 ELSE 0 END;

  RETURN NEW;
END;
$$;

-- =========================================
-- Fix handle_user_login function
-- =========================================  
-- This function tracks user login events
CREATE OR REPLACE FUNCTION handle_user_login() 
RETURNS trigger 
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql AS $$
BEGIN
  -- Update last login timestamp in profiles if exists
  UPDATE public.profiles 
  SET updated_at = NOW()
  WHERE id = NEW.id;
  
  -- Log could be added here for audit purposes
  
  RETURN NEW;
END;
$$;

-- =========================================
-- RECREATE TRIGGERS WITH SECURE FUNCTIONS
-- =========================================

-- Drop existing triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_videos_updated_at ON public.videos;
DROP TRIGGER IF EXISTS trigger_update_daily_analytics ON public.video_views;
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;

-- Recreate triggers with secure functions
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_videos_updated_at
  BEFORE UPDATE ON public.videos
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER trigger_update_daily_analytics
  AFTER INSERT ON public.video_views
  FOR EACH ROW EXECUTE PROCEDURE update_daily_analytics();

-- Note: auth.users login trigger may need different event
-- Check your Supabase auth configuration for the correct event

-- =========================================
-- VERIFICATION QUERIES
-- =========================================

-- Check function security settings
SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  p.prosecdef as security_definer,
  array_to_string(p.proconfig, ', ') as search_path_config
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname IN ('handle_new_user', 'update_updated_at_column', 'update_daily_analytics', 'handle_user_login')
ORDER BY p.proname;

-- Check triggers
SELECT 
  event_object_table as table_name,
  trigger_name,
  event_manipulation as event,
  action_statement as function_call
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;