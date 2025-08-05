-- Storefront Enhancement Migration
-- Adds followers table, banner_url to profiles, and indexes for performance

-- Add banner_url to profiles table if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Create followers table
CREATE TABLE IF NOT EXISTS followers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    followed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, creator_id) -- Prevent duplicate follows
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_followers_creator_id ON followers(creator_id);
CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_video_views_video_id ON video_views(video_id);
CREATE INDEX IF NOT EXISTS idx_videos_creator_id ON videos(creator_id);

-- Enable RLS for followers table
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;

-- RLS policies for followers
-- Allow users to see who they follow and who follows them
CREATE POLICY "Users can view their own follows" ON followers
    FOR SELECT USING (auth.uid() = follower_id OR auth.uid() = creator_id);

-- Allow users to follow/unfollow creators
CREATE POLICY "Users can manage their own follows" ON followers
    FOR ALL USING (auth.uid() = follower_id);

-- Allow creators to see their followers
CREATE POLICY "Creators can view their followers" ON followers
    FOR SELECT USING (auth.uid() = creator_id);

-- Create function to get creator statistics
CREATE OR REPLACE FUNCTION get_creator_stats(creator_uuid UUID)
RETURNS TABLE(
    total_followers BIGINT,
    total_views BIGINT,
    total_videos BIGINT
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM followers WHERE creator_id = creator_uuid) as total_followers,
        (SELECT COUNT(*) FROM video_views vv 
         JOIN videos v ON vv.video_id = v.id 
         WHERE v.creator_id = creator_uuid) as total_views,
        (SELECT COUNT(*) FROM videos WHERE creator_id = creator_uuid) as total_videos;
END;
$$;

-- Create function to get video view count
CREATE OR REPLACE FUNCTION get_video_view_count(video_int_id INTEGER)
RETURNS BIGINT LANGUAGE plpgsql AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM video_views WHERE video_id = video_int_id);
END;
$$;

-- Update footer year to 2025
COMMENT ON COLUMN profiles.banner_url IS 'URL for creator storefront banner image';
COMMENT ON TABLE followers IS 'Tracks follower relationships between users and creators';