-- AUTHENTICATION SECURITY FIXES  
-- Fix OTP expiry and enable leaked password protection
-- Run these in your Supabase SQL Editor or Dashboard

-- =========================================
-- PART 1: AUTH CONFIGURATION SETTINGS
-- =========================================

-- Note: These settings are typically configured through the Supabase Dashboard
-- Go to Authentication > Settings in your Supabase Dashboard

-- OTP Expiry Settings (Dashboard Configuration):
-- 1. Go to Supabase Dashboard > Authentication > Settings
-- 2. Under "Email OTP expiry" set to 3600 seconds (1 hour) or less
-- 3. Under "SMS OTP expiry" set to 600 seconds (10 minutes) or less

-- Leaked Password Protection (Dashboard Configuration):
-- 1. Go to Supabase Dashboard > Authentication > Settings  
-- 2. Enable "Breached password protection"
-- 3. This will check passwords against known breached password databases

-- =========================================
-- PART 2: CREATE ADMIN AUDIT LOG TABLE
-- =========================================

-- Create admin audit log table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES auth.users(id),
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  details jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT NOW()
);

-- Enable RLS on admin audit log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin audit log
CREATE POLICY "admin_audit_log_admin_insert" ON public.admin_audit_log
FOR INSERT WITH CHECK (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'master_admin'
  )
);

CREATE POLICY "admin_audit_log_admin_select" ON public.admin_audit_log
FOR SELECT USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'master_admin'
  )
);

-- =========================================
-- PART 3: CREATE PLATFORM SETTINGS TABLE
-- =========================================

-- Create platform settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL,
  description text,
  is_public boolean DEFAULT false,
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT NOW(),
  updated_at timestamp with time zone DEFAULT NOW()
);

-- Enable RLS on platform settings
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for platform settings
CREATE POLICY "platform_settings_admin_all" ON public.platform_settings
FOR ALL USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'master_admin'
  )
);

-- Allow public read access to public settings
CREATE POLICY "platform_settings_public_select" ON public.platform_settings
FOR SELECT USING (is_public = true);

-- =========================================
-- PART 4: CREATE AUDIT LOGGING FUNCTION
-- =========================================

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  p_action text,
  p_resource_type text,
  p_resource_id text DEFAULT NULL,
  p_details jsonb DEFAULT NULL
)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  -- Only log if user is an admin
  IF auth.uid() IN (SELECT id FROM profiles WHERE role = 'master_admin') THEN
    INSERT INTO public.admin_audit_log (
      admin_user_id,
      action,
      resource_type,
      resource_id,
      details,
      ip_address,
      user_agent
    ) VALUES (
      auth.uid(),
      p_action,
      p_resource_type,
      p_resource_id,
      p_details,
      inet_client_addr(),
      current_setting('request.header.user-agent', true)
    );
  END IF;
END;
$$;

-- =========================================
-- PART 5: INSERT DEFAULT PLATFORM SETTINGS
-- =========================================

-- Insert some default platform settings
INSERT INTO public.platform_settings (setting_key, setting_value, description, is_public) VALUES
('platform_fee_percentage', '10', 'Platform fee percentage (default 10%)', false),
('min_video_price_cents', '100', 'Minimum video price in cents (default $1.00)', false),
('max_video_file_size_mb', '500', 'Maximum video file size in MB', true),
('supported_video_formats', '["mp4", "mov", "avi", "webm"]', 'Supported video file formats', true),
('maintenance_mode', 'false', 'Whether the platform is in maintenance mode', true)
ON CONFLICT (setting_key) DO NOTHING;

-- =========================================
-- PART 6: UPDATE TRIGGERS FOR AUDIT LOGGING
-- =========================================

-- Add audit logging to sensitive operations
CREATE OR REPLACE FUNCTION profiles_audit_trigger()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  -- Log role changes
  IF TG_OP = 'UPDATE' AND OLD.role != NEW.role THEN
    PERFORM log_admin_action(
      'role_change',
      'profile',
      NEW.id::text,
      jsonb_build_object('old_role', OLD.role, 'new_role', NEW.role)
    );
  END IF;
  
  RETURN CASE TG_OP WHEN 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

-- Create audit trigger for profiles
DROP TRIGGER IF EXISTS profiles_audit_trigger ON public.profiles;
CREATE TRIGGER profiles_audit_trigger
  AFTER UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE profiles_audit_trigger();

-- =========================================
-- VERIFICATION QUERIES  
-- =========================================

-- Check that tables exist and have RLS enabled
SELECT 
  schemaname, 
  tablename, 
  rowsecurity,
  CASE WHEN rowsecurity THEN 'RLS Enabled' ELSE 'RLS DISABLED' END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('admin_audit_log', 'platform_settings')
ORDER BY tablename;

-- Check policies for new tables
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive,
  cmd as operation
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('admin_audit_log', 'platform_settings')
ORDER BY tablename, policyname;

-- Check if audit function exists
SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  p.prosecdef as security_definer
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'log_admin_action';

-- Sample platform settings
SELECT setting_key, setting_value, is_public 
FROM public.platform_settings 
ORDER BY setting_key;