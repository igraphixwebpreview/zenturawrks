import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { sendVerificationEmail, checkSuspiciousSignIn, isIPVerified as checkIsIPVerified, markLoginAsVerified } from "@/lib/firebase-auth";
import { useToast } from "@/hooks/use-toast";
import { Mail, ArrowLeft, RefreshCw, Shield } from "lucide-react";
import { auth } from "@/lib/firebase";

export default function VerifyEmailPage() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isSuspicious, setIsSuspicious] = useState(false);
  const [isIPVerified, setIsIPVerified] = useState(false);

  // Check initial status
  useEffect(() => {
    const checkStatus = async () => {
      if (!user || loading) return;

      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const { ip } = await response.json();

        const suspicious = await checkSuspiciousSignIn(user.uid, ip);
        setIsSuspicious(suspicious);

        const verified = await checkIsIPVerified(user.uid, ip);
        setIsIPVerified(verified);
      } catch (error) {
        console.error("Error checking status:", error);
      }
    };

    checkStatus();
  }, [user, loading]);

  // Handle resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [resendCooldown]);

  const handleResendVerification = async () => {
    try {
      setIsResending(true);
      await sendVerificationEmail();
      setResendCooldown(60); // 60 seconds cooldown

      toast({
        title: "Verification email sent",
        description: "Please check your inbox and spam folder.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend verification email",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!user) return;
    
    setIsChecking(true);
    try {
      console.log("Starting verification check...");
      // Force reload the user to get latest verification status
      await user.reload();
      const currentUser = auth.currentUser;
      
      console.log("Current user verification status:", currentUser?.emailVerified);
      
      if (currentUser?.emailVerified) {
        // If email is verified but IP is suspicious, mark IP as verified
        if (isSuspicious && !isIPVerified) {
          try {
            const response = await fetch('https://api.ipify.org?format=json');
            const { ip } = await response.json();
            await markLoginAsVerified(user.uid, ip);
            setIsIPVerified(true);
            console.log("IP marked as verified");
          } catch (error) {
            console.error("Error marking IP as verified:", error);
          }
        }

        // If both email and IP (if suspicious) are verified, redirect
        if (!isSuspicious || isIPVerified) {
          console.log("All verifications complete, redirecting...");
          toast({
            title: "Verification Complete!",
            description: "Your account has been successfully verified.",
          });
          window.location.href = "/";
        } else {
          toast({
            title: "Email Verified",
            description: "Please verify your device to continue.",
          });
        }
      } else {
        console.log("Email not verified yet");
        toast({
          title: "Not Verified Yet",
          description: "Please check your email and click the verification link.",
        });
      }
    } catch (error) {
      console.error("Error checking verification:", error);
      toast({
        title: "Error",
        description: "Failed to check verification status",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleSignOut = async () => {
    await auth.signOut();
    setLocation("/login");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-lg">
        <div className="text-center space-y-4">
          <Mail className="h-12 w-12 text-primary mx-auto" />
          
          <h1 className="text-2xl font-bold">
            {!user?.emailVerified ? "Verify Your Email" : isSuspicious ? "Verify Your Device" : "Verification Complete"}
          </h1>

          <p className="text-muted-foreground">
            {!user?.emailVerified ? (
              <>We've sent a verification email to <span className="font-semibold">{user?.email}</span> to activate your account.</>
            ) : isSuspicious ? (
              <>We've detected a sign-in from a new device. Please verify this device to continue.</>
            ) : (
              <>Your account is fully verified and ready to use.</>
            )}
          </p>

          {(!user?.emailVerified || (isSuspicious && !isIPVerified)) && (
            <p className="text-sm text-muted-foreground">
              Please check your inbox and click the verification link to continue.
              If you don't see the email, check your spam folder.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {!user?.emailVerified && (
            <Button
              onClick={handleResendVerification}
              disabled={isResending || resendCooldown > 0}
              className="w-full"
            >
              {isResending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : resendCooldown > 0 ? (
                `Resend in ${resendCooldown}s`
              ) : (
                "Resend Verification Email"
              )}
            </Button>
          )}

          <Button
            variant="outline"
            onClick={handleSignOut}
            className="w-full"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
} 