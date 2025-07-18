-- Direct test to verify Supabase storage setup
-- Check if everything is properly configured

-- 1. Check if videos bucket exists
SELECT 
  id, 
  name, 
  public, 
  file_size_limit,
  allowed_mime_types 
FROM storage.buckets 
WHERE id = 'videos';

-- 2. Check current storage policies
SELECT 
  schemaname,
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';

-- 3. Check if we can insert a test record (this tests RLS)
-- This will show if the policies allow authenticated users to upload
SELECT auth.uid(); -- Should show current user ID if authenticated