# Mosswood - Creative Platform

## Overview

Mosswood is a full-stack web application designed as "the platform layer for creative ownership." It's a React-based platform where content creators can host their work, own their audience, and monetize on their own terms without intermediaries or algorithms.

## System Architecture

The application follows a monorepo structure with clear separation between client, server, and shared components:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Shadcn/ui component library with Radix UI primitives
- **State Management**: TanStack Query for server state, React Context for theme management
- **Build Tool**: Vite with ESM modules

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (@neondatabase/serverless)
- **Session Management**: Connect-pg-simple for PostgreSQL session storage

### Development Architecture
- **Development Server**: Vite middleware integrated with Express
- **Hot Module Replacement**: Full HMR support in development
- **Type Safety**: Shared TypeScript types between client and server

## Key Components

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` for type-safe database operations
- **Migrations**: Stored in `./migrations` directory
- **Current Schema**: Users table with id, username, and password fields

### Authentication System
- **Strategy**: Supabase authentication with row-level security
- **Provider**: Supabase Auth with email/password
- **Profiles**: Separate profiles table with role-based access control
- **Roles**: 'creator' (content creators) and 'viewer' (content consumers)
- **Default Role**: New users default to 'viewer' role for two-sided marketplace
- **Authorization**: Role-based UI rendering and protected routes

### UI Design System
- **Theme**: Dual light/dark theme support with CSS variables
- **Colors**: Deep navy background (#0d1b2a) with deep teal accents (#007B82) for "Indie Film Festival" aesthetic
- **Typography**: Inter font family
- **Components**: Comprehensive UI component library from Shadcn/ui
- **Logo System**: Reusable Logo component with configurable text display

### Routing Structure
- **Viewer Home** (`/`): Main landing page with featured creators and platform overview
- **Home** (`/home`): Original marketing landing page with hero, video, and mission sections
- **Signup** (`/signup`): User registration page (defaults to 'viewer' role)
- **Login** (`/login`): User authentication page
- **Dashboard** (`/dashboard`): Creator dashboard for content management (creator role only)
- **Creator Storefront** (`/creator/:username`): Public-facing creator profile and video store with purchase integration
- **Video Detail** (`/video/:id`): Individual video viewing page with role-based access control
- **My Library** (`/library`): Viewer's purchased video collection (viewer role only)
- **Explore** (`/explore`): Creator discovery page with search and filtering (viewer role only)
- **404**: Not found page

## Data Flow

### Request Flow
1. Client requests hit Express server
2. Static assets served via Vite middleware in development
3. API routes prefixed with `/api` (currently empty, ready for implementation)
4. Database operations handled through Drizzle ORM
5. Response logging middleware tracks API performance

### State Management
- **Server State**: TanStack Query with custom query client
- **Theme State**: React Context with localStorage persistence
- **Form State**: React Hook Form with Zod validation (prepared)

## External Dependencies

### Core Dependencies
- **Database**: Neon PostgreSQL serverless database
- **UI Framework**: Radix UI primitives for accessible components
- **Validation**: Zod for schema validation with Drizzle integration
- **Date Handling**: date-fns for date utilities
- **Styling**: class-variance-authority and clsx for conditional styling

### Development Dependencies
- **Build**: esbuild for server bundling, Vite for client
- **Replit Integration**: Specialized Vite plugins for Replit environment
- **Type Checking**: TypeScript with strict configuration

## Deployment Strategy

### Build Process
1. **Client Build**: Vite builds React app to `dist/public`
2. **Server Build**: esbuild bundles Express server to `dist/index.js`
3. **Database**: Drizzle migrations applied via `db:push` command

### Environment Configuration
- **Development**: tsx with hot reloading via Vite middleware
- **Production**: Node.js serves bundled application
- **Database**: Requires `DATABASE_URL` environment variable

### Scripts
- `dev`: Development server with hot reloading
- `build`: Production build for both client and server
- `start`: Production server start
- `check`: TypeScript type checking
- `db:push`: Database schema migrations

## Changelog

```
Changelog:
- July 02, 2025. Initial setup
- July 02, 2025. Implemented cinematic color palette with amber accents
- July 02, 2025. Created reusable Logo component for brand consistency
- July 02, 2025. Built Creator Dashboard page with placeholder content structure
- July 10, 2025. Created responsive Creator Storefront page with video grid and pricing
- July 10, 2025. Built Video Detail page with three playback modes (default, theater, fullscreen)
- July 11, 2025. Major color palette redesign: Deep navy background (#0d1b2a) with sunset orange accents (#ff914d)
- July 12, 2025. Complete visual identity overhaul: Replaced all orange (#FFA552) with deep teal (#007B82) across entire platform
- July 12, 2025. Implemented Twitter-style blue verified badges (#1DA1F2) with checkmark icons
- July 12, 2025. Updated light mode to use off-white backgrounds (#FAFAFA) with improved contrast and accessibility
- July 12, 2025. Enhanced CSS variables and Tailwind config for new "Indie Film Festival Vibe" aesthetic
- July 13, 2025. Implemented horizontal swipeable carousel for Featured Creators section with Netflix-style interface
- July 13, 2025. Added drag-to-scroll, mouse wheel, touch, and keyboard navigation support to carousel
- July 13, 2025. Implemented responsive design (3 cards desktop, 2 tablet, 1 mobile) with smooth animations
- July 13, 2025. Added auto-play functionality, progress dots, and accessibility features for enhanced UX
- July 14, 2025. Refined carousel with cinematic hover effects: scale(1.02), enhanced z-index stacking, and cyan/teal gradient styling
- July 14, 2025. Implemented proper overflow handling to prevent hover effect clipping with cyan accent colors (#1ecbe1, #00bfa6)
- July 14, 2025. Enhanced navigation buttons with cyan borders and improved accessibility focus states
- July 14, 2025. Complete carousel rebuild: Fixed isolated hover effects, proper 3-card layout, working navigation arrows, pagination dots, and 9 sample creators with working image placeholders
- July 14, 2025. Implemented React Slick carousel with user-specified CSS styling and isolated hover effects for individual creator cards
- July 16, 2025. Refactored FeaturedCreatorsCarousel to use Swiper.js with uniform card sizing, isolated hover effects, clickable slides, and proper View All button positioning
- July 16, 2025. Implemented complete Stripe Checkout integration: backend checkout session creation, webhook handling, frontend checkout flow, payment success/cancel pages, and updated VideoDetail buy button
- July 16, 2025. Improved UX flow: Buy buttons now navigate to video detail page first, then show purchase option. Fixed PaymentModal double X issue by removing duplicate close button. Updated CreatorStorefront buttons to "View Details" for better clarity
- July 16, 2025. **FIXED: Stripe checkout integration** - Resolved iframe security restrictions by opening Stripe checkout in new window instead of redirecting current frame. Checkout now works properly in Replit environment
- July 16, 2025. **COMPLETED: Stripe payment flow** - Fixed "Something went wrong" checkout errors by implementing HTTPS URLs, proper session URL handling, and enhanced error logging. Payment checkout now opens successfully in new tab
- July 16, 2025. **SETUP: Supabase database** - Successfully created profiles table with role-based access control, Row Level Security policies, and automatic profile creation trigger. Database ready for user authentication and payment records
- July 16, 2025. **COMPLETED: Purchase tracking system** - Implemented complete purchase recording with Supabase integration: purchases table created, webhook records successful payments, MyLibrary displays real purchase history with proper error handling
- July 16, 2025. **FIXED: User signup RLS policies** - Resolved signup failures by updating Row Level Security policies to allow proper user registration and profile creation
- July 17, 2025. **COMPLETED: End-to-end purchase system** - Fixed frontend React Query issues preventing MyLibrary page from loading, resolved video access verification, and established complete purchase flow: Stripe checkout → payment recording → video unlock → library display
- July 17, 2025. **COMPLETED: Stripe Connect Express onboarding** - Built and tested complete creator payment setup system with backend APIs, frontend components, database migration, and dashboard integration. Includes smart redirect/popup handling for development vs production environments
- July 11, 2025. Cleaned up Video Detail navigation: removed Dashboard link, added "Back to Maya's Page" button
- July 11, 2025. Added comprehensive theme toggle (light/dark mode) across all pages
- July 11, 2025. Implemented dynamic video routing: Video Detail page now loads correct video data based on URL parameter
- July 11, 2025. Created shared video data structure for consistent video information across pages
- July 11, 2025. Enhanced Video Detail page with proper error handling for missing videos
- July 11, 2025. Completed Supabase authentication system with role-based access control ('creator' and 'viewer' roles)
- July 11, 2025. Built comprehensive viewer-facing UI: ViewerHome, MyLibrary, and ExplorePage
- July 11, 2025. Updated Header to show role-specific navigation (Dashboard for creators, Explore/Library for viewers)
- July 11, 2025. Enhanced CreatorStorefront with viewer-aware features: buy buttons, purchase status, payment integration
- July 11, 2025. Updated VideoDetail page with viewer authentication checks and role-based video access control
- July 11, 2025. Changed default user role from 'creator' to 'viewer' to support two-sided marketplace
- July 11, 2025. Integrated PaymentModal across viewer-facing pages for seamless content purchasing
- July 11, 2025. Implemented "Become a Creator" CTA with Supabase role conversion functionality across ViewerHome and MyLibrary pages
- July 11, 2025. Enhanced MyLibrary empty state with dual-action buttons for viewer engagement
- July 11, 2025. Removed authentication barriers for testing - all pages accessible without sign-in
- July 11, 2025. Refactored Creator Dashboard with comprehensive tab-based architecture (Overview, Videos, Analytics, Promo Codes)
- July 11, 2025. Added Promo Code Redemption Tracking with detailed redemption history and revenue metrics
- July 11, 2025. Implemented Advanced Analytics v1 with video performance metrics, revenue insights, and audience data
- July 11, 2025. Enhanced dashboard with comprehensive mock data for testing all analytics and promo code features
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```