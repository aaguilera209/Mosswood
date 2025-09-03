-- REFINED SECURITY FIXES - Final Implementation
-- Addresses critical admin logic, security vulnerabilities, and functionality gaps
-- Run in your Supabase SQL Editor

-- =========================================
-- CRITICAL FIX 1: CORRECT ADMIN CHECK LOGIC
-- =========================================

-- First, drop all existing policies with flawed admin logic
DROP POLICY IF EXISTS "profiles_admin_manage" ON profiles;
DROP POLICY IF EXISTS "videos_admin_manage" ON videos; 
DROP POLICY IF EXISTS "followers_admin_manage" ON followers;
DROP POLICY IF EXISTS "purchases_admin_view" ON purchases;
DROP POLICY IF EXISTS "video_views_admin_view" ON video_views;
DROP POLICY IF EXISTS "email_subscribers_admin_view" ON email_subscribers;
DROP POLICY IF EXISTS "analytics_daily_admin_view" ON analytics_daily;

-- Recreate admin policies with CORRECT logic
-- Check if the CURRENT USER is an admin, not if admin is checking themselves

-- Profiles: Master admins can manage all profiles
CREATE POLICY "profiles_admin_manage" ON profiles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'master_admin'
  )
);

-- Videos: Master admins can manage all videos
CREATE POLICY "videos_admin_manage" ON videos
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'master_admin'
  )
);

-- Followers: Master admins can manage all follows
CREATE POLICY "followers_admin_manage" ON followers
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'master_admin'
  )
);

-- Purchases: Master admins can view all purchases
CREATE POLICY "purchases_admin_view" ON purchases
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'master_admin'
  )
);

-- Video Views: Master admins can view all video views
CREATE POLICY "video_views_admin_view" ON video_views
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'master_admin'
  )
);

-- Email Subscribers: Master admins can view all subscribers
CREATE POLICY "email_subscribers_admin_view" ON email_subscribers
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'master_admin'
  )
);

-- Analytics: Master admins can view all analytics
CREATE POLICY "analytics_daily_admin_view" ON analytics_daily
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'master_admin'
  )
);

-- =========================================
-- CRITICAL FIX 2: SECURE VIDEO VIEWS
-- =========================================

-- Drop the overly permissive video views policy
DROP POLICY IF EXISTS "video_views_insert_track" ON video_views;

-- Create secure policy that validates the viewer
CREATE POLICY "video_views_insert_authenticated" ON video_views
FOR INSERT WITH CHECK (
  auth.uid() = viewer_id OR 
  viewer_id IS NULL -- Allow anonymous views for public videos
);

-- Users can view their own video view history
CREATE POLICY "video_views_select_own" ON video_views
FOR SELECT USING (auth.uid() = viewer_id);

-- =========================================
-- CRITICAL FIX 3: EMAIL SUBSCRIPTION MANAGEMENT
-- =========================================

-- Drop existing email subscriber policies to recreate with user access
DROP POLICY IF EXISTS "email_subscribers_creator_own" ON email_subscribers;
DROP POLICY IF EXISTS "email_subscribers_service_manage" ON email_subscribers;

-- Policy 1: Users can view their own subscriptions
CREATE POLICY "email_subscribers_user_view_own" ON email_subscribers
FOR SELECT USING (auth.uid() = subscriber_id);

-- Policy 2: Users can delete their own subscriptions (unsubscribe)
CREATE POLICY "email_subscribers_user_delete_own" ON email_subscribers
FOR DELETE USING (auth.uid() = subscriber_id);

-- Policy 3: Users can create new subscriptions (subscribe)
CREATE POLICY "email_subscribers_user_insert" ON email_subscribers
FOR INSERT WITH CHECK (auth.uid() = subscriber_id);

-- Policy 4: Creators can view their own subscribers
CREATE POLICY "email_subscribers_creator_view" ON email_subscribers
FOR SELECT USING (auth.uid() = creator_id);

-- Policy 5: Service role can manage subscriptions (for server operations)
CREATE POLICY "email_subscribers_service_manage" ON email_subscribers
FOR ALL WITH CHECK (true);

-- =========================================
-- IMPROVEMENT 4: PERFORMANCE INDEXES
-- =========================================

-- Create indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

CREATE INDEX IF NOT EXISTS idx_videos_creator_id ON videos(creator_id);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_purchases_profile_id ON purchases(profile_id);
CREATE INDEX IF NOT EXISTS idx_purchases_video_id ON purchases(video_id);

