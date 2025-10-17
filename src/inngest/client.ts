// Import the Inngest SDK for background job processing and workflow orchestration
import { Inngest } from "inngest";

// Create and export the Inngest client instance with app identifier "inflow"
// This client is used to:
// - Define background functions (in functions.ts)
// - Send events to trigger workflows (e.g., inngest.send({ name: "workflows/execute.workflow" }))
// - Serve the Inngest API endpoint (in app/api/inngest/route.ts)
export const inngest = new Inngest({ id: "inflow" });
