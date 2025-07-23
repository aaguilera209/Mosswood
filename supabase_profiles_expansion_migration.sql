-- Add profile customization fields to existing profiles table
-- This updates the profiles table with MVP fields for creators and viewers

-- Add new columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tagline TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_links JSONB;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- Update existing records to ensure they have default values where needed
UPDATE profiles SET 
  display_name = COALESCE(display_name, ''),
  social_links = COALESCE(social_links, '{}'::jsonb),
  updated_at = NOW()
WHERE display_name IS NULL OR social_links IS NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON profiles(display_name);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Ensure RLS policies allow profile updates for authenticated users
-- Policy for users to update their own profiles
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy for users to view all public profiles (for creator storefronts)
CREATE POLICY "Public profile read access"
ON profiles FOR SELECT
USING (true);

-- Enable RLS if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT, UPDATE ON profiles TO authenticated;
GRANT SELECT ON profiles TO anon;