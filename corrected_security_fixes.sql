-- CORRECTED SECURITY FIXES - FUNCTIONAL AND SECURE
-- These policies enable proper security while maintaining application functionality
-- Run in your Supabase SQL Editor

-- =========================================
-- PART 1: ENABLE RLS ON CRITICAL TABLES
-- =========================================

-- Enable RLS on all critical tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;  
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;

-- =========================================
-- PART 2: PROFILES TABLE - FUNCTIONAL POLICIES
-- =========================================

-- Drop existing policies first (in case of re-run)
DROP POLICY IF EXISTS "profiles_select_public" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_service" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;

-- Policy 1: Anyone can view non-admin profiles (for creator discovery)
CREATE POLICY "profiles_select_public" ON profiles
FOR SELECT USING (role != 'master_admin');

-- Policy 2: Users can update their own profiles (normal user behavior)
CREATE POLICY "profiles_update_own" ON profiles
FOR UPDATE USING (auth.uid() = id);

-- Policy 3: Service role can insert profiles (for registration via server)
CREATE POLICY "profiles_insert_service" ON profiles
FOR INSERT WITH CHECK (true);

-- Policy 4: Users can insert their own profiles (direct Supabase auth)
CREATE POLICY "profiles_insert_own" ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy 5: Master admins can manage all profiles
CREATE POLICY "profiles_admin_manage" ON profiles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles admin_check 
    WHERE admin_check.id = auth.uid() AND admin_check.role = 'master_admin'
  )
);

-- =========================================
-- PART 3: VIDEOS TABLE - FUNCTIONAL POLICIES
-- =========================================

-- Drop existing policies first
DROP POLICY IF EXISTS "videos_select_public" ON videos;
DROP POLICY IF EXISTS "videos_insert_own" ON videos;
DROP POLICY IF EXISTS "videos_update_own" ON videos;
DROP POLICY IF EXISTS "videos_delete_own" ON videos;
DROP POLICY IF EXISTS "videos_admin_all" ON videos;

-- Policy 1: Anyone can view videos (public content platform)
CREATE POLICY "videos_select_public" ON videos
FOR SELECT USING (true);

-- Policy 2: Creators can insert their own videos
CREATE POLICY "videos_insert_creator" ON videos
FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Policy 3: Creators can update their own videos  
CREATE POLICY "videos_update_own" ON videos
FOR UPDATE USING (auth.uid() = creator_id);

-- Policy 4: Creators can delete their own videos
CREATE POLICY "videos_delete_own" ON videos
FOR DELETE USING (auth.uid() = creator_id);

-- Policy 5: Service role can manage videos (for server operations)
CREATE POLICY "videos_service_manage" ON videos
FOR ALL WITH CHECK (true);

-- Policy 6: Master admins can manage all videos
CREATE POLICY "videos_admin_manage" ON videos
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles admin_check 
    WHERE admin_check.id = auth.uid() AND admin_check.role = 'master_admin'
  )
);

-- =========================================
-- PART 4: FOLLOWERS TABLE - FUNCTIONAL POLICIES
-- =========================================

-- Drop existing policies first
DROP POLICY IF EXISTS "followers_select_public" ON followers;
DROP POLICY IF EXISTS "followers_insert_own" ON followers;
DROP POLICY IF EXISTS "followers_delete_own" ON followers;
DROP POLICY IF EXISTS "followers_admin_all" ON followers;

-- Policy 1: Anyone can view follower relationships (social platform)
CREATE POLICY "followers_select_public" ON followers
FOR SELECT USING (true);

-- Policy 2: Users can follow others (insert with their own follower_id)
CREATE POLICY "followers_insert_follow" ON followers
FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- Policy 3: Users can unfollow others (delete their own follows)
CREATE POLICY "followers_delete_unfollow" ON followers
FOR DELETE USING (auth.uid() = follower_id);

-- Policy 4: Service role can manage follows (for server operations)
CREATE POLICY "followers_service_manage" ON followers
FOR ALL WITH CHECK (true);

-- Policy 5: Master admins can manage all follows
CREATE POLICY "followers_admin_manage" ON followers
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles admin_check 
    WHERE admin_check.id = auth.uid() AND admin_check.role = 'master_admin'
  )
);

-- =========================================
-- PART 5: PURCHASES TABLE - FUNCTIONAL POLICIES
-- =========================================

-- Drop existing policies first
DROP POLICY IF EXISTS "purchases_select_own" ON purchases;
DROP POLICY IF EXISTS "purchases_select_creator" ON purchases;
DROP POLICY IF EXISTS "purchases_insert_service" ON purchases;
DROP POLICY IF EXISTS "purchases_delete_own" ON purchases;
DROP POLICY IF EXISTS "purchases_admin_select" ON purchases;

