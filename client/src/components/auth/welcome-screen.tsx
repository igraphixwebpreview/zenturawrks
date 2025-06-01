import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, FileText, Users, Settings, ArrowRight, Sparkles, ChevronRight, ChevronLeft } from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Smart Invoicing",
    description: "Create professional invoices in seconds with our AI-powered system. Real-time calculations and instant previews.",
    color: "from-blue-500 to-cyan-400"
  },
  {
    icon: Users,
    title: "Client Hub",
    description: "Manage all your clients in one place. Track payments, send reminders, and maintain detailed client profiles.",
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: Settings,
    title: "Customization",
    description: "Personalize your invoices with custom templates, branding, and automated workflows to match your business needs.",
    color: "from-orange-500 to-red-500"
  },
];

interface WelcomeScreenProps {
  isNewUser?: boolean;
  signInMethod?: 'email' | 'google' | 'facebook' | 'apple';
  onComplete?: () => void;
}

export function WelcomeScreen({ isNewUser = true, signInMethod = 'email', onComplete }: WelcomeScreenProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);

  // Clear welcome screen state when unmounting
  useEffect(() => {
    return () => {
      setShowWelcome(false);
    };
  }, []);

  const handleGetStarted = () => {
    setShowWelcome(false);
    onComplete?.();
    setLocation(isNewUser ? "/settings" : "/");
  };

  const nextStep = () => {
    if (currentStep < features.length) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleGetStarted();
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const getWelcomeMessage = () => {
    if (!isNewUser) {
      return {
        title: "Welcome Back!",
        subtitle: "Great to see you again",
        icon: <Sparkles className="h-8 w-8 text-primary" />,
        gradient: "from-primary to-primary/80"
      };
    }

    switch (signInMethod) {
      case 'google':
        return {
          title: "Welcome to InvoiceGen!",
          subtitle: "Your Google account is ready to go",
          icon: <CheckCircle2 className="h-8 w-8 text-green-500" />,
          gradient: "from-green-500 to-emerald-400"
        };
      case 'facebook':
        return {
          title: "Welcome to InvoiceGen!",
          subtitle: "Your Facebook account is ready to go",
          icon: <CheckCircle2 className="h-8 w-8 text-blue-500" />,
          gradient: "from-blue-500 to-indigo-400"
        };
      case 'apple':
        return {
          title: "Welcome to InvoiceGen!",
          subtitle: "Your Apple account is ready to go",
          icon: <CheckCircle2 className="h-8 w-8 text-gray-900 dark:text-gray-100" />,
          gradient: "from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300"
        };
      default:
        return {
          title: "Welcome to InvoiceGen!",
          subtitle: "Email verified successfully!",
          icon: <CheckCircle2 className="h-8 w-8 text-primary" />,
          gradient: "from-primary to-primary/80"
        };
    }
  };

  const welcomeMessage = getWelcomeMessage();

  // Welcome Screen
  if (currentStep === 0) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-primary/5 to-primary/10 flex flex-col">
        <div className="flex-1 flex flex-col justify-center items-center text-center p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-lg"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
              {welcomeMessage.title}
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-12">
              {welcomeMessage.subtitle}
            </p>
            <Button
              size="lg"
              onClick={nextStep}
              className="w-full sm:w-auto px-8 py-6 text-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 shadow-lg hover:shadow-xl rounded-xl"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Feature Screens
  const currentFeature = features[currentStep - 1];
  const isLastScreen = currentStep === features.length;

  return (
    <div className="min-h-screen w-full bg-background flex flex-col">
      {/* Feature Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            className="max-w-lg"
          >
            <div className="p-8 rounded-full bg-muted inline-block mb-8">
              {(() => {
                const FeatureIcon = currentFeature.icon;
                return <FeatureIcon className="h-16 w-16 text-primary" />;
              })()}
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">{currentFeature.title}</h2>
            <p className="text-lg sm:text-xl text-muted-foreground mb-12">
              {currentFeature.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="w-full p-6">
        <div className="max-w-lg mx-auto">
          {/* Progress bar */}
          <div className="w-full h-1 bg-muted rounded-full mb-8">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / features.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="lg"
              onClick={prevStep}
              className="px-6"
              disabled={currentStep === 1}
            >
              <ChevronLeft className="h-5 w-5 mr-2" />
              Back
            </Button>

            <Button
              size="lg"
              onClick={nextStep}
              className="px-8 py-6 text-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 shadow-lg hover:shadow-xl rounded-xl"
            >
              {isLastScreen ? "Get Started" : "Next"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 