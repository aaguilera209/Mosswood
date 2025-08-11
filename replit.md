# Mosswood - Creative Platform

## Overview

Mosswood is a full-stack web application designed as "the platform layer for creative ownership." It aims to empower content creators by providing a React-based platform where they can host their work, own their audience, and monetize on their own terms without intermediaries or algorithms. The project's vision is to create a direct-to-audience ecosystem for creative content.

## Recent Changes (August 2025)

### Featured Creators Navigation Fix - RESOLVED ✅
- **Issue**: Featured Creators loading correctly initially but breaking when navigating back from sign-in page
- **Root Cause**: `queryClient.clear()` in AuthContext was wiping ALL cache data on auth state changes, including public creators data
- **Solution**: Replaced global cache clearing with selective removal of only user-specific queries (profile, library, purchases)
- **Technical Details**: Preserved public data (creators, videos) while clearing private user data on sign out
- **Status**: ✅ Fixed - Featured Creators now persists across navigation without unnecessary refetching

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