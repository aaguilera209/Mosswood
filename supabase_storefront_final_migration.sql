-- Final storefront enhancement migration
-- Creates missing tables for followers, video views, and banner support

-- Create followers table
CREATE TABLE IF NOT EXISTS followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  followed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, creator_id)
);

-- Create video_views table  
CREATE TABLE IF NOT EXISTS video_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Add banner_url to profiles if not exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_followers_creator ON followers(creator_id);
CREATE INDEX IF NOT EXISTS idx_followers_follower ON followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_video_views_video ON video_views(video_id);
CREATE INDEX IF NOT EXISTS idx_video_views_viewer ON video_views(viewer_id);

-- Add some test data to demonstrate functionality
-- Insert a test follower relationship (user following themselves for demo)
INSERT INTO followers (follower_id, creator_id) 
SELECT p1.id, p2.id 
FROM profiles p1, profiles p2 
WHERE p1.role = 'viewer' AND p2.role = 'creator'
AND NOT EXISTS (
  SELECT 1 FROM followers 
  WHERE follower_id = p1.id AND creator_id = p2.id
)
LIMIT 1
ON CONFLICT (follower_id, creator_id) DO NOTHING;

-- Add some test video views
INSERT INTO video_views (video_id, viewer_id) 
SELECT v.id, p.id
FROM videos v, profiles p
WHERE v.id IN (SELECT id FROM videos LIMIT 3)
AND p.role = 'viewer'
LIMIT 10
ON CONFLICT DO NOTHING;