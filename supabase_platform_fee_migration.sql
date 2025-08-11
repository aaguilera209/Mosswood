-- Migration to add platform fee tracking columns to purchases table
-- Run this in your Supabase SQL editor

-- Add new columns for platform fee breakdown
ALTER TABLE purchases 
ADD COLUMN IF NOT EXISTS amount_total INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS platform_fee_amount INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS stripe_fee_amount INTEGER,
ADD COLUMN IF NOT EXISTS creator_net_amount INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

-- Update existing records to maintain consistency
UPDATE purchases 
SET 
  amount_total = amount,
  platform_fee_amount = ROUND(amount * 0.10),
  creator_net_amount = ROUND(amount * 0.90)
WHERE amount_total = 0;

-- Add index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_purchases_payment_intent_id ON purchases(stripe_payment_intent_id);

-- Add comments for clarity
COMMENT ON COLUMN purchases.amount IS 'Legacy amount field - total amount in cents';
COMMENT ON COLUMN purchases.amount_total IS 'Total amount paid by customer in cents';
COMMENT ON COLUMN purchases.platform_fee_amount IS 'Platform fee (10%) in cents';
COMMENT ON COLUMN purchases.stripe_fee_amount IS 'Stripe processing fee in cents';
COMMENT ON COLUMN purchases.creator_net_amount IS 'Amount creator receives in cents';
COMMENT ON COLUMN purchases.stripe_payment_intent_id IS 'Stripe Payment Intent ID for fee tracking';