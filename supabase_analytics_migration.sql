-- Create analytics tables for video tracking
-- Run this in your Supabase SQL editor

-- Video views tracking table
CREATE TABLE video_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id INTEGER NOT NULL,
  viewer_id UUID REFERENCES profiles(id),
  session_id TEXT NOT NULL,
  device_type TEXT CHECK (device_type IN ('mobile', 'desktop', 'tablet')),
  browser TEXT,
  watch_duration INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  watched_30_seconds BOOLEAN NOT NULL DEFAULT false,
  is_returning_viewer BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email subscribers table
CREATE TABLE email_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  creator_id UUID NOT NULL REFERENCES profiles(id),
  video_id INTEGER REFERENCES videos(id),
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily analytics aggregation table
CREATE TABLE analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id INTEGER NOT NULL REFERENCES videos(id),
  date TEXT NOT NULL,
  total_views INTEGER NOT NULL DEFAULT 0,
  unique_viewers INTEGER NOT NULL DEFAULT 0,
  watch_time_total INTEGER NOT NULL DEFAULT 0,
  completions INTEGER NOT NULL DEFAULT 0,
  purchases INTEGER NOT NULL DEFAULT 0,
  revenue INTEGER NOT NULL DEFAULT 0,
  new_viewers INTEGER NOT NULL DEFAULT 0,
  returning_viewers INTEGER NOT NULL DEFAULT 0,
  mobile_views INTEGER NOT NULL DEFAULT 0,
  desktop_views INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(video_id, date)
);

-- Create indexes for better query performance
CREATE INDEX idx_video_views_video_id ON video_views(video_id);
CREATE INDEX idx_video_views_created_at ON video_views(created_at);
CREATE INDEX idx_video_views_session_id ON video_views(session_id);
CREATE INDEX idx_email_subscribers_creator_id ON email_subscribers(creator_id);
CREATE INDEX idx_analytics_daily_video_id_date ON analytics_daily(video_id, date);

-- Enable RLS on all analytics tables
ALTER TABLE video_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;

-- RLS policies for video_views (creators can see their own video analytics)
CREATE POLICY "Creators can view their video analytics" ON video_views FOR SELECT
USING (
  video_id IN (
    SELECT id FROM videos WHERE creator_id = auth.uid()
  )
);

-- Allow inserting view tracking data (for anonymous and authenticated users)
CREATE POLICY "Anyone can insert view data" ON video_views FOR INSERT
WITH CHECK (true);

-- RLS policies for email_subscribers
CREATE POLICY "Creators can view their subscribers" ON email_subscribers FOR SELECT
USING (creator_id = auth.uid());

CREATE POLICY "Anyone can subscribe" ON email_subscribers FOR INSERT
WITH CHECK (true);

-- RLS policies for analytics_daily
CREATE POLICY "Creators can view their daily analytics" ON analytics_daily FOR SELECT
USING (
  video_id IN (
    SELECT id FROM videos WHERE creator_id = auth.uid()
  )
);

-- Service role can manage analytics data
CREATE POLICY "Service can manage analytics" ON analytics_daily FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Service can manage video views" ON video_views FOR ALL
USING (auth.role() = 'service_role');

-- Function to update daily analytics (called by backend)
CREATE OR REPLACE FUNCTION update_daily_analytics(p_video_id INTEGER, p_date TEXT)
RETURNS void AS $$
BEGIN
  INSERT INTO analytics_daily (
    video_id, 
    date, 
    total_views,
    unique_viewers,
    watch_time_total,
    completions,
    purchases,
    revenue,
    new_viewers,
    returning_viewers,
    mobile_views,
    desktop_views
  )
  SELECT 
    p_video_id,
    p_date,
    COUNT(*) as total_views,
    COUNT(DISTINCT COALESCE(viewer_id, session_id)) as unique_viewers,
    SUM(watch_duration) as watch_time_total,
    COUNT(*) FILTER (WHERE completed = true) as completions,
    COALESCE(purchase_data.purchases, 0) as purchases,
    COALESCE(purchase_data.revenue, 0) as revenue,
    COUNT(*) FILTER (WHERE is_returning_viewer = false) as new_viewers,
    COUNT(*) FILTER (WHERE is_returning_viewer = true) as returning_viewers,
    COUNT(*) FILTER (WHERE device_type = 'mobile') as mobile_views,
    COUNT(*) FILTER (WHERE device_type = 'desktop') as desktop_views
  FROM video_views 
  LEFT JOIN (
    SELECT 
      video_id,
      COUNT(*) as purchases,
      SUM(amount) as revenue
    FROM purchases 
    WHERE DATE(purchased_at) = p_date AND video_id = p_video_id
    GROUP BY video_id
  ) purchase_data ON purchase_data.video_id = p_video_id
  WHERE video_views.video_id = p_video_id 
    AND DATE(created_at) = p_date
  ON CONFLICT (video_id, date) 
  DO UPDATE SET
    total_views = EXCLUDED.total_views,
    unique_viewers = EXCLUDED.unique_viewers,
    watch_time_total = EXCLUDED.watch_time_total,
    completions = EXCLUDED.completions,
    purchases = EXCLUDED.purchases,
    revenue = EXCLUDED.revenue,
    new_viewers = EXCLUDED.new_viewers,
    returning_viewers = EXCLUDED.returning_viewers,
    mobile_views = EXCLUDED.mobile_views,
    desktop_views = EXCLUDED.desktop_views;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;