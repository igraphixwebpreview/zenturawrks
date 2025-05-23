import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Download, Mail, Check, Loader2 } from "lucide-react";

interface AnimatedLoadingProps {
  isVisible: boolean;
  currentStep: 'generating' | 'processing' | 'finalizing' | 'complete';
  onComplete?: () => void;
}

const steps = [
  {
    id: 'generating',
    title: 'Generating Invoice',
    description: 'Creating your professional invoice...',
    icon: FileText,
    duration: 2000,
  },
  {
    id: 'processing',
    title: 'Processing Template',
    description: 'Applying your custom template...',
    icon: Download,
    duration: 1500,
  },
  {
    id: 'finalizing',
    title: 'Finalizing PDF',
    description: 'Preparing your document...',
    icon: Mail,
    duration: 1000,
  },
  {
    id: 'complete',
    title: 'Complete!',
    description: 'Your invoice is ready',
    icon: Check,
    duration: 800,
  },
];

export function AnimatedLoading({ isVisible, currentStep, onComplete }: AnimatedLoadingProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const stepIndex = steps.findIndex(step => step.id === currentStep);
    if (stepIndex !== -1) {
      setCurrentStepIndex(stepIndex);
    }
  }, [currentStep]);

  useEffect(() => {
    if (currentStep === 'complete' && onComplete) {
      const timer = setTimeout(onComplete, 800);
      return () => clearTimeout(timer);
    }
  }, [currentStep, onComplete]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-900 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl"
        >
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Progress
              </span>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {Math.round(((currentStepIndex + 1) / steps.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                className="bg-blue-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ 
                  width: `${((currentStepIndex + 1) / steps.length) * 100}%` 
                }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </div>
          </div>

          {/* Current Step */}
          <div className="text-center">
            <motion.div
              key={currentStep}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
                {currentStep === 'complete' ? (
                  <Check className="w-8 h-8 text-green-600" />
                ) : (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="w-8 h-8 text-blue-600" />
                  </motion.div>
                )}
              </div>
            </motion.div>

            <motion.h3
              key={`title-${currentStep}`}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2"
            >
              {steps[currentStepIndex]?.title}
            </motion.h3>

            <motion.p
              key={`desc-${currentStep}`}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-gray-600 dark:text-gray-400"
            >
              {steps[currentStepIndex]?.description}
            </motion.p>
          </div>

          {/* Step Indicators */}
          <div className="flex justify-center space-x-2 mt-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                className={`w-2 h-2 rounded-full ${
                  index <= currentStepIndex
                    ? 'bg-blue-600'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
              />
            ))}
          </div>

          {/* Floating Particles Animation */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-60"
                initial={{
                  x: Math.random() * 400,
                  y: Math.random() * 300,
                  scale: 0,
                }}
                animate={{
                  y: [null, -20, -40],
                  x: [null, Math.random() * 100 - 50, Math.random() * 200 - 100],
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function useInvoiceGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState<'generating' | 'processing' | 'finalizing' | 'complete'>('generating');

  const startGeneration = async () => {
    setIsGenerating(true);
    setCurrentStep('generating');

    // Simulate generation steps
    setTimeout(() => setCurrentStep('processing'), 1000);
    setTimeout(() => setCurrentStep('finalizing'), 2500);
    setTimeout(() => setCurrentStep('complete'), 3500);
  };

  const finishGeneration = () => {
    setIsGenerating(false);
    setCurrentStep('generating');
  };

  return {
    isGenerating,
    currentStep,
    startGeneration,
    finishGeneration,
  };
}