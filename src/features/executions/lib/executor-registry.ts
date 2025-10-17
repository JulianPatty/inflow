// Import Prisma's NodeType enum and NodeExecutor type
import { NodeType } from "@/generated/prisma";
import { NodeExecutor } from "@/features/executions/types";

// Import all node executors
import { manualTriggerExecutor } from "@/features/triggers/components/manual-trigger/executor";
import { httpRequestExecutor } from "../components/http-request/executor";
import { agentExecutor } from "../components/agent-node/executor";

// Executor registry maps NodeType enum values to their corresponding executor functions
// When a workflow runs, the executeWorkflow function looks up the executor for each node type here
export const executorRegistry: Record<NodeType, NodeExecutor> = {
  [NodeType.INITIAL]: manualTriggerExecutor,
  [NodeType.MANUAL_TRIGGER]: manualTriggerExecutor,
  [NodeType.HTTP_REQUEST]: httpRequestExecutor,
  [NodeType.AGENT_NODE]: agentExecutor,
};

export const getExecutor = (type: NodeType): NodeExecutor => {
  const executor = executorRegistry[type];
  if (!executor) {
    throw new Error(`No executor found for node type: ${type}`);
  }

  return executor;
};