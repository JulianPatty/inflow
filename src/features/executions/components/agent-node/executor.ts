// Import the NodeExecutor type for workflow execution
// NonRetriableError tells Inngest not to retry this step if it fails
import type { NodeExecutor } from "@/features/executions/types";
import { NonRetriableError } from "inngest";
// Import Vercel AI SDK's generateText for text generation
import { generateText } from "ai";
// Import AI provider SDKs
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";


// Type definition for agent node data - matches the data structure from the node component
type AgentNodeData = {
  prompt?: string;
  provider?: "openai" | "anthropic" | "google";
  model?: string;
  temperature?: number;
  maxTokens?: number;
};

// Helper function to replace template variables in text with actual values from context
// Supports {{variable}} syntax for simple values and {{json variable}} for JSON stringification
// Example: "User {{httpResponse.data.name}}" with context {httpResponse: {data: {name: "John"}}} -> "User John"
const replaceTemplateVariables = (
  text: string,
  context: Record<string, unknown>,
): string => {
  return text.replace(/\{\{(\s*json\s+)?([^}]+)\}\}/g, (match, jsonFlag, path) => {
    const keys = path.trim().split(".");
    let value: unknown = context;

    // Navigate through nested object properties
    for (const key of keys) {
      if (value && typeof value === "object" && key in value) {
        value = (value as Record<string, unknown>)[key];
      } else {
        return match; // Return original if path not found
      }
    }

    // If {{json variable}} syntax, stringify the value
    if (jsonFlag) {
      return JSON.stringify(value);
    }

    // Otherwise return as string
    return String(value);
  });
};

// Executor function that runs when an Agent node is processed in a workflow
// This is the actual logic that calls the AI agent during workflow execution
export const agentExecutor: NodeExecutor<AgentNodeData> = async ({
  data,
  context,
  step,
}) => {
  // TODO: Publish "loading" state for agent node

  // Validate that a prompt is configured - throw non-retriable error if missing
  if (!data.prompt) {
    // TODO: Publish "error" state for agent node
    throw new NonRetriableError("Agent node: No prompt configured");
  }

  // Execute the agent as an Inngest step for durability and retry support
  // The step.run wrapper provides automatic retries, logging, and state management
  const result = await step.run("agent-execution", async () => {
    // Replace template variables in the prompt with actual values from workflow context
    // This allows dynamic prompts like "Summarize this data: {{httpResponse.data}}"
    const processedPrompt = replaceTemplateVariables(data.prompt!, context);

    // Set defaults for provider, model, and parameters
    const provider = data.provider || "anthropic";
    const temperature = data.temperature ?? 0.7;
    // Note: maxTokens is stored in data but not currently used by generateText API
    // It's kept for future use when the API supports it

    // Get the appropriate model based on provider and model selection
    let model;
    let modelName: string;

    switch (provider) {
      case "anthropic":
        modelName = data.model || "claude-3-5-sonnet-20241022";
        model = anthropic(modelName);
        break;
      case "openai":
        modelName = data.model || "gpt-4o";
        model = openai(modelName);
        break;
      case "google":
        modelName = data.model || "gemini-2.0-flash-exp";
        model = google(modelName);
        break;
      default:
        throw new NonRetriableError(`Unsupported AI provider: ${provider}`);
    }

    // Use Vercel AI SDK's generateText for text generation
    // This provides a simple interface for generating text with AI models across providers
    const agentResult = await generateText({
      // Configure the AI model based on selected provider
      model,
      // System instructions for the agent
      system: `You are a helpful AI assistant integrated into a workflow automation system.
You have access to data from previous workflow steps through the context.
Provide clear, concise, and accurate responses.`,
      // User prompt (after template variable replacement)
      prompt: processedPrompt,
      // Model parameters
      temperature,
      maxRetries: 2, // Retry failed requests up to 2 times
    });

    // Return updated context with the agent's response
    // This makes the response available to subsequent nodes in the workflow via {{agentResponse.text}}
    return {
      ...context,
      agentResponse: {
        text: agentResult.text,
        provider,
        model: modelName,
        prompt: processedPrompt,
        tokensUsed: agentResult.usage?.totalTokens || 0,
      },
    };
  });

  // TODO: Publish "success" state for agent node

  // Return the updated context to pass to the next node in the workflow
  return result;
};
