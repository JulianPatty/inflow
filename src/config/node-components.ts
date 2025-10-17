import { InitialNode } from "@/components/initial-node";
import { NodeType } from "@/generated/prisma";
import type { NodeTypes } from "@xyflow/react";

import { HttpRequestNode } from "@/features/executions/components/http-request/node";
import { ManualTriggerNode } from "@/features/triggers/components/manual-trigger/node";
import { AgentNode } from "@/features/executions/components/agent-node/node";

export const nodeComponents = {
  [NodeType.INITIAL]: InitialNode,
  [NodeType.HTTP_REQUEST]: HttpRequestNode,
  [NodeType.MANUAL_TRIGGER]: ManualTriggerNode,
  [NodeType.AGENT_NODE]: AgentNode,
} as const satisfies NodeTypes;

export type RegisteredNodeType = keyof typeof nodeComponents;
