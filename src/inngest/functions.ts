// Import NonRetriableError to throw errors that should not be retried by Inngest
import { NonRetriableError } from "inngest";
// Import the Inngest client instance
import { inngest } from "./client";
// Import Prisma client for database access
import prisma from "@/lib/db";
// Import utility to sort nodes in dependency order
import { topologicalSort } from "@/inngest/utils";
// Import NodeType enum from Prisma schema
import { NodeType } from "@/generated/prisma";
// Import function to get the appropriate executor for each node type
import { getExecutor } from "@/features/executions/lib/executor-registry";

// Main workflow execution function - orchestrates the execution of all nodes in a workflow
// Triggered by sending event: inngest.send({ name: "workflows/execute.workflow", data: { workflowId } })
// This function provides:
// - Durable execution (survives server restarts)
// - Automatic retries on failure
// - Step-by-step execution tracking
// - Context passing between nodes
export const executeWorkflow = inngest.createFunction(
  // Function configuration
  { id: "execute-workflow" },
  // Event trigger - listens for "workflows/execute.workflow" events
  { event: "workflows/execute.workflow" },
  // Main execution handler
  async ({ event, step }) => {
    // Extract workflow ID from the event payload
    const workflowId = event.data.workflowId;

    // Validate that workflow ID is provided - throw non-retriable error if missing
    if (!workflowId) {
      throw new NonRetriableError("Workflow ID is missing");
    }

    // Step 1: Fetch workflow data and prepare execution order
    // This step is durable - if the function fails later, this step won't re-run
    const sortedNodes = await step.run("prepare-workflow", async () => {
      // Fetch workflow with all its nodes and connections from database
      const workflow = await prisma.workflow.findUniqueOrThrow({
        where: { id: workflowId },
        include: {
          nodes: true,
          connections: true,
        },
      });

      // Sort nodes in topological order based on their dependencies
      // Ensures nodes execute in the correct order (dependencies first)
      return topologicalSort(workflow.nodes, workflow.connections);
    });

    // Initialize context with any initial data from the trigger event
    // Context is a shared data object passed between all nodes in the workflow
    let context = event.data.initialData || {};

    // Execute each node in the sorted order
    // Each node can read from and write to the context
    for (const node of sortedNodes) {
      // Get the appropriate executor function for this node type (e.g., HTTP_REQUEST -> httpRequestExecutor)
      const executor = getExecutor(node.type as NodeType);

      // Execute the node and update the context with its results
      // The executor returns an updated context that's passed to the next node
      context = await executor({
        data: node.data as Record<string, unknown>,
        nodeId: node.id,
        context,
        step,
      });
    }

    // Return final workflow result with the complete context
    return {
      workflowId,
      result: context,
    };
  },
);