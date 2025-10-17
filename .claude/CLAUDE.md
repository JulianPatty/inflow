# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 application called "Inflow" - a workflow automation platform built with:
- **Next.js 15.5.5** with App Router and React 19
- **TypeScript** with strict mode enabled
- **tRPC** for end-to-end typesafe APIs
- **Prisma** with PostgreSQL for database access
- **Better Auth** for authentication
- **Inngest** for background job processing and workflow execution
- **Sentry** for error tracking and monitoring
- **Radix UI** component library with Tailwind CSS
- **Biome** for linting and formatting (not ESLint/Prettier)
- **XYFlow** for visual workflow editor

## Development Commands

### Running the Application
```bash
npm run dev          # Start development server with Turbopack
npm run dev:all      # Start both Next.js and Inngest dev servers (using mprocs)
npm run inngest:dev  # Start Inngest dev server separately
npm run build        # Build production bundle with Turbopack
npm start            # Start production server
```

The `dev:all` command uses `mprocs` to run both the Next.js dev server and Inngest dev server concurrently. This is the recommended way to develop locally when working with workflows.

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
3. **Routers**: Define feature routers in `src/features/[feature]/server/routers.ts` and merge in `src/trpc/routers/_app.ts`
4. **API Route**: `src/app/api/trpc/routers/route.ts` - HTTP handler for tRPC requests
5. **Procedures**: Create using `baseProcedure` from `src/trpc/init.ts`

**Adding a new tRPC endpoint:**
```typescript
// 1. Create feature router in src/features/my-feature/server/routers.ts
import { createTRPCRouter, baseProcedure } from '@/trpc/init';

export const myFeatureRouter = createTRPCRouter({
  myEndpoint: baseProcedure.query(async () => {
    return prisma.model.findMany();
  })
});

// 2. Merge into app router in src/trpc/routers/_app.ts
import { myFeatureRouter } from '@/features/my-feature/server/routers';

export const appRouter = createTRPCRouter({
  myFeature: myFeatureRouter,
});
```

**Using tRPC in components:**
```typescript
// Server component
import { trpc } from '@/trpc/server';
const data = await trpc.myFeature.myEndpoint();

// Client component
'use client';
import { useTRPC } from '@/trpc/client';
const { data } = useTRPC().myFeature.myEndpoint.useQuery();
```

### Database with Prisma

- **Schema**: `prisma/schema.prisma`
- **Generated Client**: Output to `src/generated/prisma` (not default location)
- **Import**: Always use `import prisma from '@/lib/db'` for the singleton instance
- **Models**:
  - Better Auth: User, Session, Account, Verification
  - Workflows: Workflow, Node, Connection
  - Node types: INITIAL, MANUAL_TRIGGER, HTTP_REQUEST, AGENT_NODE (extendable enum)

When modifying the schema:
1. Update `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name descriptive_name`
3. Prisma Client auto-regenerates to `src/generated/prisma`

### Inngest Background Jobs

Inngest is used for asynchronous workflow execution with durable steps:

- **Client**: `src/inngest/client.ts` - Inngest instance with id "inflow"
- **Functions**: `src/inngest/functions.ts` - Inngest function definitions
- **API Route**: `src/app/api/inngest/route.ts` - Inngest webhook endpoint
- **Utilities**: `src/inngest/utils.ts` - Helper functions like topological sorting

**Key workflow execution function:**
- `executeWorkflow` - Processes workflows by:
  1. Fetching workflow nodes and connections from database
  2. Topologically sorting nodes based on connections
  3. Executing each node in order using the executor registry
  4. Passing context between nodes

**Triggering workflows:**
```typescript
import { inngest } from '@/inngest/client';

// Send event to trigger workflow execution
await inngest.send({
  name: 'workflows/execute.workflow',
  data: {
    workflowId: 'workflow-id',
    initialData: { /* optional initial context */ }
  }
});
```

### Workflow Execution System

The workflow system uses a node-based execution model:

**Core concepts:**
- **Nodes**: Individual workflow steps (triggers, actions) stored in database
- **Connections**: Define dependencies between nodes (from/to relationships)
- **Executors**: Node-specific logic that processes node data and updates context
- **Context**: Shared data object passed between nodes during execution

**Executor Registry** (`src/features/executions/lib/executor-registry.ts`):
- Maps `NodeType` enum to executor functions
- Each executor receives: node data, context, Inngest step tools
- Must return updated context for next nodes

**Template Variables in Nodes:**
Nodes support template variable replacement using `{{variable}}` syntax:
- Simple values: `{{httpResponse.data.name}}`
- JSON stringification: `{{json httpResponse.data}}`
- Context is shared across all nodes in a workflow execution

**Adding a new node type:**
```typescript
// 1. Add to NodeType enum in prisma/schema.prisma
enum NodeType {
  // ... existing types
  MY_NEW_NODE
}

// 2. Create three files in src/features/executions/components/my-node/:
//    - executor.ts (execution logic)
//    - dialog.tsx (configuration UI)
//    - node.tsx (visual component)

// 3. Executor example
export const myNodeExecutor: NodeExecutor = async ({ data, context, step }) => {
  const result = await step.run("my-step", async () => {
    // Your logic here
    return { ...context, myResult: 'updated' };
  });
  return result;
};

// 4. Register in executor-registry.ts
import { myNodeExecutor } from '@/features/my-feature/executor';

export const executorRegistry: Record<NodeType, NodeExecutor> = {
  // ... existing executors
  [NodeType.MY_NEW_NODE]: myNodeExecutor,
};

// 5. Register visual component in src/config/node-components.ts
import { MyNode } from '@/features/executions/components/my-node/node';

export const nodeComponents = {
  // ... existing components
  [NodeType.MY_NEW_NODE]: MyNode,
} as const satisfies NodeTypes;
```

