import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2 } from "lucide-react";

interface WelcomeScreenProps {
  onComplete: () => void;
  companyName?: string;
  userEmail?: string;
  companyLogo?: string;
}

export function WelcomeScreen({ onComplete, companyName, userEmail, companyLogo }: WelcomeScreenProps) {
  const [isComplete, setIsComplete] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    // Animate progress from 0 to 100
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(() => {
            setIsComplete(true);
            setTimeout(onComplete, 600);
          }, 200);
          return 100;
        }
        return prev + 2; // Increment by 2% each time
      });
    }, 30); // Update every 30ms

    return () => clearInterval(progressInterval);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            transition: { duration: 0.6, ease: "easeInOut" }
          }}
        >
          {/* Subtle background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
          
          <div className="relative flex flex-col items-center justify-center text-center">
            {/* Logo with elegant animation */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: 0.8,
                ease: "easeOut"
              }}
              className="mb-8"
            >
              {companyLogo ? (
                <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg">
                  <img 
                    src={companyLogo} 
                    alt="Company Logo" 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center shadow-lg">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
              )}
            </motion.div>

            {/* App name with clean typography */}
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                duration: 0.6,
                delay: 0.3,
                ease: "easeOut"
              }}
              className="text-3xl font-bold text-foreground mb-4"
            >
              InvoiceGen
            </motion.h1>

            {/* Personalized welcome */}
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                duration: 0.6,
                delay: 0.5,
                ease: "easeOut"
              }}
              className="text-muted-foreground text-lg mb-8"
            >
              {companyName ? `Welcome back, ${companyName}` : `Hello, ${userEmail?.split('@')[0] || 'User'}`}
            </motion.p>

            {/* Loading percentage counter */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: 0.4,
                delay: 0.8
              }}
            >
              <div className="text-black dark:text-white font-semibold text-2xl">
                {loadingProgress}%
              </div>
              <div className="text-muted-foreground text-sm mt-2">
                Setting up your workspace...
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}