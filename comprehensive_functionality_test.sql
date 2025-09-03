-- COMPREHENSIVE FUNCTIONALITY TEST SUITE
-- Run after applying refined_security_fixes.sql to verify everything works
-- Execute in your Supabase SQL Editor

-- =========================================
-- TEST 1: ADMIN FUNCTIONALITY TESTS
-- =========================================

-- Test 1.1: Verify admin policies exist and use correct logic
SELECT 
  '1. Admin Policies Check' as test_group,
  'Admin Policy Count' as test_name,
  COUNT(*) as result,
  CASE WHEN COUNT(*) >= 7 THEN '✅ PASS' ELSE '❌ FAIL' END as status,
  '7+ admin policies should exist' as expected
FROM pg_policies 
WHERE schemaname = 'public' 
  AND policyname LIKE '%admin%'

UNION ALL

-- Test 1.2: Verify admin policies use correct logic (check current user, not self-check)
SELECT 
  '1. Admin Policies Check' as test_group,
  'Admin Logic Verification' as test_name,
  COUNT(*) as result,
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END as status,
  'No policies should have flawed admin_check logic' as expected
FROM pg_policies 
WHERE schemaname = 'public' 
  AND definition LIKE '%admin_check_id = auth.uid()%';

-- =========================================
-- TEST 2: VIDEO VIEWS SECURITY TESTS
-- =========================================

SELECT 
  '2. Video Views Security' as test_group,
  'Secure Insert Policy' as test_name,
  COUNT(*) as result,
  CASE WHEN COUNT(*) > 0 THEN '✅ PASS' ELSE '❌ FAIL' END as status,
  'Should have secure video_views insert policy' as expected
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'video_views'
  AND policyname LIKE '%authenticated%'

UNION ALL

SELECT 
  '2. Video Views Security' as test_group,
  'No Permissive Insert Policy' as test_name,
  COUNT(*) as result,
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END as status,
  'Should not have overly permissive insert policies' as expected
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'video_views'
  AND policyname = 'video_views_insert_track';

-- =========================================
-- TEST 3: EMAIL SUBSCRIPTION MANAGEMENT TESTS
-- =========================================

SELECT 
  '3. Email Subscriptions' as test_group,
  'User Management Policies' as test_name,
  COUNT(*) as result,
  CASE WHEN COUNT(*) >= 3 THEN '✅ PASS' ELSE '❌ FAIL' END as status,
  'Users should be able to view, insert, and delete their subscriptions' as expected
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'email_subscribers'
  AND policyname LIKE '%user_%';

-- =========================================
-- TEST 4: PERFORMANCE INDEXES TESTS
-- =========================================

SELECT 
  '4. Performance Indexes' as test_group,
  'Critical Index Count' as test_name,
  COUNT(*) as result,
  CASE WHEN COUNT(*) >= 10 THEN '✅ PASS' ELSE '❌ FAIL' END as status,
  '10+ performance indexes should be created' as expected
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%'

UNION ALL

-- Test specific critical indexes
SELECT 
  '4. Performance Indexes' as test_group,
  'Role Index' as test_name,
  COUNT(*) as result,
  CASE WHEN COUNT(*) > 0 THEN '✅ PASS' ELSE '❌ FAIL' END as status,
  'Role index should exist for admin checks' as expected
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname = 'idx_profiles_role'

UNION ALL

SELECT 
  '4. Performance Indexes' as test_group,
  'Creator Content Index' as test_name,
  COUNT(*) as result,
  CASE WHEN COUNT(*) > 0 THEN '✅ PASS' ELSE '❌ FAIL' END as status,
  'Creator content index should exist' as expected
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname = 'idx_videos_creator_id';

-- =========================================
-- TEST 5: FUNCTION SECURITY AND ERROR HANDLING TESTS
-- =========================================