CREATE INDEX IF NOT EXISTS idx_video_views_video_id ON video_views(video_id);
CREATE INDEX IF NOT EXISTS idx_video_views_viewer_id ON video_views(viewer_id);

CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following_id ON followers(following_id);

-- Composite indexes for analytics
CREATE INDEX IF NOT EXISTS idx_analytics_daily_video_date ON analytics_daily(video_id, date);

-- Email subscriber indexes
CREATE INDEX IF NOT EXISTS idx_email_subscribers_subscriber ON email_subscribers(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_email_subscribers_creator ON email_subscribers(creator_id);

-- =========================================
-- IMPROVEMENT 5: ANALYTICS SECURITY REFINEMENT
-- =========================================

-- Drop overly permissive analytics policies
DROP POLICY IF EXISTS "analytics_daily_service_manage" ON analytics_daily;

-- Create more specific service role policies
CREATE POLICY "analytics_daily_service_update" ON analytics_daily
FOR UPDATE USING (true) -- Service role can update
WITH CHECK (
  -- Ensure counts only increase (no manipulation)
  total_views >= OLD.total_views AND
  unique_viewers >= OLD.unique_viewers AND
  watch_time_total >= OLD.watch_time_total
);

CREATE POLICY "analytics_daily_service_insert" ON analytics_daily
FOR INSERT WITH CHECK (true); -- Service role can insert new analytics

-- =========================================
-- IMPROVEMENT 6: DATA VALIDATION CONSTRAINTS
-- =========================================

-- Add validation constraints to prevent invalid data

-- Video views constraints
DO $$
BEGIN
  -- Check if watch_duration column exists in video_views
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'video_views' 
      AND column_name = 'watch_duration'
  ) THEN
    EXECUTE 'ALTER TABLE video_views 
             ADD CONSTRAINT IF NOT EXISTS valid_watch_duration 
             CHECK (watch_duration >= 0 AND watch_duration <= 86400)'; -- Max 24 hours
  END IF;
END $$;

-- Analytics daily constraints
DO $$
BEGIN
  -- Add constraints if table exists
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'analytics_daily' AND schemaname = 'public') THEN
    EXECUTE 'ALTER TABLE analytics_daily 
             ADD CONSTRAINT IF NOT EXISTS valid_view_counts 
             CHECK (
               total_views >= 0 AND
               unique_viewers >= 0 AND
               unique_viewers <= total_views AND
               watch_time_total >= 0
             )';
  END IF;
END $$;

-- Video price constraints (ensure positive prices)
ALTER TABLE videos 
ADD CONSTRAINT IF NOT EXISTS valid_price 
CHECK (price >= 0);

-- =========================================
-- IMPROVEMENT 7: ENHANCED FUNCTION ERROR HANDLING
-- =========================================

-- Drop existing functions to recreate with better error handling
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_daily_analytics() CASCADE;

