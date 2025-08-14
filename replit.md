# Mosswood - Creative Platform

## Overview

Mosswood is a full-stack web application designed as "the platform layer for creative ownership." It aims to empower content creators by providing a React-based platform where they can host their work, own their audience, and monetize on their own terms without intermediaries or algorithms. The project's vision is to create a direct-to-audience ecosystem for creative content.

## Recent Changes (August 2025)

### Library Display Bug Fix - RESOLVED ✅
- **Original Issue**: Library showing "Documentary BTS" when user purchased "Gone surfing" (Video ID 3)
- **Root Cause**: Library component using outdated mock data instead of real database data
- **Investigation Results**:
  - ✅ Purchase recording always worked correctly - Video ID 3 properly recorded
  - ✅ Database shows correct video: {"title": "Gone surfing", "creator": "Alex Aguilera"}
  - ❌ Library was calling `getVideoById()` which returned wrong mock data
- **Solution**: Replaced mock data lookup with real API calls to `/api/video/:id`
- **Status**: ✅ Library now displays correct "Gone surfing" video with proper creator info

### Video Playback Fix - RESOLVED ✅
- **Issue**: Videos failing to play after purchase due to incorrect video source URL
- **Root Cause**: Video element using `videoData.file_path` field instead of `videoData.video_url`
- **Solution**: Updated video source to use correct `video_url` field from database
- **Additional Improvements**: Added comprehensive video loading/error debugging
- **Status**: ✅ Video playback now working with proper Supabase storage URLs

### Featured Creators Navigation Fix - RESOLVED ✅
- **Issue**: Featured Creators loading correctly initially but breaking when navigating back from sign-in page
- **Root Cause**: `queryClient.clear()` in AuthContext was wiping ALL cache data on auth state changes, including public creators data
- **Solution**: Replaced global cache clearing with selective removal of only user-specific queries (profile, library, purchases)
- **Technical Details**: Preserved public data (creators, videos) while clearing private user data on sign out
- **Status**: ✅ Fixed - Featured Creators now persists across navigation without unnecessary refetching

### Navigation Header UX Improvements - RESOLVED ✅
- **Issue**: Poor navigation UX - creators had to go Dashboard → Logo → Homepage → My Library (3+ clicks)
- **Improvements Made**:
  - ✅ Added "My Library" and "Explore" buttons to dashboard header
  - ✅ Fixed video page header layout (removed duplicate logos) 
  - ✅ Added proper back button navigation using browser history
  - ✅ Improved header consistency across dashboard and video pages
- **Status**: ✅ Navigation now streamlined - direct access to Library from dashboard

### Homepage Sign Up Button Fix - RESOLVED ✅
- **Issue**: "Sign Up" button in hero section showed error instead of navigating to signup page
- **Root Cause**: Sign Up button was calling `handleBecomeCreator` function instead of navigating to `/signup`
- **Solution**: Changed Sign Up button to use Link component pointing to `/signup` (same as "Get Started" button)
- **Additional Improvement**: Also updated Sign In button to use Link component for consistency
- **Status**: ✅ Both Sign Up buttons now work correctly - no more registration blocking

### Email Confirmation Flow & Creator CTA Fix - RESOLVED ✅
- **Issue 1**: Email confirmation redirected to password page instead of homepage (signed in)
- **Solution**: Updated EmailConfirmation to redirect to homepage after successful confirmation since user is already signed in
- **Issue 2**: No way for viewers to become creators - missing CTA
- **Solution**: Added prominent "Become a Creator" button in header for viewers and dynamic homepage CTAs
- **Issue 3**: Theme not auto-detecting system preference
- **Solution**: Updated ThemeContext to detect system dark/light mode preference on first visit
- **Status**: ✅ Smooth email confirmation flow, clear creator conversion path, and better theme detection

### Authentication System Fix - RESOLVED ✅
- **Critical Issue**: alex@jrvs.ai account existed but couldn't login due to "Invalid login credentials"
- **Root Cause**: Password mismatch - account was properly confirmed but password was incorrect
- **Investigation**: Used Supabase admin API to verify account status and identify authentication barriers
- **Solutions Applied**:
  - ✅ Updated alex@jrvs.ai password to working credentials (test123)
  - ✅ Upgraded role from 'viewer' to 'creator' for admin access
  - ✅ Verified email confirmation status (confirmed: 2025-08-11T23:32:15.153368Z)
  - ✅ Tested complete login flow with successful authentication
- **Result**: alex@jrvs.ai can now successfully login and access creator dashboard
- **Status**: ✅ Master admin account operational with full platform access

### Stealth Admin System Implementation - COMPLETED ✅
- **Feature**: Comprehensive admin dashboard with complete invisibility for master_admin accounts
- **Implementation**: 
  - ✅ Added `master_admin` role to profiles table schema
  - ✅ Created admin filtering for all public queries (Featured Creators, searches, statistics)
  - ✅ Built comprehensive admin dashboard at `/admin` with tabbed interface:
    - Overview: Platform statistics, recent users, videos, and purchases
    - Creators: Creator management with search and filtering
    - Videos: Video management and moderation tools
    - Payments: Stripe integration, platform fee configuration, transaction monitoring
    - Analytics: Growth metrics, conversion rates, performance data
    - Settings: Platform configuration and system health monitoring
  - ✅ Added admin-only API endpoints (`/api/admin/*`)
  - ✅ Created admin navigation link visible only to master_admin users
  - ✅ Applied stealth mode - admin accounts invisible in all public displays
