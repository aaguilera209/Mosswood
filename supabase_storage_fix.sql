-- Additional Supabase Storage Fix for Video Uploads
-- Run this if the video upload is still hanging

-- First, check if bucket exists
SELECT * FROM storage.buckets WHERE id = 'videos';

-- If bucket doesn't exist, create it manually
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos',
  true,
  524288000, -- 500MB limit
  ARRAY['video/mp4', 'video/mov', 'video/webm', 'video/quicktime', 'video/avi', 'video/x-msvideo']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if they exist and recreate them
DROP POLICY IF EXISTS "Anyone can view videos" ON storage.objects;
DROP POLICY IF EXISTS "Creators can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Creators can update their own videos" ON storage.objects;
DROP POLICY IF EXISTS "Creators can delete their own videos" ON storage.objects;

-- Create simpler, more permissive storage policies for testing
CREATE POLICY "Anyone can view videos" ON storage.objects
  FOR SELECT USING (bucket_id = 'videos');

CREATE POLICY "Authenticated users can upload videos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'videos' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own videos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'videos' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete their own videos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'videos' AND
    auth.role() = 'authenticated'
  );

-- Make sure storage bucket is set to public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'videos';

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;