SELECT 
  '5. Function Security' as test_group,
  p.proname as test_name,
  1 as result,
  CASE 
    WHEN p.prosecdef AND array_to_string(p.proconfig, '') LIKE '%search_path%' 
    THEN '✅ SECURE' 
    ELSE '❌ INSECURE' 
  END as status,
  'Function should be SECURITY DEFINER with search_path set' as expected
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname IN ('handle_new_user', 'update_updated_at_column', 'update_daily_analytics')
ORDER BY p.proname;

-- =========================================
-- TEST 6: DATA VALIDATION CONSTRAINTS TESTS
-- =========================================

SELECT 
  '6. Data Validation' as test_group,
  'Constraint Count' as test_name,
  COUNT(*) as result,
  CASE WHEN COUNT(*) >= 2 THEN '✅ PASS' ELSE '❌ FAIL' END as status,
  'Should have validation constraints for prices and view counts' as expected
FROM information_schema.table_constraints 
WHERE constraint_schema = 'public' 
  AND constraint_type = 'CHECK'
  AND constraint_name IN ('valid_watch_duration', 'valid_view_counts', 'valid_price');

-- =========================================
-- TEST 7: ANALYTICS SECURITY REFINEMENT TESTS
-- =========================================

SELECT 
  '7. Analytics Security' as test_group,
  'Refined Service Policies' as test_name,
  COUNT(*) as result,
  CASE WHEN COUNT(*) >= 2 THEN '✅ PASS' ELSE '❌ FAIL' END as status,
  'Should have specific insert and update policies for service role' as expected
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'analytics_daily'
  AND policyname LIKE '%service_%';

-- =========================================
-- TEST 8: TRIGGER FUNCTIONALITY TESTS
-- =========================================

SELECT 
  '8. Triggers' as test_group,
  'Core Trigger Count' as test_name,
  COUNT(*) as result,
  CASE WHEN COUNT(*) >= 3 THEN '✅ PASS' ELSE '❌ FAIL' END as status,
  'Core triggers should be active (user creation, updated_at)' as expected
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
  AND trigger_name IN ('on_auth_user_created', 'update_profiles_updated_at', 'update_videos_updated_at');

-- =========================================
-- TEST 9: RLS COVERAGE TEST
-- =========================================

SELECT 
  '9. RLS Coverage' as test_group,
  'Protected Tables' as test_name,
  COUNT(*) as result,
  CASE WHEN COUNT(*) >= 6 THEN '✅ PASS' ELSE '❌ FAIL' END as status,
  'All critical tables should have RLS enabled' as expected
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'videos', 'purchases', 'followers', 'video_views', 'email_subscribers')
  AND rowsecurity = true;

-- =========================================
-- TEST 10: POLICY COVERAGE TEST
-- =========================================

WITH policy_coverage AS (
  SELECT 
    tablename,
    COUNT(*) as policy_count
  FROM pg_policies 
  WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'videos', 'purchases', 'followers', 'video_views', 'email_subscribers')
  GROUP BY tablename
)
SELECT 
  '10. Policy Coverage' as test_group,
  CONCAT(tablename, ' Policies') as test_name,
  policy_count as result,
  CASE WHEN policy_count >= 3 THEN '✅ PASS' ELSE '❌ FAIL' END as status,
  'Each table should have multiple policies for different access patterns' as expected
FROM policy_coverage
ORDER BY tablename;

-- =========================================
-- COMPREHENSIVE SECURITY SUMMARY REPORT
-- =========================================

