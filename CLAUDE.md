# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 application called "Inflow" built with:
- **Next.js 15.5.5** with App Router and React 19
- **TypeScript** with strict mode enabled
- **tRPC** for end-to-end typesafe APIs
- **Prisma** with PostgreSQL for database access
- **Better Auth** for authentication
- **Radix UI** component library with Tailwind CSS
- **Biome** for linting and formatting (not ESLint/Prettier)

## Development Commands

#Better UI Comands 

- **Typescript Realates to the Inner Command Line s


### Running the Application
```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build production bundle with Turbopack
npm start            # Start production server
```

### Code Quality
```bash
npm run lint         # Run Biome linter checks
npm run format       # Format code with Biome
```

### Database
```bash
npx prisma migrate dev        # Create and apply new migration
npx prisma migrate deploy     # Apply migrations in production
npx prisma generate          # Generate Prisma Client
npx prisma studio            # Open Prisma Studio GUI
```

## Architecture

### tRPC Setup

The application uses tRPC for type-safe API communication with a specific pattern:

1. **Server-side**: `src/trpc/server.tsx` - Use `trpc` proxy for server components and RSC
2. **Client-side**: `src/trpc/client.tsx` - Use `useTRPC()` hook for client components
3. **Routers**: Define in `src/trpc/routers/` and merge in `src/trpc/routers/_app.ts`
4. **Procedures**: Create using `baseProcedure` from `src/trpc/init.ts`

**Adding a new tRPC endpoint:**
```typescript
// In src/trpc/routers/_app.ts or a new router file
export const appRouter = createTRPCRouter({
  myEndpoint: baseProcedure.query(async () => {
    // Your logic here
    return prisma.model.findMany();
  })
});
```

**Using tRPC in components:**
```typescript
// Server component
import { trpc } from '@/trpc/server';
const data = await trpc.myEndpoint();

// Client component
'use client';
import { useTRPC } from '@/trpc/client';
const { data } = useTRPC().myEndpoint.useQuery();
```

### Database with Prisma

- **Schema**: `prisma/schema.prisma`
- **Generated Client**: Output to `src/generated/prisma` (not default location)
- **Import**: Always use `import prisma from '@/lib/db'` for the singleton instance
- **Models**: User, Session, Account, Verification (Better Auth schema)

When modifying the schema:
1. Update `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name descriptive_name`
3. Prisma Client auto-regenerates to `src/generated/prisma`

### Authentication with Better Auth

- **Config**: `src/lib/auth.ts`
- **Provider**: Email/password authentication enabled
- **Adapter**: Uses Prisma adapter with PostgreSQL
- **Database**: Better Auth tables (user, session, account, verification) are in Prisma schema

The auth setup uses `betterAuth()` with Prisma adapter. Authentication state and session management follow Better Auth patterns.

### Feature-Based Organization

The codebase follows a feature-based structure:
- `src/features/[feature-name]/` - Feature modules
  - `components/` - Feature-specific components
  - Additional feature logic as needed

Example: `src/features/auth/components/login-form.tsx`

### UI Components

- **Location**: `src/components/ui/`
- **Library**: Radix UI primitives with custom styling
- **Styling**: Tailwind CSS with `class-variance-authority` for variants
- **Utilities**: `src/lib/utils.ts` contains `cn()` helper for className merging

### App Router Structure

- `src/app/` - Next.js App Router pages
- `src/app/(auth)/` - Route group for authentication pages (login, etc.)
- `src/app/layout.tsx` - Root layout wraps app with `TRPCReactProvider`
- `src/app/api/trpc/[trpc]/route.ts` - tRPC API endpoint

## Important Patterns

### Path Aliases
Use `@/*` for imports: `import { something } from '@/lib/utils'`

### Server/Client Boundaries
- Use `'use client'` directive explicitly for client components
- Use `'server-only'` import in server-only modules (see `src/trpc/server.tsx`)
- Use `'client-only'` for client-only code

### Environment Variables
Required environment variables (check `.env`):
- `DATABASE_URL` - PostgreSQL connection string
- Better Auth configuration variables

### Styling
- Tailwind CSS 4.x with PostCSS
- Custom fonts: Geist Sans and Geist Mono
- Dark mode support via `next-themes`

## Code Style

This project uses **Biome** (not ESLint/Prettier):
- Indent: 2 spaces
- Domains: Next.js and React recommended rules enabled
- Auto-organize imports on save
- Run `npm run lint` to check, `npm run format` to fix

## Key Files

- `src/trpc/init.ts` - tRPC initialization and context
- `src/lib/db.ts` - Prisma singleton client
- `src/lib/auth.ts` - Better Auth configuration
- `src/lib/utils.ts` - Utility functions (cn, etc.)
- `prisma/schema.prisma` - Database schema with custom output path
