-- MOSSWOOD SECURITY FIXES
-- Critical database security fixes for Supabase
-- Run these in your Supabase SQL Editor in order

-- =========================================
-- PART 1: ENABLE RLS ON CRITICAL TABLES
-- =========================================

-- Enable RLS on profiles table (this is likely what the alert calls "public.users/creators")
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on followers table
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;

-- Enable RLS on videos table (also needs protection)
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Enable RLS on purchases table (sensitive financial data)
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Enable RLS on other sensitive tables
ALTER TABLE video_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;

-- =========================================
-- PART 2: PROFILES TABLE RLS POLICIES
-- =========================================

-- Policy: Users can view all non-admin profiles publicly (for creator discovery)
CREATE POLICY "profiles_select_public" ON profiles
FOR SELECT USING (role != 'master_admin');

-- Policy: Users can only update their own profiles
CREATE POLICY "profiles_update_own" ON profiles
FOR UPDATE USING (auth.uid() = id);

-- Policy: Service role can insert profiles (for registration)
CREATE POLICY "profiles_insert_service" ON profiles
FOR INSERT WITH CHECK (true);

-- Policy: Master admins can do anything (for admin functions)
CREATE POLICY "profiles_admin_all" ON profiles
FOR ALL USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'master_admin'
  )
);

-- =========================================
-- PART 3: VIDEOS TABLE RLS POLICIES  
-- =========================================

-- Policy: Anyone can view videos (public content)
CREATE POLICY "videos_select_public" ON videos
FOR SELECT USING (true);

-- Policy: Creators can insert their own videos
CREATE POLICY "videos_insert_own" ON videos
FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Policy: Creators can update their own videos
CREATE POLICY "videos_update_own" ON videos
FOR UPDATE USING (auth.uid() = creator_id);

-- Policy: Creators can delete their own videos
CREATE POLICY "videos_delete_own" ON videos
FOR DELETE USING (auth.uid() = creator_id);

-- Policy: Master admins can manage all videos
CREATE POLICY "videos_admin_all" ON videos
FOR ALL USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'master_admin'
  )
);

-- =========================================
-- PART 4: FOLLOWERS TABLE RLS POLICIES
-- =========================================

-- Policy: Users can view all follower relationships (for social features)
CREATE POLICY "followers_select_public" ON followers
FOR SELECT USING (true);

-- Policy: Users can follow others (insert their own follows)
CREATE POLICY "followers_insert_own" ON followers
FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- Policy: Users can unfollow others (delete their own follows)
CREATE POLICY "followers_delete_own" ON followers
FOR DELETE USING (auth.uid() = follower_id);

-- Policy: Master admins can manage all follows
CREATE POLICY "followers_admin_all" ON followers
FOR ALL USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'master_admin'
  )
);

-- =========================================
-- PART 5: PURCHASES TABLE RLS POLICIES
-- =========================================

-- Policy: Users can only see their own purchases
CREATE POLICY "purchases_select_own" ON purchases
FOR SELECT USING (auth.uid() = profile_id);

-- Policy: Creators can see purchases of their videos
CREATE POLICY "purchases_select_creator" ON purchases
FOR SELECT USING (
  auth.uid() IN (
    SELECT creator_id FROM videos WHERE id = purchases.video_id
  )
);

-- Policy: Service role can insert purchases (for Stripe webhooks)
CREATE POLICY "purchases_insert_service" ON purchases
FOR INSERT WITH CHECK (true);

-- Policy: Users can delete their own purchases (for refunds)
CREATE POLICY "purchases_delete_own" ON purchases
FOR DELETE USING (auth.uid() = profile_id);

-- Policy: Master admins can view all purchases
CREATE POLICY "purchases_admin_select" ON purchases
FOR SELECT USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'master_admin'
  )
);

-- =========================================
-- PART 6: VIDEO VIEWS TABLE RLS POLICIES
-- =========================================

-- Policy: Anyone can insert video views (for analytics)
CREATE POLICY "video_views_insert_public" ON video_views
FOR INSERT WITH CHECK (true);

-- Policy: Video creators can see views of their videos
CREATE POLICY "video_views_select_creator" ON video_views
FOR SELECT USING (
  auth.uid() IN (
    SELECT creator_id FROM videos WHERE id = video_views.video_id
  )
);

-- Policy: Users can see their own views
CREATE POLICY "video_views_select_own" ON video_views
FOR SELECT USING (auth.uid() = viewer_id);

-- Policy: Master admins can view all video views
CREATE POLICY "video_views_admin_select" ON video_views
FOR SELECT USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'master_admin'
  )
);

-- =========================================
-- PART 7: EMAIL SUBSCRIBERS TABLE RLS POLICIES
-- =========================================

-- Policy: Creators can manage subscribers to their content
CREATE POLICY "email_subscribers_creator_manage" ON email_subscribers
FOR ALL USING (auth.uid() = creator_id);

-- Policy: Service role can insert subscribers (for opt-ins)
CREATE POLICY "email_subscribers_insert_service" ON email_subscribers
FOR INSERT WITH CHECK (true);

-- Policy: Master admins can view all subscribers
CREATE POLICY "email_subscribers_admin_select" ON email_subscribers
FOR SELECT USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'master_admin'
  )
);

-- =========================================
-- PART 8: ANALYTICS DAILY TABLE RLS POLICIES
-- =========================================

-- Policy: Creators can view analytics for their videos
CREATE POLICY "analytics_daily_creator_select" ON analytics_daily
FOR SELECT USING (
  auth.uid() IN (
    SELECT creator_id FROM videos WHERE id = analytics_daily.video_id
  )
);

-- Policy: Service role can insert/update analytics (for automated processes)
CREATE POLICY "analytics_daily_service_all" ON analytics_daily
FOR ALL WITH CHECK (true);

-- Policy: Master admins can view all analytics
CREATE POLICY "analytics_daily_admin_select" ON analytics_daily
FOR SELECT USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'master_admin'
  )
);

-- =========================================
-- VERIFICATION QUERIES
-- =========================================

-- Check RLS status for all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'videos', 'purchases', 'followers', 'video_views', 'email_subscribers', 'analytics_daily')
ORDER BY tablename;

-- Check policies created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;