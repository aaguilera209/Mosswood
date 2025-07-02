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
- **Strategy**: Session-based authentication (prepared for implementation)
- **Storage**: PostgreSQL sessions via connect-pg-simple
- **User Model**: Basic user entity with username/password

### UI Design System
- **Theme**: Dual light/dark theme support with CSS variables
- **Colors**: Cinematic color palette with amber accents (no purple)
- **Typography**: Inter font family
- **Components**: Comprehensive UI component library from Shadcn/ui
- **Logo System**: Reusable Logo component with configurable text display

### Routing Structure
- **Home** (`/`): Landing page with hero, video, and mission sections
- **Signup** (`/signup`): User registration page
- **Login** (`/login`): User authentication page
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
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```