import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { File } from "lucide-react";

interface WelcomeScreenProps {
  onComplete: () => void;
  companyName?: string;
  userEmail?: string;
}

export function WelcomeScreen({ onComplete, companyName, userEmail }: WelcomeScreenProps) {
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsComplete(true);
      setTimeout(onComplete, 600);
    }, 2000);

    return () => clearTimeout(timer);
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
              className="mb-6"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/90 rounded-2xl flex items-center justify-center shadow-lg">
                <File className="w-8 h-8 text-primary-foreground" />
              </div>
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
              className="text-3xl font-bold text-foreground mb-2"
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
              className="text-muted-foreground text-lg"
            >
              {companyName ? `Welcome back, ${companyName}` : `Hello, ${userEmail?.split('@')[0] || 'User'}`}
            </motion.p>

            {/* Loading indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: 0.4,
                delay: 0.8
              }}
              className="mt-8"
            >
              <div className="w-8 h-1 bg-primary/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{
                    duration: 1.5,
                    delay: 0.5,
                    ease: "easeInOut"
                  }}
                />
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}