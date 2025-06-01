import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { checkSuspiciousSignIn, isIPVerified as checkIsIPVerified } from "@/lib/firebase-auth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [location, setLocation] = useLocation();
  const [isSuspicious, setIsSuspicious] = useState(false);
  const [checkingSuspicious, setCheckingSuspicious] = useState(true);
  const [isCurrentIPVerified, setIsCurrentIPVerified] = useState(false);
  const hasCheckedSuspicious = useRef(false);

  const isSettingsPage = location === '/settings';
  const isLoginPage = location === '/login';
  const isVerifyEmailPage = location === '/verify-email';

  useEffect(() => {
    const checkSuspiciousStatus = async () => {
      if (user && !hasCheckedSuspicious.current) {
        try {
          // Get current IP
          const response = await fetch('https://api.ipify.org?format=json');
          const { ip } = await response.json();
          
          // Check if this is a suspicious sign-in
          const suspicious = await checkSuspiciousSignIn(user.uid, ip);
          setIsSuspicious(suspicious);

          // Check if IP is verified
          const verified = await checkIsIPVerified(user.uid, ip);
          setIsCurrentIPVerified(verified);
          
          hasCheckedSuspicious.current = true;
        } catch (error) {
          console.error("Error checking suspicious status:", error);
          setIsSuspicious(false);
          setIsCurrentIPVerified(false);
          hasCheckedSuspicious.current = true;
        } finally {
             setCheckingSuspicious(false);
        }
      }
    };

    checkSuspiciousStatus();
  }, [user, isVerifyEmailPage, setLocation]);

  useEffect(() => {
    // If not loading and no user, redirect to login
    if (!loading && !user) {
      setLocation("/login");
      return;
    }

    // If loading is complete and checkingSuspicious is complete
    if (!loading && !checkingSuspicious) {
         // If user is not email verified and not on login/verify-email page, redirect to verify-email
        if (user && !user.emailVerified && !isLoginPage && !isVerifyEmailPage) {
          console.log("ProtectedRoute: User email not verified, redirecting to verify-email page.");
          setLocation("/verify-email");
          return;
        }

        // If suspicious sign-in detected, IP not verified, and not on verify-email page, redirect to verify-email
        if (user && isSuspicious && !isCurrentIPVerified && !isVerifyEmailPage) {
          console.log("ProtectedRoute: Suspicious sign-in detected and IP not verified, redirecting to verify-email page.");
          setLocation("/verify-email");
          return;
        }
    }


  }, [user, loading, checkingSuspicious, isSuspicious, isCurrentIPVerified, isLoginPage, isVerifyEmailPage, setLocation]);

  // If no user, don't render anything (useEffect will handle redirect)
  if (!user) {
    return null;
  }

  // If user is not email verified and not on login/verify-email page, don't render anything
  if (!user.emailVerified && !isLoginPage && !isVerifyEmailPage) {
    return null;
  }

  // If suspicious sign-in detected, IP not verified, and not on verify-email page, don't render anything
  if (isSuspicious && !isCurrentIPVerified && !isVerifyEmailPage) {
    return null;
  }

  // If we get here, either:
  // 1. User is email verified and not suspicious
  // 2. User is on login page
  // 3. User is on verify-email page
  // 4. User is on settings page
  // 5. User is suspicious, but IP has been verified
  return <>{children}</>;
} 