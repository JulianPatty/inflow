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
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

// Zod schema for form validation
// Validates that endpoint is a valid URL and method is one of the allowed HTTP methods
const formSchema = z.object({
  endpoint: z.url({ message: "Please enter a valid URL" }),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  body: z
    .string()
    .optional()
    // .refine() TODO JSON5
});

// Export the form values type for use in other components
export type HttpRequestFormValues = z.infer<typeof formSchema>;

// Props interface for the dialog component
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: z.infer<typeof formSchema>) => void;
  defaultValues?: Partial<HttpRequestFormValues>;
};

// Dialog component for configuring HTTP request settings
// Provides form fields for endpoint URL, HTTP method, and request body
export const HttpRequestDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defaultValues = {},
}: Props) => {
  // Initialize react-hook-form with Zod validation and default values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      endpoint: defaultValues.endpoint || "",
      method: defaultValues.method || "GET",
      body: defaultValues.body || "",
    },
  });

  // Reset form values when dialog opens with new defaults
  // This ensures the form always shows the latest node configuration
  useEffect(() => {
    if (open) {
      form.reset({
        endpoint: defaultValues.endpoint || "",
        method: defaultValues.method || "GET",
        body: defaultValues.body || "",
      });
    }
  }, [open, defaultValues, form]);

  // Watch the method field to conditionally show/hide the body field
  // Body field only appears for POST, PUT, and PATCH requests
  const watchMethod = form.watch("method");
  const showBodyField = ["POST", "PUT", "PATCH"].includes(watchMethod);

  // Handle form submission - call parent's onSubmit callback and close dialog
  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>HTTP Request</DialogTitle>
          <DialogDescription>
            Configure settings for the HTTP Request node.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-8 mt-4"
          >
            {/* HTTP Method dropdown - allows selection of GET, POST, PUT, PATCH, DELETE */}
            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Method</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The HTTP method to use for this request
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Endpoint URL input - supports template variables like {{httpResponse.data.id}} */}
            <FormField
              control={form.control}
              name="endpoint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endpoint URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://api.example.com/users/{{httpResponse.data.id}}"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Static URL or use {"{{variables}}"} for simple values or {"{{json variable}}"} to stringify objects
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Request Body textarea - only shown for POST, PUT, and PATCH methods */}
            {/* Supports JSON with template variables for dynamic values from previous nodes */}
            {showBodyField && (
              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                <FormItem>
                  <FormLabel>Request Body</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={
                        '{\n  "userId": "{{httpResponse.data.id}}",\n  "name": "{{httpResponse.data.name}}",\n  "items": "{{httpResponse.data.items}}"\n}'
                      }
                      className="min-h-[120px] font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    JSON with template variables. Use {"{{variables}}"} for simple values or {"{{json variable}}"} to stringify objects
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
              />
            )}

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