# Mosswood - Creative Platform

## Overview

Mosswood is a full-stack web application designed as "the platform layer for creative ownership." It aims to empower content creators by providing a React-based platform where they can host their work, own their audience, and monetize on their own terms without intermediaries or algorithms. The project's vision is to create a direct-to-audience ecosystem for creative content.

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
- **Payment Processing**: Stripe (Checkout, Connect Express)
- **Video Processing**: FFmpeg (via fluent-ffmpeg)