import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, LogIn, UserPlus, Facebook as FacebookIcon, Apple as AppleIcon, Mail, ArrowLeft } from "lucide-react";
import { signIn, signUp, sendVerificationEmail, verifyEmail, requestPasswordReset, handleGoogleSignIn, handleFacebookSignIn, handleAppleSignIn, linkGoogleAccount, markLoginAsVerified, signOut } from "@/lib/firebase-auth";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { auth } from "@/lib/firebase";
import { useLocation } from "wouter";
import { WelcomeScreen } from "./welcome-screen";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  displayName: z.string().min(2, "Display name must be at least 2 characters"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const verificationSchema = z.object({
  code: z.string().length(6, "Verification code must be 6 digits"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type AuthForm = z.infer<typeof authSchema>;
type SignInForm = z.infer<typeof signInSchema>;
type VerificationForm = z.infer<typeof verificationSchema>;
type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export function LoginForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showEmailPasswordForm, setShowEmailPasswordForm] = useState(false);
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [showForgotPasswordForm, setShowForgotPasswordForm] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [showGoogleLinkForm, setShowGoogleLinkForm] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const { toast } = useToast();
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordMatch, setPasswordMatch] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'sent' | 'verified' | 'error'>('pending');
  const [verificationCheckInterval, setVerificationCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const [, setLocation] = useLocation();
  const [isSuspiciousSignIn, setIsSuspiciousSignIn] = useState(false);
  const [suspiciousSignInEmail, setSuspiciousSignInEmail] = useState("");
  const [showSuspiciousSignInModal, setShowSuspiciousSignInModal] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCooldown, setVerificationCooldown] = useState(0);
  const [lastVerificationAttempt, setLastVerificationAttempt] = useState<number>(0);
  const [showWelcome, setShowWelcome] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [signInMethod, setSignInMethod] = useState<'email' | 'google' | 'facebook' | 'apple'>('email');

  const form = useForm<AuthForm | SignInForm>({
    resolver: zodResolver(isSignUp ? authSchema : signInSchema),
    defaultValues: isSignUp ? {
      email: "",
      displayName: "",
      password: "",
      confirmPassword: "",
    } : {
      email: "",
      password: "",
    },
  });

  const verificationForm = useForm<VerificationForm>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      code: "",
    },
  });

  const forgotPasswordForm = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 20;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 20;
    if (/[^A-Za-z0-9]/.test(password)) strength += 20;
    return strength;
  };

  const getPasswordStrengthColor = (strength: number) => {
    if (strength <= 20) return "bg-red-500";
    if (strength <= 40) return "bg-orange-500";
    if (strength <= 60) return "bg-yellow-500";
    if (strength <= 80) return "bg-blue-500";
    return "bg-green-500";
  };

  const getPasswordStrengthText = (strength: number) => {
    if (strength <= 20) return "Very Weak";
    if (strength <= 40) return "Weak";
    if (strength <= 60) return "Medium";
    if (strength <= 80) return "Strong";
    return "Very Strong";
  };

  const onPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    form.register("password").onChange(e);
    const newPassword = e.target.value;
    setPasswordStrength(calculatePasswordStrength(newPassword));
    // Update password match feedback if confirm password has content
    const confirmPasswordValue = form.getValues("confirmPassword");
    if (confirmPasswordValue) {
      setPasswordMatch(newPassword === confirmPasswordValue);
    } else {
      // If confirm password is empty, still check match if password field loses focus later
      setPasswordMatch(newPassword === confirmPasswordValue);
    }
  };

  const onConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    form.register("confirmPassword").onChange(e);
    const confirmPasswordValue = e.target.value;
    const passwordValue = form.getValues("password");
    // Update password match feedback
    setPasswordMatch(confirmPasswordValue === passwordValue);
  };

  const onSubmit = async (data: AuthForm | SignInForm) => {
    console.log("onSubmit called");
    setIsLoading(true);
    setError("");

    try {
      if (isSignUp) {
        const signUpData = data as AuthForm;
        // Attempt to sign up the user
        const user = await signUp(signUpData.email, signUpData.password, signUpData.displayName);
        setIsNewUser(true);
        setSignInMethod('email');

        // If signup is successful, send verification email
        await sendVerificationEmail();
        
        // Reset form fields after successful signup
        form.reset();

        // Show success toast
        toast({
          title: "Account Created!",
          description: "Please verify your email to continue.",
        });

        // Redirect to verification page
        setLocation("/verify-email");

      } else {
        const signInData = data as SignInForm;
        console.log("Attempting to sign in with email:", signInData.email);
        const { user, isSuspicious, isFirstLoginAttempt } = await signIn(signInData.email, signInData.password);
        setIsNewUser(false);
        setSignInMethod('email');
        console.log("Sign-in response:", { user: user.uid, isSuspicious, isFirstLoginAttempt });

        // Check if the user's email is verified
        if (user && !user.emailVerified) {
          console.log("User email not verified. Redirecting to verification page.");
          
          toast({
            title: "Email Not Verified",
            description: "Please verify your email address to continue.",
            variant: "destructive"
          });

          // Redirect to verification page
          setLocation("/verify-email");
        } else if (user && user.emailVerified) {
          // Email is verified. Now check for suspicious sign-in, BUT exclude the very first login attempt.
          if (isSuspicious && !isFirstLoginAttempt) {
            console.log("Suspicious sign-in detected (and not the first login). Starting verification process...");
            try {
              // Send verification email with rate limiting
              console.log("Sending verification email...");
              await sendVerificationEmailWithRateLimit();
              console.log("Verification email sent successfully");
              
              // Show the modal
              console.log("Showing suspicious sign-in modal...");
              setIsSuspiciousSignIn(true);
              setSuspiciousSignInEmail(user.email || "");
              setShowSuspiciousSignInModal(true);
              setVerificationSent(true);
              console.log("Suspicious sign-in modal shown");

              // Show warning toast
              toast({
                title: "Suspicious Sign-in Detected",
                description: "For your security, please verify this sign-in attempt via email.",
                variant: "destructive"
              });
            } catch (error: any) {
              console.error("Error in suspicious sign-in process:", error);
              toast({
                title: "Error",
                description: error.message || "Failed to send verification email. Please try again.",
                variant: "destructive"
              });
            }
          } else {
            console.log("Sign-in not suspicious (or it is the first login). Proceeding with normal login.");
            // If email is verified and not suspicious (or it's the first login), proceed to dashboard
            setShowWelcome(true);
            toast({
              title: "Welcome back!",
              description: "You've successfully signed in to your account.",
            });
          }
        } else {
          console.log("Sign-in failed or user object is null.", user);
          setError("Sign-in failed. Please try again.");
        }
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      // Log the full error object for debugging
      console.error("Full error details:", JSON.stringify(error, null, 2));

      let errorMessage = "";
      
      if (isSignUp) {
        errorMessage = "Account creation failed. Please try again.";
        if (error.code === "auth/email-already-in-use") {
          errorMessage = "An account with this email already exists. Please sign in instead.";
        } else if (error.code === "auth/weak-password") {
          errorMessage = "Password should be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.";
        } else if (error.code === "auth/invalid-email") {
          errorMessage = "Please enter a valid email address.";
        }
      } else {
        // Sign-in specific error messages
        errorMessage = "Login failed. Please check your credentials or create an account.";
        if (error.code === "auth/user-not-found") {
          errorMessage = "No account found with this email. Please check the email or create a new account.";
        } else if (error.code === "auth/wrong-password") {
          errorMessage = "Incorrect password. Please try again or use 'Forgot Password' to reset it.";
        } else if (error.code === "auth/invalid-email") {
          errorMessage = "Please enter a valid email address.";
        } else if (error.code === "auth/too-many-requests") {
          errorMessage = "Too many failed login attempts. Please try again later or reset your password.";
        } else if (error.code === "auth/account-exists-with-different-credential") {
          errorMessage = "An account already exists with this email using a different sign-in method.";
        }
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const onVerificationSubmit = async (data: VerificationForm) => {
    setIsLoading(true);
    setError("");

    try {
      await verifyEmail(data.code);
      
      if (isSuspiciousSignIn) {
        // Get the user's IP address
        const response = await fetch('https://api.ipify.org?format=json');
        const { ip } = await response.json();
        
        // Mark the login as verified
        if (auth.currentUser) {
          await markLoginAsVerified(auth.currentUser.uid, ip);
        }
        
        toast({
          title: "Device Verified!",
          description: "Your device has been verified. You can now sign in securely.",
        });
        
        setIsSuspiciousSignIn(false);
        setShowVerificationForm(false);
        setShowEmailPasswordForm(false);
      } else {
        toast({
          title: "Email verified!",
          description: "Your account has been successfully verified.",
        });
        setShowVerificationForm(false);
        setIsSignUp(false);
        setShowEmailPasswordForm(false);
      }
    } catch (error: any) {
      setError("Invalid verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignInClick = async () => {
    setIsLoading(true);
    setError("");

    try {
      const { isNewUser, user } = await handleGoogleSignIn();
      setIsNewUser(isNewUser);
      setSignInMethod('google');
      
      if (isNewUser) {
        // For new users, show the welcome screen
        setShowWelcome(true);
        toast({
          title: "Account created!",
          description: "Welcome to InvoiceGen! Let's get you started.",
        });
      } else {
        // For returning users, redirect to dashboard
        setShowWelcome(true);
        toast({
          title: "Welcome back!",
          description: "You've successfully signed in to your account.",
        });
      }
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      setError("Google sign-in failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const onGoogleLinkSubmit = async (data: AuthForm) => {
    setIsLoading(true);
    setError("");

    try {
      await linkGoogleAccount(data.email, data.password);
      toast({
        title: "Account linked!",
        description: "Your Google account has been linked with email/password login.",
      });
      setShowGoogleLinkForm(false);
    } catch (error: any) {
      console.error("Account linking error:", error);
      setError("Failed to link account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const onForgotPasswordSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    setError("");

    try {
      await requestPasswordReset(data.email);
      toast({
        title: "Password reset email sent!",
        description: "Please check your email for instructions to reset your password.",
      });
      setShowForgotPasswordForm(false);
      setShowEmailPasswordForm(false);
    } catch (error: any) {
      console.error("Password reset error:", error);
      setError("Failed to send password reset email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookSignInClick = async () => {
    setIsLoading(true);
    setError("");

    try {
      const { isNewUser, user } = await handleFacebookSignIn();
      setIsNewUser(isNewUser);
      setSignInMethod('facebook');
      
      if (isNewUser) {
        setShowWelcome(true);
        toast({
          title: "Account created!",
          description: "Welcome to InvoiceGen! Let's get you started.",
        });
      } else {
        setShowWelcome(true);
        toast({
          title: "Welcome back!",
          description: "You've successfully signed in to your account.",
        });
      }
    } catch (error: any) {
      console.error("Facebook sign-in error:", error);
      setError("Facebook sign-in failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignInClick = async () => {
    setIsLoading(true);
    setError("");

    try {
      const { isNewUser, user } = await handleAppleSignIn();
      setIsNewUser(isNewUser);
      setSignInMethod('apple');
      
      if (isNewUser) {
        setShowWelcome(true);
        toast({
          title: "Account created!",
          description: "Welcome to InvoiceGen! Let's get you started.",
        });
      } else {
        setShowWelcome(true);
        toast({
          title: "Welcome back!",
          description: "You've successfully signed in to your account.",
        });
      }
    } catch (error: any) {
      console.error("Apple sign-in error:", error);
      setError("Apple sign-in failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setIsLoading(true);
      await sendVerificationEmail();
      setResendCooldown(60); // 60 seconds cooldown
      setVerificationStatus('sent');
      toast({
        title: "Verification Email Sent",
        description: "Please check your inbox for the verification link.",
      });
      
      // Start countdown
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      setVerificationStatus('error');
      toast({
        title: "Error",
        description: "Failed to send verification email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkVerificationStatus = async () => {
    if (!auth.currentUser) return;
    
    try {
      // Reload the user to get the latest email verification status
      await auth.currentUser.reload();
      
      if (auth.currentUser.emailVerified) {
        setVerificationStatus('verified');
        if (verificationCheckInterval) {
          clearInterval(verificationCheckInterval);
          setVerificationCheckInterval(null);
        }
        
        toast({
          title: "Email Verified!",
          description: "Your email has been successfully verified. You can now sign in.",
        });
        
        // Wait a moment before redirecting to sign in
        setTimeout(() => {
          setShowVerificationForm(false);
          setShowEmailPasswordForm(true);
        }, 2000);
      }
    } catch (error) {
      console.error("Error checking verification status:", error);
    }
  };

  const handleVerificationComplete = async () => {
    console.log("Starting device verification process...");
    try {
      // Get current IP
      console.log("Fetching current IP address...");
      const response = await fetch('https://api.ipify.org?format=json');
      const { ip } = await response.json();
      console.log("Current IP:", ip);
      
      // Mark as verified
      if (auth.currentUser) {
        console.log("Marking login as verified for user:", auth.currentUser.uid);
        await markLoginAsVerified(auth.currentUser.uid, ip);
        console.log("Login marked as verified successfully");
      } else {
        console.log("No authenticated user found for verification");
      }
      
      // Close modal and show success
      console.log("Closing verification modal and showing success message...");
      setShowSuspiciousSignInModal(false);
      setIsSuspiciousSignIn(false);
      setVerificationSent(false);
      
      toast({
        title: "Device Verified!",
        description: "Your device has been verified. You can now continue using your account.",
      });
      console.log("Device verification process completed successfully");

      // Redirect to home page
      setLocation("/");
    } catch (error) {
      console.error("Error in device verification process:", error);
      toast({
        title: "Error",
        description: "Failed to verify device. Please try again.",
        variant: "destructive"
      });
    }
  };

  const sendVerificationEmailWithRateLimit = async () => {
    const now = Date.now();
    const timeSinceLastAttempt = now - lastVerificationAttempt;
    
    // If less than 60 seconds have passed since last attempt
    if (timeSinceLastAttempt < 60000) {
      const remainingTime = Math.ceil((60000 - timeSinceLastAttempt) / 1000);
      setVerificationCooldown(remainingTime);
      throw new Error(`Please wait ${remainingTime} seconds before requesting another verification email.`);
    }
    
    try {
      await sendVerificationEmail();
      setLastVerificationAttempt(now);
      setVerificationCooldown(60);
      
      // Start countdown
      const timer = setInterval(() => {
        setVerificationCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return true;
    } catch (error: any) {
      if (error.code === 'auth/too-many-requests') {
        setVerificationCooldown(60);
        throw new Error('Too many verification attempts. Please wait 60 seconds before trying again.');
      }
      throw error;
    }
  };

  useEffect(() => {
    if (showVerificationForm && !verificationCheckInterval) {
      // Check immediately
      checkVerificationStatus();
      
      // Then check every 5 seconds
      const interval = setInterval(checkVerificationStatus, 5000);
      setVerificationCheckInterval(interval);
      
      // Cleanup on unmount
      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    }
  }, [showVerificationForm]);

  if (showWelcome) {
    return <WelcomeScreen isNewUser={isNewUser} signInMethod={signInMethod} />;
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4 md:p-8">
      {showSuspiciousSignInModal && (
        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="text-center space-y-4">
            <Mail className="mx-auto h-12 w-12 text-primary" />
            <h2 className="text-2xl font-bold">Verify Your Device</h2>
            <p className="text-muted-foreground">
              We've detected a sign-in attempt from a new device or location. To ensure your account's security, please verify this sign-in attempt.
            </p>
            <p className="text-sm text-muted-foreground">
              We've sent a verification email to <span className="font-semibold">{suspiciousSignInEmail}</span>. 
              Please check your inbox and click the verification link to confirm this sign-in attempt.
            </p>
            <p className="text-sm text-muted-foreground">
              If you don't receive the email within a few minutes, please check your spam folder.
            </p>
            
            {/* Verification Status */}
            <div className="mt-4">
              <div className="flex items-center justify-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  verificationSent ? 'bg-green-500' : 'bg-yellow-500'
                }`} />
                <span className="text-sm font-medium">
                  {verificationSent ? 'Verification Email Sent' : 'Waiting for Verification'}
                </span>
              </div>
            </div>

            {/* Resend Button */}
            <div className="mt-6 space-y-4">
              <Button
                variant="outline"
                className="w-full h-12 text-base rounded-xl flex items-center justify-center gap-2 border-gray-300 hover:bg-gray-100"
                onClick={async () => {
                  try {
                    await sendVerificationEmailWithRateLimit();
                    toast({
                      title: "Verification Email Sent",
                      description: "Please check your inbox for the verification link.",
                    });
                  } catch (error: any) {
                    toast({
                      title: "Error",
                      description: error.message,
                      variant: "destructive"
                    });
                  }
                }}
                disabled={verificationCooldown > 0}
              >
                {verificationCooldown > 0 
                  ? `Resend in ${verificationCooldown}s` 
                  : "Resend Verification Email"}
              </Button>
              
              <Button
                variant="ghost"
                className="w-full h-12 text-base rounded-xl flex items-center justify-center gap-2"
                onClick={() => {
                  setShowSuspiciousSignInModal(false);
                  setVerificationSent(false);
                }}
              >
                <ArrowLeft className="h-5 w-5" />
                Back to Sign In
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col-reverse md:flex-row w-full max-w-5xl h-full md:h-[80vh] rounded-3xl overflow-hidden bg-white/90 backdrop-blur-xl border border-gray-200 items-stretch mx-auto">
        {/* Left: Artwork */}
        <div className="hidden md:flex md:w-1/2 items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/10 relative h-[40vh] md:h-auto rounded-l-3xl">
          <img src="/1_4_rectangle.png" alt="Artwork" className="object-cover w-full h-full z-0 rounded-b-3xl md:rounded-b-none md:rounded-l-3xl" />
        </div>
        {/* Right: Logo + Form */}
        <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 md:p-12 h-full rounded-r-3xl">
          <div className="flex flex-col justify-center items-center w-full h-full">
            <img src="/logo.png" alt="Logo" className="object-contain mb-8" style={{ width: '220px', height: '60px' }} />
            
            {/* Conditional Title and Subtitle */}
            {showForgotPasswordForm ? (
              <>
                <h1 className="text-3xl font-extrabold tracking-tight mb-2 text-primary">Reset your password</h1>
                <p className="text-lg text-muted-foreground font-medium mb-8">Enter your email address and we'll send you a link to reset your password.</p>
              </>
            ) : isSignUp ? (
              <>
                <h1 className="text-3xl font-extrabold tracking-tight mb-2 text-primary">Create a new account</h1>
                <p className="text-lg text-muted-foreground font-medium mb-8">Already have an account? <Button type="button" variant="link" onClick={() => { setIsSignUp(false); setShowEmailPasswordForm(false); }} className="text-primary text-lg p-0 h-auto">Sign in</Button></p>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-extrabold tracking-tight mb-2 text-primary">Sign in to your account</h1>
                <p className="text-lg text-muted-foreground font-medium mb-8">Don't have an account? <Button type="button" variant="link" onClick={() => { setIsSignUp(true); setShowEmailPasswordForm(false); }} className="text-primary text-lg p-0 h-auto">Join here</Button></p>
              </>
            )}

            <div className="w-full max-w-md">
              {showVerificationForm ? (
                <div className="space-y-6">
                   {error && (
                     <Alert variant="destructive">
                       <AlertDescription>{error}</AlertDescription>
                     </Alert>
                   )}
                   <div className="text-center space-y-4">
                     <Mail className="mx-auto h-12 w-12 text-primary" />
                     <h2 className="text-2xl font-bold">Verify Your Email Address</h2>
                     <p className="text-muted-foreground">
                       We have sent a verification link to <span className="font-semibold">{verificationEmail}</span>. 
                       Please check your inbox and click the link to activate your account.
                     </p>
                     <p className="text-sm text-muted-foreground">
                       If you don't receive the email within a few minutes, please check your spam folder.
                     </p>
                     
                     {/* Verification Status */}
                     <div className="mt-4">
                       <div className="flex items-center justify-center gap-2">
                         <div className={`w-3 h-3 rounded-full ${
                           verificationStatus === 'verified' ? 'bg-green-500' :
                           verificationStatus === 'sent' ? 'bg-blue-500' :
                           verificationStatus === 'error' ? 'bg-red-500' :
                           'bg-yellow-500'
                         }`} />
                         <span className="text-sm font-medium">
                           {verificationStatus === 'verified' ? 'Email Verified' :
                            verificationStatus === 'sent' ? 'Verification Email Sent' :
                            verificationStatus === 'error' ? 'Error Sending Email' :
                            'Waiting for Verification'}
                         </span>
                       </div>
                     </div>

                     {/* Resend Button */}
                     <div className="mt-6 space-y-4">
                       <Button
                         variant="outline"
                         className="w-full h-12 text-base rounded-xl flex items-center justify-center gap-2"
                         onClick={handleResendVerification}
                         disabled={isLoading || resendCooldown > 0}
                       >
                         {isLoading ? (
                           "Sending..."
                         ) : resendCooldown > 0 ? (
                           `Resend in ${resendCooldown}s`
                         ) : (
                           "Resend Verification Email"
                         )}
                       </Button>
                       
                       <Button
                         variant="ghost"
                         className="w-full h-12 text-base rounded-xl flex items-center justify-center gap-2"
                         onClick={() => { setShowVerificationForm(false); setShowEmailPasswordForm(true); }}
                         disabled={isLoading}
                       >
                         <ArrowLeft className="h-5 w-5" />
                         Back to Sign In
                       </Button>
                     </div>
                   </div>
                </div>
              ) : showGoogleLinkForm ? (
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                   {error && (
                     <Alert variant="destructive">
                       <AlertDescription>{error}</AlertDescription>
                     </Alert>
                   )}
                   <div className="space-y-3">
                     <Label htmlFor="email" className="text-base font-semibold">Email</Label>
                     <Input
                       id="email"
                       type="email"
                       value={googleEmail}
                       disabled
                       className="h-14 text-lg px-4 rounded-xl bg-white focus:bg-white focus:ring-2 focus:ring-primary focus:ring-inset focus:outline-none"
                     />
                   </div>
                   <div className="space-y-3">
                     <Label htmlFor="password" className="text-base font-semibold">Create Password</Label>
                     <div className="relative">
                       <Input
                         id="password"
                         type={showPassword ? "text" : "password"}
                         placeholder="Enter a password"
                         {...form.register("password")}
                         disabled={isLoading}
                         className="h-14 text-lg px-4 rounded-xl pr-12 bg-white focus:bg-white focus:ring-2 focus:ring-primary focus:ring-inset focus:outline-none"
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
                           <EyeOff className="h-5 w-5" />
                         ) : (
                           <Eye className="h-5 w-5" />
                         )}
                       </Button>
                     </div>
                     {form.formState.errors.password && (
                       <p className="text-sm text-destructive">
                         {form.formState.errors.password.message}
                       </p>
                     )}
                   </div>
                   <div className="flex flex-col gap-4">
                     <Button
                       type="submit"
                       className="w-full h-14 text-lg rounded-xl btn-modern btn-primary mt-2"
                       disabled={isLoading}
                     >
                       {isLoading ? "Setting up..." : "Set Password"}
                     </Button>
                     <Button
                       type="button"
                       variant="ghost"
                       className="w-full h-12 text-base rounded-xl flex items-center justify-center gap-2"
                       onClick={() => setShowGoogleLinkForm(false)}
                       disabled={isLoading}
                     >
                       Skip for now
                     </Button>
                   </div>
                </form>
              ) : showForgotPasswordForm ? (
                <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} className="space-y-6">
                   {error && (
                     <Alert variant="destructive">
                       <AlertDescription>{error}</AlertDescription>
                     </Alert>
                   )}
                   <div className="space-y-3">
                     <Label htmlFor="email" className="text-base font-semibold">Email address</Label>
                     <Input
                       id="email"
                       type="email"
                       placeholder="Enter your email"
                       {...forgotPasswordForm.register("email")}
                       disabled={isLoading}
                       className="h-14 text-lg px-4 rounded-xl bg-white focus:bg-white focus:ring-2 focus:ring-primary focus:ring-inset focus:outline-none"
                     />
                     {forgotPasswordForm.formState.errors.email && (
                       <p className="text-sm text-destructive">
                         {forgotPasswordForm.formState.errors.email.message}
                       </p>
                     )}
                   </div>
                   <div className="flex flex-col gap-4">
                     <Button
                       type="submit"
                       className="w-full h-14 text-lg rounded-xl btn-modern btn-primary mt-2"
                       disabled={isLoading}
                     >
                       {isLoading ? "Sending..." : "Send Reset Link"}
                     </Button>
                     <Button
                       type="button"
                       variant="ghost"
                       className="w-full h-12 text-base rounded-xl flex items-center justify-center gap-2"
                       onClick={() => { setShowForgotPasswordForm(false); setShowEmailPasswordForm(true); }}
                       disabled={isLoading}
                     >
                       <ArrowLeft className="h-5 w-5" />
                       Back to Sign In
                     </Button>
                   </div>
                </form>
              ) : !showEmailPasswordForm ? (
                <div className="flex flex-col gap-4 p-4">
                   <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 text-base rounded-xl flex items-center justify-center gap-2 border-gray-300 hover:bg-gray-100"
                    onClick={handleGoogleSignInClick}
                    disabled={isLoading}
                  >
                    <span className="inline-block align-middle">
                      <svg width="22" height="22" viewBox="0 0 48 48"><g><path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.23l6.85-6.85C35.82 2.36 30.28 0 24 0 14.82 0 6.73 5.06 2.69 12.44l7.98 6.2C12.13 13.13 17.62 9.5 24 9.5z"/><path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.22-.42-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.65 7.01l7.19 5.59C43.98 37.13 46.1 31.36 46.1 24.55z"/><path fill="#FBBC05" d="M10.67 28.65c-1.01-2.99-1.01-6.31 0-9.3l-7.98-6.2C.99 17.1 0 20.44 0 24c0 3.56.99 6.9 2.69 10.09l7.98-6.2z"/><path fill="#EA4335" d="M24 48c6.28 0 11.56-2.08 15.41-5.59l-7.19-5.59c-2.01 1.35-4.59 2.15-8.22 2.15-6.38 0-11.87-3.63-14.33-8.89l-7.98 6.2C6.73 42.94 14.82 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></g></svg>
                    </span>
                    Continue with Google
                  </Button>
                   <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 text-base rounded-xl flex items-center justify-center gap-2 border-gray-300 hover:bg-gray-100"
                    onClick={() => setShowEmailPasswordForm(true)}
                    disabled={isLoading}
                  >
                    <Mail className="h-5 w-5 mr-2" />
                    Continue with email/username
                  </Button>

                   {/* OR Separator */}
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="bg-white/90 backdrop-blur-md px-2 text-gray-500">OR</span>
                    </div>
                  </div>

                  {/* Apple and Facebook - side by side on desktop, stacked on mobile */}
                  <div className="flex flex-col md:flex-row gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-12 text-base rounded-xl flex items-center justify-center gap-2 border-gray-300 hover:bg-gray-100"
                      onClick={handleAppleSignInClick}
                      disabled={isLoading}
                    >
                      <img src="/apple.svg" alt="Apple Logo" className="h-5 w-5" />
                      Apple
                    </Button>
                     <Button
                      type="button"
                      variant="outline"
                      className="w-full h-12 text-base rounded-xl flex items-center justify-center gap-2 border-gray-300 hover:bg-gray-100"
                      onClick={handleFacebookSignInClick}
                      disabled={isLoading}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="h-5 w-5"><path d="M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.79l-11 71.69h-57.79V501C413.31 482.38 504 379.78 504 256z" fill="#1877F2"/></svg>
                      Facebook
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="max-h-[60vh] overflow-y-auto p-4">
                  {/* Temporarily using a simple onSubmit to test if the form submits */}
                  <form onSubmit={(e) => { 
                    console.log("Native form submit event triggered for email/password form!"); 
                    form.handleSubmit(
                      (data) => { console.log("Form validation passed, calling onSubmit with data:", data); onSubmit(data); },
                      (errors) => { console.error("Form validation failed:", errors); }
                    )(e); 
                  }} className="space-y-6">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    <div className="space-y-3">
                      <Label htmlFor="email" className="text-base font-semibold">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        {...form.register("email")}
                        disabled={isLoading}
                        className="h-14 text-lg px-4 rounded-xl bg-white focus:bg-white focus:ring-2 focus:ring-primary focus:ring-inset focus:outline-none"
                      />
                      {form.formState.errors.email && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    {isSignUp && (
                      <div className="space-y-3">
                        <Label htmlFor="displayName" className="text-base font-semibold">Display Name</Label>
                        <Input
                          id="displayName"
                          type="text"
                          placeholder="Enter your display name"
                          {...form.register("displayName" as keyof AuthForm)}
                          disabled={isLoading}
                          className="h-14 text-lg px-4 rounded-xl bg-white focus:bg-white focus:ring-2 focus:ring-primary focus:ring-inset focus:outline-none"
                        />
                        {isSignUp && (form.formState.errors as any).displayName && (
                          <p className="text-sm text-destructive">
                            {(form.formState.errors as any).displayName.message}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="space-y-3">
                      <Label htmlFor="password" className="text-base font-semibold">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          {...form.register("password")}
                          disabled={isLoading}
                          className="h-14 text-lg px-4 rounded-xl pr-12 bg-white focus:bg-white focus:ring-2 focus:ring-primary focus:ring-inset focus:outline-none"
                          onChange={onPasswordChange}
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
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                      {isSignUp && (
                        <div className="space-y-2">
                          <Progress value={passwordStrength} className={`h-2 ${getPasswordStrengthColor(passwordStrength)}`} />
                          <p className="text-sm text-muted-foreground">
                            Password strength: {getPasswordStrengthText(passwordStrength)}
                          </p>
                        </div>
                      )}
                      {form.formState.errors.password && (
                        <p className="text-sm text-destructive">
                          {form.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    {isSignUp && (
                      <div className="space-y-3">
                        <Label htmlFor="confirmPassword" className="text-base font-semibold">Confirm Password</Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showPassword ? "text" : "password"}
                            placeholder="Confirm your password"
                            {...form.register("confirmPassword" as keyof AuthForm)}
                            disabled={isLoading}
                            className="h-14 text-lg px-4 rounded-xl pr-12 bg-white focus:bg-white focus:ring-2 focus:ring-primary focus:ring-inset focus:outline-none"
                            onChange={onConfirmPasswordChange}
                          />
                        </div>
                        {isSignUp && (form.formState.dirtyFields.password || (form.formState.dirtyFields as any).confirmPassword) && (
                          <p className={`text-sm ${passwordMatch ? "text-green-600" : "text-destructive"}`}>
                            {passwordMatch ? "Passwords match" : "Passwords do not match"}
                          </p>
                        )}
                        {isSignUp && (form.formState.errors as any).confirmPassword && (
                          <p className="text-sm text-destructive">
                            {(form.formState.errors as any).confirmPassword.message}
                          </p>
                        )}
                      </div>
                    )}

                    {!isSignUp && (
                      <div className="text-right text-sm mt-2">
                        <Button 
                          type="button" 
                          variant="link" 
                          className="p-0 h-auto text-muted-foreground hover:text-primary"
                          onClick={() => {
                            setShowForgotPasswordForm(true);
                            setShowEmailPasswordForm(false);
                          }}
                        >
                          Forgot password?
                        </Button>
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full h-14 text-lg rounded-xl btn-modern btn-primary mt-2"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        "Please wait..."
                      ) : isSignUp ? (
                        "Create Account"
                      ) : (
                        <>
                          <LogIn className="h-5 w-5 mr-2" />
                          Sign In
                        </>
                      )}
                    </Button>
                  </form>
                </div>
              )}

              {/* Terms and Privacy Notice - Placed outside the conditional form rendering */}
              <p className="text-sm text-muted-foreground text-center mt-4">
                By signing up, you agree to Zentura's{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto text-primary hover:text-primary/80"
                  onClick={() => window.open('/terms', '_blank')}
                >
                  Terms of Service
                </Button>{" "}
                and consent to receive occasional emails from us. For details on how we handle your personal information, please review our{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto text-primary hover:text-primary/80"
                  onClick={() => window.open('/privacy', '_blank')}
                >
                  Privacy Policy
                </Button>{" "}
                .
              </p>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}