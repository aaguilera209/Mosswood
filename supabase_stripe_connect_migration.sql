-- Add Stripe Connect account ID to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT FALSE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_account_id ON profiles(stripe_account_id);

-- Update RLS policies to allow users to update their own Stripe info
CREATE POLICY "Users can update own stripe info" ON profiles
FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);