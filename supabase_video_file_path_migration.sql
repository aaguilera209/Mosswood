-- Add file_path column to videos table for FFmpeg processing
ALTER TABLE videos ADD COLUMN IF NOT EXISTS file_path TEXT;

-- Update existing videos to have file_path = video_url for now
UPDATE videos SET file_path = video_url WHERE file_path IS NULL;

-- Comment: This migration adds support for video frame extraction by FFmpeg
-- The file_path column stores the storage path needed for video processing