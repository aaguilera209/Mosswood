-- Add master_admin role to profiles table enum constraint
-- This migration adds the master_admin role for stealth admin accounts

-- First, drop the existing role constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add the new constraint with master_admin included
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('creator', 'viewer', 'master_admin'));

-- Update alex@jrvs.ai to master_admin role for stealth mode
UPDATE profiles 
SET role = 'master_admin'
WHERE email = 'alex@jrvs.ai';

-- Verify the change
SELECT email, role FROM profiles WHERE email = 'alex@jrvs.ai';