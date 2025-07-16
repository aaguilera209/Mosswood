-- Create the purchases table
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    video_id INTEGER NOT NULL,
    stripe_session_id TEXT NOT NULL UNIQUE,
    amount INTEGER NOT NULL, -- Amount in cents
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX idx_purchases_profile_id ON purchases(profile_id);
CREATE INDEX idx_purchases_video_id ON purchases(video_id);
CREATE INDEX idx_purchases_stripe_session_id ON purchases(stripe_session_id);
CREATE INDEX idx_purchases_purchased_at ON purchases(purchased_at);

-- Enable Row Level Security
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own purchases
CREATE POLICY "Users can view own purchases" ON purchases
    FOR SELECT USING (profile_id = auth.uid());

-- Create policy to allow inserting purchases (for webhook)
CREATE POLICY "Allow purchase insertion" ON purchases
    FOR INSERT WITH CHECK (true);