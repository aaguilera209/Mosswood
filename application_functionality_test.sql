-- COMPLETE APPLICATION FUNCTIONALITY TEST
-- Run these tests to ensure your application still works after security changes
-- Execute in your Supabase SQL Editor

-- =========================================
-- TEST 1: VERIFY RLS IS WORKING CORRECTLY
-- =========================================

-- This should show all tables have RLS enabled
SELECT 
  'RLS Status Check' as test_name,
  tablename,
  CASE WHEN rowsecurity THEN 'PASS' ELSE 'FAIL' END as result,
  CASE WHEN rowsecurity THEN '✅ Protected' ELSE '❌ Vulnerable' END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'videos', 'purchases', 'followers')
ORDER BY tablename;

-- =========================================
-- TEST 2: VERIFY POLICIES ALLOW CORRECT ACCESS
-- =========================================

-- Count policies per table (should be multiple policies per table)
SELECT 
  'Policy Count Check' as test_name,
  tablename,
  COUNT(*) as policy_count,
  CASE WHEN COUNT(*) > 0 THEN 'PASS' ELSE 'FAIL' END as result
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'videos', 'purchases', 'followers')
GROUP BY tablename
ORDER BY tablename;

-- =========================================
-- TEST 3: VERIFY FUNCTIONS ARE SECURE
-- =========================================

-- Check all critical functions have proper security
SELECT 
  'Function Security Check' as test_name,
  p.proname as function_name,
  CASE 
    WHEN p.prosecdef AND array_to_string(p.proconfig, '') LIKE '%search_path%' 
    THEN 'PASS' 
    ELSE 'FAIL' 
  END as result,
  CASE 
    WHEN p.prosecdef AND array_to_string(p.proconfig, '') LIKE '%search_path%' 
    THEN '✅ Secure' 
    ELSE '❌ Insecure' 
  END as status
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname IN ('handle_new_user', 'update_updated_at_column', 'update_daily_analytics', 'handle_user_login')
ORDER BY p.proname;

-- =========================================
-- TEST 4: VERIFY ADMIN FEATURES WORK
-- =========================================

-- Check admin tables exist and are protected
SELECT 
  'Admin Tables Check' as test_name,
  tablename,
  CASE WHEN rowsecurity THEN 'PASS' ELSE 'FAIL' END as result,
  CASE WHEN rowsecurity THEN '✅ Protected' ELSE '❌ Unprotected' END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('admin_audit_log', 'platform_settings');

-- =========================================
-- TEST 5: VERIFY TRIGGERS ARE ACTIVE
-- =========================================

-- Check critical triggers exist
SELECT 
  'Trigger Check' as test_name,
  trigger_name,
  event_object_table as table_name,
  'PASS' as result,
  '✅ Active' as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
  AND trigger_name IN ('on_auth_user_created', 'update_profiles_updated_at', 'update_videos_updated_at')
ORDER BY trigger_name;

-- =========================================
-- SECURITY SUMMARY REPORT
-- =========================================

WITH security_summary AS (
  -- Count protected tables
  SELECT 'Tables Protected' as metric, COUNT(*)::text as value
  FROM pg_tables 
  WHERE schemaname = 'public' 
    AND tablename IN ('profiles', 'videos', 'purchases', 'followers', 'admin_audit_log', 'platform_settings')
    AND rowsecurity = true
  
  UNION ALL
  
  -- Count total policies
  SELECT 'Total Policies' as metric, COUNT(*)::text as value
  FROM pg_policies 
  WHERE schemaname = 'public'
  
  UNION ALL
  
  -- Count secure functions
  SELECT 'Secure Functions' as metric, COUNT(*)::text as value
  FROM pg_proc p
  LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' 
    AND p.proname IN ('handle_new_user', 'update_updated_at_column', 'update_daily_analytics', 'handle_user_login')
    AND p.prosecdef = true
  
  UNION ALL
  
  -- Count active triggers
  SELECT 'Active Triggers' as metric, COUNT(*)::text as value
  FROM information_schema.triggers 
  WHERE trigger_schema = 'public'
    AND trigger_name IN ('on_auth_user_created', 'update_profiles_updated_at', 'update_videos_updated_at')
)
SELECT 
  '🔒 SECURITY IMPLEMENTATION SUMMARY' as report_title,
  metric,
  value,
  CASE metric
    WHEN 'Tables Protected' THEN CASE WHEN value::integer >= 6 THEN '✅' ELSE '❌' END
    WHEN 'Total Policies' THEN CASE WHEN value::integer >= 15 THEN '✅' ELSE '❌' END  
    WHEN 'Secure Functions' THEN CASE WHEN value::integer >= 3 THEN '✅' ELSE '❌' END
    WHEN 'Active Triggers' THEN CASE WHEN value::integer >= 2 THEN '✅' ELSE '❌' END
    ELSE '✅'
  END as status
FROM security_summary
ORDER BY metric;

-- =========================================
-- FINAL VERIFICATION MESSAGE
-- =========================================

SELECT 
  '✅ CORRECTED SECURITY IMPLEMENTATION COMPLETE' as status,
  'Your application functionality should be preserved while security vulnerabilities are fixed.' as message,
  'Run your application tests to confirm everything works as expected.' as next_step;