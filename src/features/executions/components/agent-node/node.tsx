// Client-side React component
"use client";

// Import XYFlow hooks and types for workflow node management, icons, and React utilities
import { useReactFlow, type Node, type NodeProps } from "@xyflow/react";
import { BrainCircuitIcon } from "lucide-react";
import { memo, useState } from "react";
import { BaseExecutionNode } from "../base-execution-node";
import { type AgentFormValues, AgentDialog } from "./dialog";

// Type definition for AI agent node data structure
// Stores the prompt, AI provider, model selection, temperature, and max tokens
type AgentNodeData = {
  prompt?: string;
  provider?: "anthropic" | "openai" | "google";
  model?: string;
  temperature?: number;
  maxTokens?: number;
};

// Combines XYFlow's Node type with our custom AgentNodeData
type AgentNodeType = Node<AgentNodeData>;

// Main AI Agent node component - displays and manages AI agent configuration in the workflow editor
// Wrapped in memo() to prevent unnecessary re-renders when parent components update
export const AgentNode = memo((props: NodeProps<AgentNodeType>) => {
  // Controls whether the settings dialog is open or closed
  const [dialogOpen, setDialogOpen] = useState(false);

  // Access to XYFlow's node update function
  const { setNodes } = useReactFlow();

  // Current execution status of the node (hardcoded for now)
  const nodeStatus = "initial";

  // Opens the configuration dialog when user clicks settings or double-clicks the node
  const handleOpenSettings = () => setDialogOpen(true);

  // Updates the node's data when the user submits the configuration form
  // Finds the matching node by ID and merges the new values with existing data
  const handleSubmit = (values: AgentFormValues) => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === props.id) {
          return {
            ...node,
            data: {
              ...node.data,
              ...values,
            },
          };
        }
        return node;
      }),
    );
  };

  // Extract node data and generate a human-readable description
  // Shows provider and truncated prompt if configured, otherwise "Not configured"
  const nodeData = props.data;

  // Create a readable provider name for display
  const getProviderName = (provider?: string) => {
    switch (provider) {
      case "anthropic":
        return "Claude";
      case "openai":
        return "GPT";
      case "google":
        return "Gemini";
      default:
        return "AI";
    }
  };

  const description = nodeData?.prompt
    ? `${getProviderName(nodeData.provider)}: ${nodeData.prompt.slice(0, 50)}${nodeData.prompt.length > 50 ? "..." : ""}`
    : "Not configured";

  return (
    <>
      {/* Configuration dialog for editing AI agent settings (prompt, model, temperature, max tokens) */}
      <AgentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        defaultValues={nodeData}
      />

      {/* Visual node component displayed in the workflow editor */}
      <BaseExecutionNode
        {...props}
        id={props.id}
        icon={BrainCircuitIcon}
        name="AI Agent"
        status={nodeStatus}
        description={description}
        onSettings={handleOpenSettings}
        onDoubleClick={handleOpenSettings}
      />
    </>
  );
});

// Display name for React DevTools
AgentNode.displayName = "AgentNode";
