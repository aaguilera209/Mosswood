-- Create videos table for Supabase
CREATE TABLE IF NOT EXISTS videos (
  id SERIAL PRIMARY KEY,
  creator_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL DEFAULT 0, -- Price in cents
  is_free BOOLEAN NOT NULL DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}', -- Array of tag strings
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  file_size INTEGER, -- File size in bytes
  duration INTEGER, -- Duration in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_videos_creator_id ON videos(creator_id);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at);
CREATE INDEX IF NOT EXISTS idx_videos_is_free ON videos(is_free);
CREATE INDEX IF NOT EXISTS idx_videos_tags ON videos USING GIN(tags);

-- Create a function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_videos_updated_at 
  BEFORE UPDATE ON videos 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for videos (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos',
  true,
  524288000, -- 500MB limit
  ARRAY['video/mp4', 'video/mov', 'video/webm', 'video/quicktime', 'video/avi']
)
ON CONFLICT (id) DO NOTHING;

-- Set up Row Level Security (RLS) policies
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view videos
CREATE POLICY "Anyone can view videos" ON videos
  FOR SELECT USING (true);

-- Policy: Only creators can insert their own videos
CREATE POLICY "Creators can insert their own videos" ON videos
  FOR INSERT WITH CHECK (creator_id = auth.uid());

-- Policy: Only creators can update their own videos
CREATE POLICY "Creators can update their own videos" ON videos
  FOR UPDATE USING (creator_id = auth.uid());

-- Policy: Only creators can delete their own videos
CREATE POLICY "Creators can delete their own videos" ON videos
  FOR DELETE USING (creator_id = auth.uid());

-- Storage policies for videos bucket
CREATE POLICY "Anyone can view videos" ON storage.objects
  FOR SELECT USING (bucket_id = 'videos');

CREATE POLICY "Creators can upload videos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'videos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Creators can update their own videos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'videos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Creators can delete their own videos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'videos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );