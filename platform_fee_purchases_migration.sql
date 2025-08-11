-- Add platform fee columns to purchases table
-- This migration adds the new columns for tracking platform fees

-- Add new columns to purchases table
ALTER TABLE purchases 
ADD COLUMN IF NOT EXISTS amount_total INTEGER,
ADD COLUMN IF NOT EXISTS platform_fee_amount INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS stripe_fee_amount INTEGER,
ADD COLUMN IF NOT EXISTS creator_net_amount INTEGER,
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

-- Migrate existing data - set amount_total equal to existing amount for backward compatibility
UPDATE purchases 
SET amount_total = amount,
    platform_fee_amount = 0,
    creator_net_amount = amount
WHERE amount_total IS NULL;

-- Now make amount_total and creator_net_amount NOT NULL
ALTER TABLE purchases 
ALTER COLUMN amount_total SET NOT NULL,
ALTER COLUMN platform_fee_amount SET NOT NULL,
ALTER COLUMN creator_net_amount SET NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN purchases.amount_total IS 'Total amount paid by customer (in cents)';
COMMENT ON COLUMN purchases.platform_fee_amount IS 'Platform fee (10% of total)';
COMMENT ON COLUMN purchases.stripe_fee_amount IS 'Stripe processing fee';
COMMENT ON COLUMN purchases.creator_net_amount IS 'Amount creator receives after fees';
COMMENT ON COLUMN purchases.stripe_payment_intent_id IS 'Stripe payment intent ID for fee tracking';