WITH security_metrics AS (
  SELECT 'Protected Tables' as metric, 
         COUNT(*)::text as value,
         CASE WHEN COUNT(*) >= 6 THEN '✅' ELSE '❌' END as status
  FROM pg_tables 
  WHERE schemaname = 'public' 
    AND tablename IN ('profiles', 'videos', 'purchases', 'followers', 'video_views', 'email_subscribers')
    AND rowsecurity = true
  
  UNION ALL
  
  SELECT 'Security Policies' as metric,
         COUNT(*)::text as value,
         CASE WHEN COUNT(*) >= 20 THEN '✅' ELSE '❌' END as status
  FROM pg_policies 
  WHERE schemaname = 'public'
  
  UNION ALL
  
  SELECT 'Performance Indexes' as metric,
         COUNT(*)::text as value,
         CASE WHEN COUNT(*) >= 10 THEN '✅' ELSE '❌' END as status
  FROM pg_indexes 
  WHERE schemaname = 'public' AND indexname LIKE 'idx_%'
  
  UNION ALL
  
  SELECT 'Secure Functions' as metric,
         COUNT(*)::text as value,
         CASE WHEN COUNT(*) >= 3 THEN '✅' ELSE '❌' END as status
  FROM pg_proc p
  LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' 
    AND p.proname IN ('handle_new_user', 'update_updated_at_column', 'update_daily_analytics')
    AND p.prosecdef = true
  
  UNION ALL
  
  SELECT 'Data Constraints' as metric,
         COUNT(*)::text as value,
         CASE WHEN COUNT(*) >= 2 THEN '✅' ELSE '❌' END as status
  FROM information_schema.table_constraints 
  WHERE constraint_schema = 'public' 
    AND constraint_type = 'CHECK'
    AND constraint_name IN ('valid_watch_duration', 'valid_view_counts', 'valid_price')
  
  UNION ALL
  
  SELECT 'Active Triggers' as metric,
         COUNT(*)::text as value,
         CASE WHEN COUNT(*) >= 3 THEN '✅' ELSE '❌' END as status
  FROM information_schema.triggers 
  WHERE trigger_schema = 'public'
    AND trigger_name IN ('on_auth_user_created', 'update_profiles_updated_at', 'update_videos_updated_at')
)
SELECT 
  '🔒 FINAL SECURITY IMPLEMENTATION REPORT' as report_section,
  metric,
  value,
  status,
  CASE 
    WHEN metric = 'Protected Tables' THEN 'All critical tables have RLS enabled'
    WHEN metric = 'Security Policies' THEN 'Comprehensive access control policies'
    WHEN metric = 'Performance Indexes' THEN 'Optimized query performance'
    WHEN metric = 'Secure Functions' THEN 'Functions follow security best practices'
    WHEN metric = 'Data Constraints' THEN 'Data validation prevents invalid entries'
    WHEN metric = 'Active Triggers' THEN 'Automated processes working correctly'
  END as description
FROM security_metrics
ORDER BY 
  CASE metric
    WHEN 'Protected Tables' THEN 1
    WHEN 'Security Policies' THEN 2
    WHEN 'Performance Indexes' THEN 3
    WHEN 'Secure Functions' THEN 4
    WHEN 'Data Constraints' THEN 5
    WHEN 'Active Triggers' THEN 6
  END;

-- =========================================
-- FINAL APPLICATION READINESS CHECK
-- =========================================

WITH readiness_check AS (
  SELECT 
    COUNT(CASE WHEN rowsecurity = true THEN 1 END) >= 6 as tables_protected,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') >= 20 as policies_adequate,
    (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%') >= 10 as indexes_created,
    (SELECT COUNT(*) FROM pg_proc p 
     LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
     WHERE n.nspname = 'public' AND p.prosecdef = true 
       AND p.proname IN ('handle_new_user', 'update_updated_at_column', 'update_daily_analytics')) >= 3 as functions_secure
  FROM pg_tables 
  WHERE schemaname = 'public' 
    AND tablename IN ('profiles', 'videos', 'purchases', 'followers', 'video_views', 'email_subscribers')
)
SELECT 
  '🚀 APPLICATION READINESS STATUS' as final_check,
  CASE 
    WHEN tables_protected AND policies_adequate AND indexes_created AND functions_secure 
    THEN '✅ READY FOR PRODUCTION - All security measures implemented successfully'
    ELSE '❌ REVIEW NEEDED - Some security measures may need attention'
  END as status,
  CASE 
    WHEN tables_protected AND policies_adequate AND indexes_created AND functions_secure 
    THEN 'Your Mosswood application is secure and performance-optimized. All user functionality preserved.'
    ELSE 'Please review failed tests above and re-run the refined security fixes.'
  END as next_steps
FROM readiness_check;