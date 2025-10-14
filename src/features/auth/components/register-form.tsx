"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { refine, z } from "zod";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";


export const registerSchema = z.object({
   email: z.email("Please Enter a valid email"),
   password: z.string().min(1, "Password is required"),
   confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
   path: ["confirmPassword"],
   message: "Passwords do not match",
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
   const router = useRouter();

   const form = useForm<RegisterFormValues>({
      resolver: zodResolver(registerSchema),
      defaultValues: {
         email: "",
         password: "",
         confirmPassword: "",
      },
   });
   


   const onSubmit = async (values: RegisterFormValues) => {
      await authClient.signUp.email(
         {
            name: values.email,
            email: values.email,
            password: values.password,
            callbackURL: "/",
         },
         {
            onSuccess: () => {
               router.push("/");
         },
         onError: (ctx) => {
            toast.error(ctx.error.message);
         },
         }
      );
      // TODO: Implement authentication logic here
      // Example: await authClient.signIn.email({ email: values.email, password: values.password });
   };

   const handleGoogleLogin = async () => {
      // TODO: Implement Google OAuth login
      // Example: await authClient.signIn.social({ provider: "google" });
   };

   const handleGithubLogin = async () => {
      // TODO: Implement GitHub OAuth login
      // Example: await authClient.signIn.social({ provider: "github" });
   };

   const isPending = form.formState.isSubmitting;

   return (
      <Card className="w-full max-w-md">
         <CardHeader>
            <div className="flex flex-col gap-2 text-center">
            <CardTitle>Get Started</CardTitle>
            <CardDescription>Create an Account to Get Started</CardDescription>
            </div>
         </CardHeader>
         <CardContent>
            <div className="space-y-4">
               <div className="flex flex-col gap-2">
                  <Button
                     type="button"
                     variant="outline"
                     className="w-full"
                     // onClick={handleGoogleLogin}
                  >
                     <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path
                           d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                           fill="#4285F4"
                        />
                        <path
                           d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                           fill="#34A853"
                        />
                        <path
                           d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                           fill="#FBBC05"
                        />
                        <path
                           d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                           fill="#EA4335"
                        />
                     </svg>
                     Continue with Google
                  </Button>
                  <Button
                     type="button"
                     variant="outline"
                     className="w-full"
                     // onClick={handleGithubLogin}
                  >
                     <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                     </svg>
                     Continue with GitHub
                  </Button>
               </div>

               <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                     <Separator />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                     <span className="bg-background px-2 text-muted-foreground">
                        Or continue with email
                     </span>
                  </div>
               </div>

               <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                     control={form.control}
                     name="email"
                     render={({ field }) => (
                        <FormItem>
                           <FormLabel>Email</FormLabel>
                           <FormControl>
                              <Input type="email" placeholder="Enter your email" {...field} />
                           </FormControl>
                           <FormMessage />
                        </FormItem>
                     )}
                  />
                  <FormField
                     control={form.control}
                     name="password"
                     render={({ field }) => (
                        <FormItem>
                           <FormLabel>Password</FormLabel>
                           <FormControl>
                              <Input type="password" placeholder="Enter your password" {...field} />
                           </FormControl>
                           <FormMessage />
                        </FormItem>
                           
                        
                     )}
                  />
                  <FormField
                     control={form.control}
                     name="confirmPassword"
                     render={({ field }) => (
                        <FormItem>
                           <FormLabel>Confirm Password</FormLabel>
                           <FormControl>
                              <Input type="password" placeholder="Enter your confirm password" {...field} />
                           </FormControl>
                           <FormMessage />
                        </FormItem>
                     )}
                  />
                  <Button 
                  onClick={() => form.handleSubmit(onSubmit)}
                  type="submit" 
                  className="w-full" 
                  disabled={isPending}>
                     {isPending ? "Creating account..." : "Create Account"}
                  </Button>

                  <div className="text-center text-sm">
                     Already have an account? {" "}
                     <Link href="/login" className="text-primary underline-offset-4 underline ">Sign In
                     </Link>
                  </div>
               </form>
            </Form>
            </div>
         </CardContent>
      </Card>
   );
};