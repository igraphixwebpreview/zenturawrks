import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, ArrowLeft } from "lucide-react";
import { verifyEmail, sendVerificationEmail, markLoginAsVerified } from "@/lib/firebase-auth";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { useLocation } from "wouter";
import { WelcomeScreen } from "./welcome-screen";

const verificationSchema = z.object({
  code: z.string().length(6, "Verification code must be 6 digits"),
});

type VerificationForm = z.infer<typeof verificationSchema>;

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  isSuspiciousSignIn?: boolean;
}

export function VerificationModal({ isOpen, onClose, email, isSuspiciousSignIn = false }: VerificationModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'sent' | 'verified' | 'error'>('pending');
  const [verificationCheckInterval, setVerificationCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [, setLocation] = useLocation();
  const [showWelcome, setShowWelcome] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [signInMethod, setSignInMethod] = useState<'email' | 'google' | 'facebook' | 'apple'>('email');

  const { toast } = useToast();

  const form = useForm<VerificationForm>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      code: "",
    },
  });

  const onSubmit = async (data: VerificationForm) => {
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
        
        // Show welcome screen
        setShowWelcome(true);
        setLocation("/");
      } else {
        toast({
          title: "Email verified!",
          description: "Your account has been successfully verified.",
        });
        
        // Show welcome screen
        setShowWelcome(true);
        setLocation("/");
      }
    } catch (error: any) {
      setError("Invalid verification code. Please try again.");
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
          description: "Your email has been successfully verified.",
        });
        
        // Show welcome screen
        setShowWelcome(true);
        setLocation("/");
      }
    } catch (error) {
      console.error("Error checking verification status:", error);
    }
  };

  useEffect(() => {
    if (isOpen && !verificationCheckInterval) {
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
  }, [isOpen]);

  if (showWelcome) {
    return <WelcomeScreen isNewUser={isNewUser} signInMethod={signInMethod} />;
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
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
              We have sent a verification link to <span className="font-semibold">{email}</span>. 
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
                onClick={onClose}
                disabled={isLoading}
              >
                <ArrowLeft className="h-5 w-5" />
                Back to Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 