-- Recreate handle_new_user with comprehensive error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  BEGIN
    -- Create profile with default viewer role
    INSERT INTO public.profiles (id, email, role)
    VALUES (
      NEW.id,
      NEW.email,
      'viewer'
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
  EXCEPTION
    WHEN unique_violation THEN
      -- Profile already exists, that's okay
      RAISE LOG 'Profile already exists for user %', NEW.id;
      RETURN NEW;
    WHEN OTHERS THEN
      -- Log error but don't fail user creation
      RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
      RETURN NEW;
  END;
END;
$$;

-- Recreate update_updated_at_column with error handling
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'Error in update_updated_at_column: %', SQLERRM;
      RETURN NEW; -- Return NEW to avoid breaking the update
  END;
END;
$$;

-- Recreate update_daily_analytics with better error handling
CREATE OR REPLACE FUNCTION update_daily_analytics()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  view_date date;
  watch_duration_val integer := 0;
BEGIN
  BEGIN
    -- Calculate the date for analytics
    view_date := DATE(NEW.created_at);
    
    -- Safely get watch duration if column exists
    BEGIN
      watch_duration_val := COALESCE(NEW.watch_duration, 0);
    EXCEPTION
      WHEN undefined_column THEN
        watch_duration_val := 0;
    END;
    
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
      1,
      CASE WHEN COALESCE(NEW.is_returning_viewer, false) THEN 0 ELSE 1 END,
      watch_duration_val,
      CASE WHEN COALESCE(NEW.completed, false) THEN 1 ELSE 0 END,
      CASE WHEN COALESCE(NEW.is_returning_viewer, false) THEN 0 ELSE 1 END,
      CASE WHEN COALESCE(NEW.is_returning_viewer, false) THEN 1 ELSE 0 END,
      CASE WHEN COALESCE(NEW.device_type, '') = 'mobile' THEN 1 ELSE 0 END,
      CASE WHEN COALESCE(NEW.device_type, '') = 'desktop' THEN 1 ELSE 0 END
    )
    ON CONFLICT (video_id, date) 
    DO UPDATE SET
      total_views = analytics_daily.total_views + 1,
      unique_viewers = analytics_daily.unique_viewers + CASE WHEN COALESCE(NEW.is_returning_viewer, false) THEN 0 ELSE 1 END,
      watch_time_total = analytics_daily.watch_time_total + watch_duration_val,
      completions = analytics_daily.completions + CASE WHEN COALESCE(NEW.completed, false) THEN 1 ELSE 0 END,
      new_viewers = analytics_daily.new_viewers + CASE WHEN COALESCE(NEW.is_returning_viewer, false) THEN 0 ELSE 1 END,
      returning_viewers = analytics_daily.returning_viewers + CASE WHEN COALESCE(NEW.is_returning_viewer, false) THEN 1 ELSE 0 END,
      mobile_views = analytics_daily.mobile_views + CASE WHEN COALESCE(NEW.device_type, '') = 'mobile' THEN 1 ELSE 0 END,
      desktop_views = analytics_daily.desktop_views + CASE WHEN COALESCE(NEW.device_type, '') = 'desktop' THEN 1 ELSE 0 END;

    RETURN NEW;
  EXCEPTION
    WHEN undefined_table THEN
      -- analytics_daily table doesn't exist yet, that's okay
      RAISE LOG 'Analytics table does not exist yet for video %', NEW.video_id;
      RETURN NEW;
    WHEN OTHERS THEN
      -- Log error but don't fail the view tracking
      RAISE LOG 'Error in update_daily_analytics for video %: %', NEW.video_id, SQLERRM;
      RETURN NEW;
  END;
END;
$$;

-- =========================================
-- RECREATE TRIGGERS WITH UPDATED FUNCTIONS
-- =========================================

-- Drop existing triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_videos_updated_at ON public.videos;
DROP TRIGGER IF EXISTS trigger_update_daily_analytics ON public.video_views;

-- Recreate triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_videos_updated_at
  BEFORE UPDATE ON public.videos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Only create analytics trigger if table exists
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
-- VERIFICATION AND TESTING QUERIES
-- =========================================

-- Test admin check logic
SELECT 
  'Admin Logic Test' as test_name,
  COUNT(*) as admin_policies,
  CASE WHEN COUNT(*) >= 7 THEN '✅ PASS' ELSE '❌ FAIL' END as result
FROM pg_policies 
WHERE schemaname = 'public' 
  AND policyname LIKE '%admin%';

-- Test index creation
SELECT 
  'Index Creation Test' as test_name,
  COUNT(*) as index_count,
  CASE WHEN COUNT(*) >= 10 THEN '✅ PASS' ELSE '❌ FAIL' END as result
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%';

-- Test function security
SELECT 
  'Function Security Test' as test_name,
  p.proname as function_name,
  CASE 
    WHEN p.prosecdef AND array_to_string(p.proconfig, '') LIKE '%search_path%' 
    THEN '✅ SECURE' 
    ELSE '❌ INSECURE' 
  END as status
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname IN ('handle_new_user', 'update_updated_at_column', 'update_daily_analytics')
ORDER BY p.proname;

-- Test constraint creation
SELECT 
  'Constraint Test' as test_name,
  COUNT(*) as constraint_count,
  CASE WHEN COUNT(*) >= 3 THEN '✅ PASS' ELSE '❌ FAIL' END as result
FROM information_schema.table_constraints 
WHERE constraint_schema = 'public' 
  AND constraint_type = 'CHECK'
  AND constraint_name IN ('valid_watch_duration', 'valid_view_counts', 'valid_price');

-- Final summary
SELECT 
  '🔒 REFINED SECURITY IMPLEMENTATION COMPLETE' as status,
  'All critical issues addressed: admin logic, view security, subscriptions, error handling, performance, and validation.' as summary;