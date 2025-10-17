// Import Prisma types for workflow nodes and connections
import { Connection, Node } from "@/generated/prisma";
// Import toposort library for topological sorting algorithm
import toposort from "toposort";

// Sorts workflow nodes in topological order based on their dependencies
// Topological sort ensures that nodes are executed in an order where all dependencies are resolved first
// Example: If Node A -> Node B -> Node C, the sorted order will be [A, B, C]
// This prevents executing a node before its required inputs are available
export const topologicalSort = (
  nodes: Node[],
  connections: Connection[],
): Node[] => {
  // If no connections exist, all nodes are independent and can be returned as-is
  // No need for sorting when there are no dependencies
  if (connections.length === 0) {
    return nodes;
  }

  // Convert connections to edges array format required by toposort library
  // Each edge is a tuple [from, to] representing a directed dependency
  const edges: [string, string][] = connections.map((conn) => [
    conn.fromNodeId,
    conn.toNodeId,
  ]);

  // Identify all nodes that have at least one connection
  // We need this to find isolated nodes (nodes with no connections)
  const connectedNodeIds = new Set<string>();
  for (const conn of connections) {
    connectedNodeIds.add(conn.fromNodeId);
    connectedNodeIds.add(conn.toNodeId);
  }

  // Add self-edges for isolated nodes to ensure they're included in the sort
  // Without this, nodes with no connections would be excluded from the result
  // Self-edges (e.g., [nodeId, nodeId]) don't affect sort order but ensure inclusion
  for (const node of nodes) {
    if (!connectedNodeIds.has(node.id)) {
      edges.push([node.id, node.id]);
    }
  }

  // Perform topological sort using the toposort library
  let sortedNodeIds: string[];
  try {
    // toposort returns an array of node IDs in dependency order
    sortedNodeIds = toposort(edges);

    // Remove duplicates created by self-edges for isolated nodes
    sortedNodeIds = [...new Set(sortedNodeIds)];
  } catch (error) {
    // Detect cyclic dependencies (e.g., A -> B -> C -> A)
    // Cyclic workflows are invalid and cannot be executed
    if (error instanceof Error && error.message.includes("Cyclic")) {
      throw new Error("Workflow contains a cycle");
    }
    throw error;
  }

  // Map sorted node IDs back to their corresponding node objects
  // Create a lookup map for O(1) access to nodes by ID
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // Return array of node objects in sorted order, filtering out any null values
  return sortedNodeIds.map((id) => nodeMap.get(id)!).filter(Boolean);
};