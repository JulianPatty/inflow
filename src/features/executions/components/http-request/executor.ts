// Import the NodeExecutor type for workflow execution
// NonRetriableError tells Inngest not to retry this step if it fails
// ky is a modern fetch wrapper with better defaults and error handling
import type { NodeExecutor } from "@/features/executions/types";
import { NonRetriableError } from "inngest";
import ky, { type Options as KyOptions } from "ky";

// Type definition for HTTP request node data - matches the data structure from the node component
type HttpRequestData = {
  endpoint?: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: string;
};

// Executor function that runs when an HTTP Request node is processed in a workflow
// This is the actual logic that performs the HTTP request during workflow execution
export const httpRequestExecutor: NodeExecutor<HttpRequestData> = async ({
  data,
  nodeId,
  context,
  step,
}) => {
  // TODO: Publish "loading" state for http request

  // Validate that an endpoint is configured - throw non-retriable error if missing
  // NonRetriableError prevents infinite retry loops for configuration errors
  if (!data.endpoint) {
    // TODO: Publish "error" state for http request
    throw new NonRetriableError("HTTP Request node: No endpoint configured");
  }

  // Execute the HTTP request as an Inngest step for durability and retry support
  // The step.run wrapper provides automatic retries, logging, and state management
  const result = await step.run("http-request", async () => {
    // Extract and set defaults for the HTTP request
    const endpoint = data.endpoint!;
    const method = data.method || "GET";

    // Build ky options object with the HTTP method
    const options: KyOptions = { method };

    // Only include request body for methods that support it
    // GET and DELETE typically don't have bodies
    if (["POST", "PUT", "PATCH"].includes(method)) {
      options.body = data.body;
    }

    // Make the HTTP request using ky (throws on non-2xx responses)
    const response = await ky(endpoint, options);

    // Parse response based on content type
    // If JSON, parse as JSON object; otherwise return as plain text
    const contentType = response.headers.get("content-type");
    const responseData = contentType?.includes("application/json")
      ? await response.json()
      : await response.text();

    // Return updated context with the HTTP response data
    // This makes the response available to subsequent nodes in the workflow via {{httpResponse.data}}
    return {
      ...context,
      httpResponse: {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
      }
    }
  });

  // TODO: Publish "success" state for http request

  // Return the updated context to pass to the next node in the workflow
  return result;
};