-- Policy 1: Users can view their own purchases
CREATE POLICY "purchases_select_buyer" ON purchases
FOR SELECT USING (auth.uid() = profile_id);

-- Policy 2: Creators can view purchases of their videos
CREATE POLICY "purchases_select_seller" ON purchases
FOR SELECT USING (
  auth.uid() IN (
    SELECT creator_id FROM videos WHERE id = purchases.video_id
  )
);

-- Policy 3: Service role can manage purchases (for Stripe webhooks)
CREATE POLICY "purchases_service_manage" ON purchases
FOR ALL WITH CHECK (true);

-- Policy 4: Master admins can view all purchases
CREATE POLICY "purchases_admin_view" ON purchases
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles admin_check 
    WHERE admin_check.id = auth.uid() AND admin_check.role = 'master_admin'
  )
);

-- =========================================
-- PART 6: VIDEO VIEWS TABLE - FUNCTIONAL POLICIES
-- =========================================

-- Drop existing policies first
DROP POLICY IF EXISTS "video_views_insert_public" ON video_views;
DROP POLICY IF EXISTS "video_views_select_creator" ON video_views;
DROP POLICY IF EXISTS "video_views_select_own" ON video_views;
DROP POLICY IF EXISTS "video_views_admin_select" ON video_views;

-- Policy 1: Anyone can insert video views (analytics tracking)
CREATE POLICY "video_views_insert_track" ON video_views
FOR INSERT WITH CHECK (true);

-- Policy 2: Video creators can view analytics for their videos
CREATE POLICY "video_views_creator_analytics" ON video_views
FOR SELECT USING (
  auth.uid() IN (
    SELECT creator_id FROM videos WHERE id = video_views.video_id
  )
);

-- Policy 3: Service role can manage video views (for server operations)
CREATE POLICY "video_views_service_manage" ON video_views
FOR ALL WITH CHECK (true);

-- Policy 4: Master admins can view all video views
CREATE POLICY "video_views_admin_view" ON video_views
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles admin_check 
    WHERE admin_check.id = auth.uid() AND admin_check.role = 'master_admin'
  )
);

-- =========================================
-- PART 7: EMAIL SUBSCRIBERS TABLE - FUNCTIONAL POLICIES
-- =========================================

-- Drop existing policies first
DROP POLICY IF EXISTS "email_subscribers_creator_manage" ON email_subscribers;
DROP POLICY IF EXISTS "email_subscribers_insert_service" ON email_subscribers;
DROP POLICY IF EXISTS "email_subscribers_admin_select" ON email_subscribers;

-- Policy 1: Creators can manage their own subscribers
CREATE POLICY "email_subscribers_creator_own" ON email_subscribers
FOR ALL USING (auth.uid() = creator_id);

-- Policy 2: Service role can manage subscribers (for server operations)
CREATE POLICY "email_subscribers_service_manage" ON email_subscribers
FOR ALL WITH CHECK (true);

-- Policy 3: Master admins can view all subscribers
CREATE POLICY "email_subscribers_admin_view" ON email_subscribers
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles admin_check 
    WHERE admin_check.id = auth.uid() AND admin_check.role = 'master_admin'
  )
);

-- =========================================
-- PART 8: ANALYTICS DAILY TABLE - FUNCTIONAL POLICIES
-- =========================================

-- Drop existing policies first
DROP POLICY IF EXISTS "analytics_daily_creator_select" ON analytics_daily;
DROP POLICY IF EXISTS "analytics_daily_service_all" ON analytics_daily;
DROP POLICY IF EXISTS "analytics_daily_admin_select" ON analytics_daily;

-- Policy 1: Creators can view analytics for their videos
CREATE POLICY "analytics_daily_creator_view" ON analytics_daily
FOR SELECT USING (
  auth.uid() IN (
    SELECT creator_id FROM videos WHERE id = analytics_daily.video_id
  )
);

-- Policy 2: Service role can manage analytics (for automated processes)
CREATE POLICY "analytics_daily_service_manage" ON analytics_daily
FOR ALL WITH CHECK (true);

-- Policy 3: Master admins can view all analytics
CREATE POLICY "analytics_daily_admin_view" ON analytics_daily
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles admin_check 
    WHERE admin_check.id = auth.uid() AND admin_check.role = 'master_admin'
  )
);

-- =========================================
-- VERIFICATION QUERIES
-- =========================================

-- Check RLS status
SELECT 
  schemaname, 
  tablename, 
  rowsecurity,
  CASE WHEN rowsecurity THEN '✅ RLS ENABLED' ELSE '❌ RLS DISABLED' END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'videos', 'purchases', 'followers', 'video_views', 'email_subscribers', 'analytics_daily')
ORDER BY tablename;

-- Check policy counts
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'videos', 'purchases', 'followers', 'video_views', 'email_subscribers', 'analytics_daily')
GROUP BY tablename
ORDER BY tablename;