### Authentication with Better Auth

- **Config**: `src/lib/auth.ts`
- **Provider**: Email/password authentication enabled
- **Adapter**: Uses Prisma adapter with PostgreSQL
- **Database**: Better Auth tables (user, session, account, verification) are in Prisma schema

The auth setup uses `betterAuth()` with Prisma adapter. Authentication state and session management follow Better Auth patterns.

### Error Tracking with Sentry

- **Server Config**: `sentry.server.config.ts` - Server-side error tracking
- **Edge Config**: `sentry.edge.config.ts` - Edge runtime error tracking
- **Integration**: Includes Vercel AI SDK integration for tracking AI operations
- **Features**: Console logging, trace sampling, user PII tracking (configurable)

### Feature-Based Organization

The codebase follows a feature-based structure:
- `src/features/[feature-name]/` - Feature modules
  - `components/` - Feature-specific React components
  - `server/` - Server-side code (tRPC routers, etc.)
  - `hooks/` - React hooks for the feature
  - `lib/` - Utility functions and business logic
  - `types.ts` - TypeScript type definitions

**Example features:**
- `src/features/workflows/` - Workflow CRUD and management
- `src/features/editor/` - Visual workflow editor (XYFlow)
- `src/features/executions/` - Node execution logic and registry
- `src/features/triggers/` - Workflow triggers (manual, scheduled, etc.)

### UI Components

- **Location**: `src/components/ui/`
- **Library**: Radix UI primitives with custom styling
- **Styling**: Tailwind CSS with `class-variance-authority` for variants
- **Utilities**: `src/lib/utils.ts` contains `cn()` helper for className merging

### App Router Structure

- `src/app/` - Next.js App Router pages
- `src/app/(auth)/` - Route group for authentication pages (login, signup)
- `src/app/layout.tsx` - Root layout wraps app with `TRPCReactProvider`
- `src/app/api/trpc/routers/route.ts` - tRPC HTTP handler
- `src/app/api/inngest/route.ts` - Inngest webhook handler

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
- `ANTHROPIC_API_KEY` - For Claude AI models (AGENT_NODE)
- `OPENAI_API_KEY` - For GPT models (AGENT_NODE)
- `GOOGLE_GENERATIVE_AI_API_KEY` - For Gemini models (AGENT_NODE)
- Better Auth configuration variables
- Sentry DSN (optional, for error tracking)

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

### AI Agent Integration

The application supports AI agents powered by multiple providers via Vercel AI SDK and Inngest AgentKit:

**Supported Providers:**
- **Anthropic**: Claude models (3.5 Sonnet, 3.5 Haiku, 3 Opus, etc.)
- **OpenAI**: GPT models (GPT-4o, GPT-4 Turbo, GPT-3.5 Turbo, etc.)
- **Google**: Gemini models (Gemini 2.0 Flash, 1.5 Pro, etc.)

**AI Dependencies:**
- `ai` (Vercel AI SDK) - Core AI text generation
- `@ai-sdk/anthropic`, `@ai-sdk/openai`, `@ai-sdk/google` - Provider SDKs
- `@inngest/agent-kit` - Advanced agent toolkit for multi-agent systems
- `@inngest/use-agent` - React hooks for agent integration

**Agent Node Architecture:**
The AGENT_NODE type in the workflow system enables AI-powered steps:
- **Executor** (`src/features/executions/components/agent-node/executor.ts`):
  - Uses Vercel AI SDK's `generateText()` for simple text generation
  - Supports all three AI providers with dynamic model selection
  - Template variable replacement in prompts
  - Returns `agentResponse` object with text, model, provider, tokensUsed
- **Dialog** (`src/features/executions/components/agent-node/dialog.tsx`):
  - Provider selection (Anthropic/OpenAI/Google)
  - Model dropdown (dynamically updates based on provider)
  - Temperature slider (0-2)
  - Max tokens input (1-8192)
  - Prompt textarea with template variable support
- **Node Component** (`src/features/executions/components/agent-node/node.tsx`):
  - Visual representation with BrainCircuit icon
  - Displays provider name and truncated prompt

**Using AI Agents in Workflows:**
```typescript
// Context output from AGENT_NODE
{
  agentResponse: {
    text: "AI-generated response...",
    provider: "anthropic" | "openai" | "google",
    model: "claude-3-5-sonnet-20241022",
    prompt: "Processed prompt with variables...",
    tokensUsed: 1234
  }
}

// Access in subsequent nodes via template variables
"Process this result: {{agentResponse.text}}"
```

**Inngest AgentKit (Advanced):**
For complex multi-agent systems, use `@inngest/agent-kit`:
- Multi-agent networks with routing
- Tool calling with MCP support
- Shared state management across agents
- Built-in integrations (E2B, Browserbase, Smithery)
- See AgentKit docs: https://agentkit.inngest.com

## Key Files

- `src/trpc/init.ts` - tRPC initialization and context
- `src/trpc/routers/_app.ts` - Root tRPC router combining all feature routers
- `src/lib/db.ts` - Prisma singleton client
- `src/lib/auth.ts` - Better Auth configuration
- `src/lib/utils.ts` - Utility functions (cn, etc.)
- `src/inngest/client.ts` - Inngest client instance
- `src/inngest/functions.ts` - Inngest function definitions
- `src/inngest/utils.ts` - Workflow utilities (topological sort)
- `src/features/executions/lib/executor-registry.ts` - Node executor mapping
- `src/features/executions/types.ts` - Workflow execution type definitions
- `src/config/node-components.ts` - XYFlow node component registry
- `prisma/schema.prisma` - Database schema with custom output path
- `mprocs.yaml` - Multi-process configuration for concurrent dev servers
