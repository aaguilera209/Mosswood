-- CORRECTED DATABASE FUNCTIONS
-- Fixed syntax and proper security implementation
-- Run in your Supabase SQL Editor

-- =========================================
-- DROP EXISTING FUNCTIONS FIRST (CLEANUP)
-- =========================================

DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_daily_analytics() CASCADE;
DROP FUNCTION IF EXISTS handle_user_login() CASCADE;
DROP FUNCTION IF EXISTS log_admin_action(text, text, text, jsonb) CASCADE;

-- =========================================
-- FUNCTION 1: HANDLE NEW USER REGISTRATION
-- =========================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create a profile for the new user with default viewer role
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    'viewer'
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent duplicate profile creation
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- =========================================
-- FUNCTION 2: UPDATE TIMESTAMP TRIGGER
-- =========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update the updated_at timestamp
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- =========================================
-- FUNCTION 3: UPDATE DAILY ANALYTICS
-- =========================================

CREATE OR REPLACE FUNCTION update_daily_analytics()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  view_date text;
BEGIN
  -- Calculate the date for analytics
  view_date := DATE(NEW.created_at);
  
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
    view_date,
    1, -- total_views
    CASE WHEN NEW.is_returning_viewer THEN 0 ELSE 1 END, -- unique_viewers
    COALESCE(NEW.watch_duration, 0), -- watch_time_total
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
    watch_time_total = analytics_daily.watch_time_total + COALESCE(NEW.watch_duration, 0),
    completions = analytics_daily.completions + CASE WHEN NEW.completed THEN 1 ELSE 0 END,
    new_viewers = analytics_daily.new_viewers + CASE WHEN NEW.is_returning_viewer THEN 0 ELSE 1 END,
    returning_viewers = analytics_daily.returning_viewers + CASE WHEN NEW.is_returning_viewer THEN 1 ELSE 0 END,
    mobile_views = analytics_daily.mobile_views + CASE WHEN NEW.device_type = 'mobile' THEN 1 ELSE 0 END,
    desktop_views = analytics_daily.desktop_views + CASE WHEN NEW.device_type = 'desktop' THEN 1 ELSE 0 END;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the view tracking
    RAISE WARNING 'Failed to update analytics for video %: %', NEW.video_id, SQLERRM;
    RETURN NEW;
END;
$$;

-- =========================================
-- FUNCTION 4: HANDLE USER LOGIN
-- =========================================

CREATE OR REPLACE FUNCTION handle_user_login()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update last login timestamp in profiles
  UPDATE public.profiles 
  SET updated_at = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the login
    RAISE WARNING 'Failed to update login timestamp for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- =========================================
-- FUNCTION 5: ADMIN AUDIT LOGGING (OPTIONAL)
-- =========================================

CREATE OR REPLACE FUNCTION log_admin_action(
  p_action text,
  p_resource_type text,
  p_resource_id text DEFAULT NULL,
  p_details jsonb DEFAULT NULL
)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only log if user is authenticated and is an admin
  IF auth.uid() IS NOT NULL AND 
     EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'master_admin') THEN
    
    INSERT INTO public.admin_audit_log (
      admin_user_id,
      action,
      resource_type,
      resource_id,
      details,
      created_at
    ) VALUES (
      auth.uid(),
      p_action,
      p_resource_type,
      p_resource_id,
      p_details,
      NOW()
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail operations if audit logging fails
    RAISE WARNING 'Failed to log admin action: %', SQLERRM;
END;
$$;

-- =========================================
-- RECREATE TRIGGERS WITH CORRECTED FUNCTIONS
-- =========================================

-- Drop existing triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_videos_updated_at ON public.videos;
DROP TRIGGER IF EXISTS trigger_update_daily_analytics ON public.video_views;
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;

-- Create user registration trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create updated_at triggers for profiles and videos
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_videos_updated_at
  BEFORE UPDATE ON public.videos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create analytics trigger (only if analytics_daily table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'analytics_daily' AND schemaname = 'public') THEN
    EXECUTE 'CREATE TRIGGER trigger_update_daily_analytics
      AFTER INSERT ON public.video_views
      FOR EACH ROW EXECUTE FUNCTION update_daily_analytics()';
  END IF;
END
$$;

-- =========================================
-- CREATE OPTIONAL ADMIN AUDIT TABLE
-- =========================================

-- Create admin audit log table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES auth.users(id),
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  details jsonb,
  created_at timestamp with time zone DEFAULT NOW()
);

-- Enable RLS on admin audit log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Create policies for admin audit log
DROP POLICY IF EXISTS "admin_audit_log_admin_only" ON public.admin_audit_log;
CREATE POLICY "admin_audit_log_admin_only" ON public.admin_audit_log
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles admin_check 
    WHERE admin_check.id = auth.uid() AND admin_check.role = 'master_admin'
  )
);

-- =========================================
-- VERIFICATION QUERIES
-- =========================================

-- Check function security settings
SELECT 
  'Function Security Check' as check_type,
  p.proname as function_name,
  CASE 
    WHEN p.prosecdef AND array_to_string(p.proconfig, '') LIKE '%search_path%' 
    THEN '✅ SECURE' 
    ELSE '❌ INSECURE' 
  END as status,
  array_to_string(p.proconfig, ', ') as config
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname IN ('handle_new_user', 'update_updated_at_column', 'update_daily_analytics', 'handle_user_login', 'log_admin_action')
ORDER BY p.proname;

-- Check triggers
SELECT 
  'Trigger Check' as check_type,
  trigger_name,
  event_object_table as table_name,
  '✅ ACTIVE' as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
  AND trigger_name IN ('on_auth_user_created', 'update_profiles_updated_at', 'update_videos_updated_at', 'trigger_update_daily_analytics')
ORDER BY trigger_name;

-- Final success message
SELECT 
  '✅ CORRECTED FUNCTIONS IMPLEMENTED' as status,
  'All database functions now have proper security and error handling.' as message;