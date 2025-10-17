// Client-side React component
"use client";

// Import XYFlow hooks and types for workflow node management, icons, and React utilities
import { useReactFlow, type Node, type NodeProps } from "@xyflow/react";
import { GlobeIcon } from "lucide-react";
import { memo, useState } from "react";
import { BaseExecutionNode } from "../base-execution-node";
import { HttpRequestFormValues, HttpRequestDialog } from "./dialog";

// Type definition for HTTP request node data structure
// Stores the endpoint URL, HTTP method, and optional request body
type HttpRequestNodeData = {
  endpoint?: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: string;
};

// Combines XYFlow's Node type with our custom HttpRequestNodeData
type HttpRequestNodeType = Node<HttpRequestNodeData>;

// Main HTTP Request node component - displays and manages HTTP request configuration in the workflow editor
// Wrapped in memo() to prevent unnecessary re-renders when parent components update
export const HttpRequestNode = memo((props: NodeProps<HttpRequestNodeType>) => {
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
  const handleSubmit = (values: HttpRequestFormValues) => {
    setNodes((nodes) => nodes.map((node) => {
      if (node.id === props.id) {
        return {
          ...node,
          data: {
            ...node.data,
            ...values,
          }
        }
      }
      return node;
    }))
  };

  // Extract node data and generate a human-readable description
  // Shows "GET: /api/users" if configured, otherwise "Not configured"
  const nodeData = props.data;
  const description = nodeData?.endpoint
    ? `${nodeData.method || "GET"}: ${nodeData.endpoint}`
    : "Not configured";

  return (
    <>
      {/* Configuration dialog for editing HTTP request settings (endpoint, method, body) */}
      <HttpRequestDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        defaultValues={nodeData}
      />

      {/* Visual node component displayed in the workflow editor */}
      <BaseExecutionNode
        {...props}
        id={props.id}
        icon={GlobeIcon}
        name="HTTP Request"
        status={nodeStatus}
        description={description}
        onSettings={handleOpenSettings}
        onDoubleClick={handleOpenSettings}
      />
    </>
  )
});

// Display name for React DevTools
HttpRequestNode.displayName = "HttpRequestNode";