// Client-side React component
"use client";

// Import UI components from the component library for building the dialog
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

// Zod schema for form validation
// Validates that prompt is provided and all parameters are within acceptable ranges
const formSchema = z.object({
  prompt: z.string().min(1, { message: "Prompt is required" }),
  provider: z.enum(["anthropic", "openai", "google"]),
  model: z.string(),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().min(1).max(8192),
});

// Export the form values type for use in other components
export type AgentFormValues = z.infer<typeof formSchema>;

// Model options for each provider
const MODEL_OPTIONS = {
  anthropic: [
    { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet (Latest)" },
    { value: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku (Fast)" },
    { value: "claude-3-opus-20240229", label: "Claude 3 Opus (Most Capable)" },
    { value: "claude-3-sonnet-20240229", label: "Claude 3 Sonnet" },
    { value: "claude-3-haiku-20240307", label: "Claude 3 Haiku" },
  ],
  openai: [
    { value: "gpt-4o", label: "GPT-4o (Latest)" },
    { value: "gpt-4o-mini", label: "GPT-4o Mini (Fast)" },
    { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
    { value: "gpt-4", label: "GPT-4" },
    { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
  ],
  google: [
    { value: "gemini-2.0-flash-exp", label: "Gemini 2.0 Flash (Latest)" },
    { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
    { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
    { value: "gemini-1.0-pro", label: "Gemini 1.0 Pro" },
  ],
};

// Props interface for the dialog component
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: z.infer<typeof formSchema>) => void;
  defaultValues?: Partial<AgentFormValues>;
}

// Dialog component for configuring AI agent settings
// Provides form fields for prompt, model selection, temperature, and max tokens
export const AgentDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defaultValues = {},
}: Props) => {
  // Initialize react-hook-form with Zod validation and default values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: defaultValues.prompt || "",
      provider: defaultValues.provider || "anthropic",
      model: defaultValues.model || "claude-3-5-sonnet-20241022",
      temperature: defaultValues.temperature ?? 0.7,
      maxTokens: defaultValues.maxTokens || 1024,
    },
  });

  // Reset form values when dialog opens with new defaults
  // This ensures the form always shows the latest node configuration
  useEffect(() => {
    if (open) {
      form.reset({
        prompt: defaultValues.prompt || "",
        provider: defaultValues.provider || "anthropic",
        model: defaultValues.model || "claude-3-5-sonnet-20241022",
        temperature: defaultValues.temperature ?? 0.7,
        maxTokens: defaultValues.maxTokens || 1024,
      });
    }
  }, [open, defaultValues, form]);

  // Watch the provider field to update available models
  const watchProvider = form.watch("provider");
  const availableModels = MODEL_OPTIONS[watchProvider];

  // Update model when provider changes
  useEffect(() => {
    const currentModel = form.getValues("model");
    const isValidModel = availableModels.some((m) => m.value === currentModel);

    if (!isValidModel) {
      // Set default model for the selected provider
      form.setValue("model", availableModels[0].value);
    }
  }, [watchProvider, availableModels, form]);

  // Handle form submission - call parent's onSubmit callback and close dialog
  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI Agent</DialogTitle>
          <DialogDescription>
            Configure settings for the AI Agent node.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6 mt-4"
          >
            {/* Prompt textarea - supports template variables for dynamic content */}
            <FormField
              control={form.control}
              name="prompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prompt / Instructions</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={
                        'Analyze this data and provide insights:\n\n{{json httpResponse.data}}\n\nProvide a summary of key findings.'
                      }
                      className="min-h-[200px] font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Instructions for the AI agent. Use {"{{variables}}"} for simple values or {"{{json variable}}"} to stringify objects from workflow context.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* AI Provider selection dropdown - allows choosing between Anthropic, OpenAI, and Google */}
            <FormField
              control={form.control}
              name="provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AI Provider</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a provider" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                      <SelectItem value="openai">OpenAI (GPT)</SelectItem>
                      <SelectItem value="google">Google (Gemini)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose the AI provider for this agent
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Model selection dropdown - shows models for the selected provider */}
            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a model" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableModels.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose the specific model to use for this agent
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Temperature slider - controls randomness/creativity of responses */}
            <FormField
              control={form.control}
              name="temperature"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Temperature: {field.value.toFixed(2)}
                  </FormLabel>
                  <FormControl>
                    <Slider
                      min={0}
                      max={2}
                      step={0.1}
                      value={[field.value]}
                      onValueChange={(vals) => field.onChange(vals[0])}
                      className="w-full"
                    />
                  </FormControl>
                  <FormDescription>
                    Controls randomness: 0 is focused and deterministic, 2 is more creative and random
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Max tokens input - limits the length of the response */}
            <FormField
              control={form.control}
              name="maxTokens"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Tokens</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={8192}
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Maximum length of the agent's response (1-8192)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit button - validates form and saves configuration */}
            <DialogFooter className="mt-4">
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
