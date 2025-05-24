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
          className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-gray-950"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            transition: { duration: 0.6, ease: "easeInOut" }
          }}
        >
          {/* Clean minimal background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-white to-purple-50/20 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950/10" />
          
          <div className="relative flex flex-col items-center justify-center text-center max-w-md mx-auto px-6">
            {/* Minimalist logo */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: 0.7,
                ease: "easeOut"
              }}
              className="mb-12"
            >
              {companyLogo ? (
                <div className="w-20 h-20 rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800">
                  <img 
                    src={companyLogo} 
                    alt="Company Logo" 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center shadow-sm">
                  <Building2 className="w-10 h-10 text-white" />
                </div>
              )}
            </motion.div>

            {/* Clean app branding */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                duration: 0.6,
                delay: 0.2,
                ease: "easeOut"
              }}
              className="mb-16"
            >
              <h1 className="text-4xl font-light text-gray-900 dark:text-white mb-3 tracking-tight">
                InvoiceGen
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-base font-light">
                {companyName ? `Welcome back, ${companyName}` : `Hello, ${userEmail?.split('@')[0] || 'User'}`}
              </p>
            </motion.div>

            {/* Minimal loading indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: 0.4,
                delay: 0.6
              }}
              className="text-center"
            >
              {/* Simple progress bar */}
              <div className="w-48 h-1 bg-gray-200 dark:bg-gray-800 rounded-full mb-4">
                <motion.div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${loadingProgress}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>
              
              <div className="text-gray-400 dark:text-gray-500 text-sm font-light">
                Setting up your workspace
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}