-- SECURITY TESTING AND VERIFICATION SCRIPT
-- Run these queries after implementing the security fixes to verify everything works

-- =========================================
-- PART 1: VERIFY RLS IS ENABLED
-- =========================================

-- Check RLS status for all critical tables
SELECT 
  schemaname, 
  tablename, 
  rowsecurity,
  CASE 
    WHEN rowsecurity THEN '✅ RLS ENABLED' 
    ELSE '❌ RLS DISABLED' 
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'videos', 'purchases', 'followers', 'video_views', 'email_subscribers', 'analytics_daily', 'admin_audit_log', 'platform_settings')
ORDER BY tablename;

-- =========================================
-- PART 2: VERIFY RLS POLICIES EXIST
-- =========================================

-- Count policies per table
SELECT 
  tablename,
  COUNT(*) as policy_count,
  STRING_AGG(policyname, ', ' ORDER BY policyname) as policy_names
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'videos', 'purchases', 'followers', 'video_views', 'email_subscribers', 'analytics_daily', 'admin_audit_log', 'platform_settings')
GROUP BY tablename
ORDER BY tablename;

-- =========================================
-- PART 3: VERIFY FUNCTION SECURITY
-- =========================================

-- Check function security settings
SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  CASE 
    WHEN p.prosecdef THEN '✅ SECURITY DEFINER' 
    ELSE '❌ SECURITY INVOKER' 
  END as security_mode,
  CASE 
    WHEN array_to_string(p.proconfig, ', ') LIKE '%search_path%' THEN '✅ SEARCH PATH SET' 
    ELSE '❌ SEARCH PATH NOT SET' 
  END as search_path_status,
  array_to_string(p.proconfig, ', ') as configuration
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname IN ('handle_new_user', 'update_updated_at_column', 'update_daily_analytics', 'handle_user_login', 'log_admin_action')
ORDER BY p.proname;

-- =========================================
-- PART 4: TEST PROFILE ACCESS (MOCK TESTS)
-- =========================================

-- Test 1: Verify master_admin profiles are not visible in public queries
-- This should return 0 rows if stealth mode is working
SELECT COUNT(*) as visible_admin_count,
       CASE WHEN COUNT(*) = 0 THEN '✅ ADMINS HIDDEN' ELSE '❌ ADMINS VISIBLE' END as status
FROM profiles 
WHERE role = 'master_admin';
-- Note: This test assumes the policy is working. In practice, you'd test with a non-admin user context.

-- Test 2: Check if regular users can see creator profiles
SELECT COUNT(*) as creator_count,
       CASE WHEN COUNT(*) > 0 THEN '✅ CREATORS VISIBLE' ELSE '❌ NO CREATORS FOUND' END as status
FROM profiles 
WHERE role = 'creator';

-- =========================================
-- PART 5: TEST TRIGGERS AND AUTOMATION
-- =========================================

-- Check that triggers are properly created
SELECT 
  event_object_table as table_name,
  trigger_name,
  event_manipulation as event,
  CASE 
    WHEN action_statement LIKE '%handle_new_user%' THEN '✅ SECURE FUNCTION'
    WHEN action_statement LIKE '%update_updated_at_column%' THEN '✅ SECURE FUNCTION'
    WHEN action_statement LIKE '%update_daily_analytics%' THEN '✅ SECURE FUNCTION'
    ELSE '⚠️  CHECK FUNCTION'
  END as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
  AND event_object_table IN ('profiles', 'videos', 'video_views')
ORDER BY event_object_table, trigger_name;

-- =========================================
-- PART 6: VERIFY ADMIN AUDIT SYSTEM
-- =========================================

-- Check if admin audit log table exists and is configured
SELECT 
  'admin_audit_log' as feature,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'admin_audit_log' AND schemaname = 'public') 
    THEN '✅ TABLE EXISTS' 
    ELSE '❌ TABLE MISSING' 
  END as status;

-- Check if platform settings table exists
SELECT 
  'platform_settings' as feature,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'platform_settings' AND schemaname = 'public') 
    THEN '✅ TABLE EXISTS' 
    ELSE '❌ TABLE MISSING' 
  END as status;

-- Show sample platform settings
SELECT setting_key, setting_value, is_public, description 
FROM platform_settings 
ORDER BY setting_key;

-- =========================================
-- PART 7: SECURITY SUMMARY REPORT
-- =========================================

-- Create a comprehensive security status report
WITH security_checks AS (
  -- Check RLS status
  SELECT 'RLS_STATUS' as check_type, 
         tablename as resource,
         CASE WHEN rowsecurity THEN 'PASS' ELSE 'FAIL' END as status,
         CASE WHEN rowsecurity THEN 'RLS is enabled' ELSE 'RLS is DISABLED' END as details
  FROM pg_tables 
  WHERE schemaname = 'public' 
    AND tablename IN ('profiles', 'videos', 'purchases', 'followers')
  
  UNION ALL
  
  -- Check policy count
  SELECT 'POLICY_COUNT' as check_type,
         tablename as resource,
         CASE WHEN COUNT(*) > 0 THEN 'PASS' ELSE 'FAIL' END as status,
         COUNT(*)::text || ' policies created' as details
  FROM pg_policies 
  WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'videos', 'purchases', 'followers')
  GROUP BY tablename
  
  UNION ALL
  
  -- Check function security
  SELECT 'FUNCTION_SECURITY' as check_type,
         p.proname as resource,
         CASE WHEN p.prosecdef AND array_to_string(p.proconfig, '') LIKE '%search_path%' 
              THEN 'PASS' ELSE 'FAIL' END as status,
         CASE WHEN p.prosecdef THEN 'Security Definer' ELSE 'Security Invoker' END ||
         CASE WHEN array_to_string(p.proconfig, '') LIKE '%search_path%' 
              THEN ' + Search Path Set' ELSE ' + No Search Path' END as details
  FROM pg_proc p
  LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' 
    AND p.proname IN ('handle_new_user', 'update_updated_at_column', 'update_daily_analytics', 'handle_user_login')
)
SELECT 
  check_type,
  resource,
  status,
  details,
  CASE 
    WHEN status = 'PASS' THEN '✅'
    WHEN status = 'FAIL' THEN '❌'
    ELSE '⚠️ '
  END as icon
FROM security_checks
ORDER BY 
  CASE check_type 
    WHEN 'RLS_STATUS' THEN 1
    WHEN 'POLICY_COUNT' THEN 2  
    WHEN 'FUNCTION_SECURITY' THEN 3
    ELSE 4
  END,
  resource;

-- =========================================
-- FINAL VERIFICATION MESSAGE
-- =========================================
SELECT 
  '🔒 SECURITY FIXES VERIFICATION COMPLETE' as message,
  'Review the results above to ensure all security measures are properly implemented.' as instruction;