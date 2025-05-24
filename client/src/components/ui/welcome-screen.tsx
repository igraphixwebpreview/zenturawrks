import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { File, CheckCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface WelcomeScreenProps {
  onComplete: () => void;
  companyName?: string;
  userEmail?: string;
}

export function WelcomeScreen({ onComplete, companyName, userEmail }: WelcomeScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const steps = [
    {
      icon: File,
      title: "Welcome to InvoiceGen",
      subtitle: "Professional invoice generation made simple",
      delay: 1000
    },
    {
      icon: CheckCircle,
      title: companyName ? `Welcome back, ${companyName}!` : `Hello, ${userEmail?.split('@')[0] || 'User'}!`,
      subtitle: "Your invoicing workspace is ready",
      delay: 1500
    },
    {
      icon: Sparkles,
      title: "Everything is set up",
      subtitle: "Let's create something amazing together",
      delay: 1000
    }
  ];

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (currentStep < steps.length) {
      timeout = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, steps[currentStep].delay);
    } else {
      timeout = setTimeout(() => {
        setIsComplete(true);
        setTimeout(onComplete, 800);
      }, 1000);
    }

    return () => clearTimeout(timeout);
  }, [currentStep, steps, onComplete]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    },
    exit: { 
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.8,
        ease: "easeInOut"
      }
    }
  };

  const logoVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: { 
      scale: 1, 
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20,
        duration: 1
      }
    }
  };

  const textVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const progressVariants = {
    hidden: { width: 0 },
    visible: { 
      width: `${((currentStep + 1) / steps.length) * 100}%`,
      transition: {
        duration: 0.8,
        ease: "easeInOut"
      }
    }
  };

  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-background via-background/95 to-primary/10"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-primary/20" />
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-accent/20 rounded-full blur-2xl animate-pulse delay-1000" />
          </div>

          <div className="relative flex flex-col items-center justify-center text-center max-w-md mx-auto p-8">
            {/* Animated Logo */}
            <motion.div
              className="mb-8"
              variants={logoVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/25">
                  <File className="w-10 h-10 text-primary-foreground" />
                </div>
                <motion.div
                  className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-primary/20 to-accent/20 blur-xl"
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 0.8, 0.5]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </div>
            </motion.div>

            {/* Dynamic Content */}
            <AnimatePresence mode="wait">
              {currentStep < steps.length && (
                <motion.div
                  key={currentStep}
                  className="flex flex-col items-center"
                  variants={textVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  <motion.div
                    className="mb-4"
                    animate={{
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    {(() => {
                      const IconComponent = steps[currentStep].icon;
                      return (
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <IconComponent className="w-6 h-6 text-primary" />
                        </div>
                      );
                    })()}
                  </motion.div>

                  <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                    {steps[currentStep].title}
                  </h1>
                  
                  <p className="text-muted-foreground text-lg">
                    {steps[currentStep].subtitle}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Progress Bar */}
            <div className="w-full max-w-xs mt-12">
              <div className="w-full bg-border/30 rounded-full h-1 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                  variants={progressVariants}
                  initial="hidden"
                  animate="visible"
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>Setting up...</span>
                <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
              </div>
            </div>

            {/* Floating Elements */}
            <motion.div
              className="absolute top-16 right-16 w-3 h-3 bg-primary/40 rounded-full"
              animate={{
                y: [0, -20, 0],
                opacity: [0.4, 1, 0.4]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: 0.5
              }}
            />
            <motion.div
              className="absolute bottom-24 left-12 w-2 h-2 bg-accent/50 rounded-full"
              animate={{
                y: [0, -15, 0],
                opacity: [0.3, 0.8, 0.3]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                delay: 1.5
              }}
            />
            <motion.div
              className="absolute top-32 left-20 w-1 h-1 bg-primary/60 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.6, 1, 0.6]
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                delay: 2
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}