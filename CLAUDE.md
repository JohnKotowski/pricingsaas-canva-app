# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a Canva App project - a React SPA that runs inside the Canva Editor as a Digital Asset Management (DAM) application. The app connects to Supabase Edge Functions to fetch and display images for users. It uses Canva's SDK to integrate with the design editor and provides a searchable interface for image resources stored in Supabase.

## Development Commands

**Development Server:**
- `npm start` - Start development server at localhost:8080 (requires .env setup for HMR)
- `npm start --use-https` - Start with HTTPS for Safari compatibility  
- `npm start -- --preview` - Start in preview mode

**Build & Deploy:**
- `npm run build` - Production build with message extraction (outputs to dist/)
- `npm run extract` - Extract i18n messages to dist/messages_en.json

**Code Quality:**
- `npm run lint` - ESLint check with Canva's plugin
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run lint:types` - TypeScript type checking
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check formatting without changes

**Testing:**
- `npm test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode

## Architecture

**Frontend (src/):**
- `app.tsx` - Main app component using SearchableListView from @canva/app-components
- `adapter.ts` - Resource finding logic for external DAM integration
- `config.ts` - Configuration hook for app settings
- `index.tsx` - React app entry point
- `index.css` - Main styles

**Backend (backend/):**
- `server.ts` - Express server with CORS and DAM router (runs on port 3001)
- `routers/dam.ts` - DAM-specific API routes
- Requires CANVA_APP_ID environment variable

**Utilities (utils/):**
- `backend/` - Backend utilities including JWT middleware and base server creation
- Custom React hooks for Canva integration (selection, overlay, element addition)
- `table_wrapper.ts` - Table component wrapper

**Build System:**
- Webpack configuration with TypeScript, PostCSS, and CSS modules
- FormatJS for i18n message extraction
- Jest for testing with jsdom environment

## Environment Setup

Required Node.js version is defined in .nvmrc (use `nvm use`). 

Environment variables needed in .env:
- `CANVA_APP_ID` - App identifier from Developer Portal
- `CANVA_APP_ORIGIN` - App origin URL for HMR
- `CANVA_HMR_ENABLED` - Enable Hot Module Replacement
- `CANVA_BACKEND_HOST` - Backend URL (http://localhost:3001 for dev)
- `CANVA_BACKEND_PORT` - Backend port (3001)
- `CANVA_FRONTEND_PORT` - Frontend port (8080)
- `SUPABASE_URL` - Supabase project URL (https://your-project-ref.supabase.co)
- `SUPABASE_ANON_KEY` - Supabase anonymous key for client-side API calls

## Key Dependencies

**Canva SDK:**
- `@canva/app-components` - High-level components (SearchableListView)
- `@canva/app-ui-kit` - UI components following Canva design system
- `@canva/platform`, `@canva/design`, `@canva/asset` - Core Canva APIs
- `@canva/app-eslint-plugin` - Linting rules for Canva apps

**App Framework:**
- React 18 with TypeScript (strict mode, ES2019 target)
- react-intl for internationalization
- Express backend with CORS support

## Code Conventions

- TypeScript strict mode enabled
- Prettier: 80 char width, 2 spaces, trailing commas, double quotes
- Use absolute imports for styles directory
- Test files follow `*.tests.tsx?` pattern
- CSS modules for component styles

## Supabase Integration

**Edge Function Setup:**
- Edge Function located at `supabase/functions/canva-get-images/index.ts`
- Deploy using: `supabase functions deploy canva-get-images`
- Implements collection/asset hierarchy: `app_collections` → `app_assets`
- Returns collections as folders when no containerIds specified
- Returns assets when specific collection ID provided
- See `supabase/README.md` for detailed setup instructions

**Database Structure:**
- **app_collections**: Contains collection metadata (shown as folders in Canva)
- **app_assets**: Contains actual image assets linked to collections
- Connection: `app_assets.collection_id` → `app_collections.id`

**User Flow:**
1. User opens app → sees `app_collections` as folders
2. User clicks collection → sees `app_assets` for that collection as images
3. User can search/filter within collections or across all collections

## Development Notes

- App runs in sandboxed iframe within Canva Editor
- Preview requires Canva Developer Portal setup
- HMR significantly improves development experience
- App connects to Supabase Edge Functions instead of local backend
- Image resources are fetched from Supabase database via Edge Functions
- App permissions defined in canva-app.json (design read/write access)
- Build output in dist/ directory is submitted to Canva for review
- add instructions to always use MCP supabase tool when working on supabase related changes