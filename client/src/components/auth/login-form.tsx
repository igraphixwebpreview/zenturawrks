import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import { signIn, signUp } from "@/lib/firebase-auth";
import { useToast } from "@/hooks/use-toast";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type AuthForm = z.infer<typeof authSchema>;

export function LoginForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const form = useForm<AuthForm>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: AuthForm) => {
    setIsLoading(true);
    setError("");

    try {
      if (isSignUp) {
        await signUp(data.email, data.password);
        toast({
          title: "Account created!",
          description: "Welcome to Invoice Generator. You can now start creating invoices.",
        });
      } else {
        await signIn(data.email, data.password);
        toast({
          title: "Welcome back!",
          description: "You've successfully signed in to your account.",
        });
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      
      // Handle Firebase auth errors with user-friendly messages
      const errorMessage = error.code === "auth/user-not-found" 
        ? "No account found with this email address."
        : error.code === "auth/wrong-password"
        ? "Incorrect password. Please try again."
        : error.code === "auth/email-already-in-use"
        ? "An account with this email already exists."
        : error.code === "auth/weak-password"
        ? "Password should be at least 6 characters long."
        : error.code === "auth/invalid-email"
        ? "Please enter a valid email address."
        : "Authentication failed. Please try again.";
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </CardTitle>
          <p className="text-muted-foreground">
            {isSignUp 
              ? "Sign up to start creating professional invoices" 
              : "Sign in to your invoice generator account"
            }
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                {...form.register("email")}
                disabled={isLoading}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  {...form.register("password")}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full btn-modern btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                "Please wait..."
              ) : isSignUp ? (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Account
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </>
              )}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError("");
                  form.reset();
                }}
                disabled={isLoading}
              >
                {isSignUp 
                  ? "Already have an account? Sign in" 
                  : "Don't have an account? Sign up"
                }
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}