- **Database Migration**: Applied via Supabase SQL Editor - alex@jrvs.ai upgraded to master_admin role
- **Status**: ✅ Complete stealth admin system operational

### Admin Authentication Critical Fix - IN PROGRESS 🔧
- **Critical Issue**: Admin panel access denied for alex@jrvs.ai despite having master_admin role in database
- **Root Cause**: Auth context unable to fetch user role due to admin exclusion in public profile API
- **Investigation**: alex@jrvs.ai has correct master_admin role in database but auth system was using public profile endpoint that excludes admin accounts
- **Solutions Applied**:
  - ✅ Created dedicated `/api/admin-profile` endpoint that allows master_admin account access
  - ✅ Modified auth context to use admin endpoint for alex@jrvs.ai authentication
  - ✅ Added temporary email fallback authorization (alex@jrvs.ai bypass) in all admin access checks
  - ✅ Enhanced debug logging for role verification and authentication flow
  - ✅ Updated admin dashboard queries to use email fallback authorization
- **Testing Required**: Login as alex@jrvs.ai and verify admin dashboard access with proper role loading
- **Status**: 🔧 Fixes implemented, awaiting validation

### Platform Fee System Implementation - NEW ✅
- **Feature**: Added 10% platform fee to all Stripe payments using Stripe Connect
- **Implementation**: Enhanced checkout session creation with application fees and transfer data to creators
- **Database**: Added fee breakdown columns to purchases table (amount_total, platform_fee_amount, stripe_fee_amount, creator_net_amount)
- **Validation**: Minimum $1.00 video price, $0.10 minimum platform fee, creator Stripe account verification
- **Testing**: Comprehensive fee calculation testing with various price points ($1-$100)
- **Status**: ✅ Operational - platform takes 10%, creators get 90% minus Stripe processing fees

### Video Thumbnail System - RESOLVED
- **Issue**: Video thumbnails were displaying colored gradients instead of real video frame captures
- **Solution**: Implemented authentic FFmpeg-based thumbnail generation extracting JPEG frames at 5-second mark from uploaded videos
- **Technical Details**: Server generates 8KB JPEG images from actual video files, added cache busting and proper error handling
- **Status**: ✅ Confirmed working - console logs show "Thumbnail loaded successfully" for all videos

### Library Data Cleanup - RESOLVED  
- **Issue**: Phantom "Sustainable Fashion Workshop" video appeared in user library despite video not existing
- **Solution**: Removed orphaned purchase record for non-existent video ID 14, improved filtering logic
- **Technical Details**: Added DELETE endpoint for purchases, enhanced library filtering to exclude invalid video references
- **Status**: ✅ Confirmed working - library now shows zero purchases as expected

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application utilizes a monorepo structure, separating client, server, and shared components.

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **Styling**: Tailwind CSS with custom design system, Shadcn/ui, and Radix UI primitives
- **State Management**: TanStack Query for server state, React Context for theme management
- **Build Tool**: Vite

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM (using Neon Database)
- **Session Management**: Connect-pg-simple for PostgreSQL session storage

### Development Architecture
- **Development Server**: Vite middleware integrated with Express
- **Type Safety**: Shared TypeScript types between client and server

### Key Components

- **Database Layer**: Drizzle ORM, with schema in `shared/schema.ts` and migrations in `./migrations`.
- **Authentication System**: Supabase authentication with row-level security, supporting email/password, and role-based access control ('creator' and 'viewer' roles). New users default to 'viewer'.
- **UI Design System**: Dual light/dark theme support with CSS variables, deep navy and deep teal color scheme ("Indie Film Festival" aesthetic), Inter font, and Shadcn/ui components.
- **Routing Structure**: Includes routes for viewer home (`/`), marketing landing (`/home`), signup (`/signup`), login (`/login`), creator dashboard (`/dashboard`), creator storefront (`/creator/:username`), video detail (`/video/:id`), viewer's library (`/library`), and creator discovery (`/explore`).
- **Data Flow**: Client requests hit Express server, API routes prefixed with `/api`. Database operations use Drizzle ORM. Server state managed by TanStack Query, theme state by React Context with localStorage persistence. Form state is prepared with React Hook Form and Zod.

## External Dependencies

- **Database**: Neon PostgreSQL serverless database
- **Authentication**: Supabase Auth
- **UI Framework**: Radix UI primitives
- **Validation**: Zod
- **Date Handling**: date-fns
- **Styling Utilities**: class-variance-authority, clsx
- **Carousel**: Swiper.js
- **Payment Processing**: Stripe (Checkout, Connect Express with 10% platform fees)
- **Video Processing**: FFmpeg (via fluent-ffmpeg)