import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { setLanguage, t } from "@/lib/i18n";
import { LanguageProfileStep } from "./steps/language-profile-step";
import { CompanyInfoStep } from "./steps/company-info-step";
import { BrandAssetsStep } from "./steps/brand-assets-step";
import { InvoiceSettingsStep } from "./steps/invoice-settings-step";
import { WelcomeCompleteStep } from "./steps/welcome-complete-step";

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [stepData, setStepData] = useState({
    language: "en",
    displayName: "",
    profilePicture: null as string | null,
    companyInfo: {},
    brandAssets: {},
    invoiceSettings: {}
  });

  // Determine steps based on user role
  const isAdmin = user?.isAdmin || false;
  const steps = [
    { id: 1, name: "Profile Setup", component: LanguageProfileStep, roles: ["admin", "staff"] },
    { id: 2, name: "Company Info", component: CompanyInfoStep, roles: ["admin"] },
    { id: 3, name: "Brand Assets", component: BrandAssetsStep, roles: ["admin"] },
    { id: 4, name: "Invoice Settings", component: InvoiceSettingsStep, roles: ["admin", "staff"] },
    { id: 5, name: "Welcome", component: WelcomeCompleteStep, roles: ["admin", "staff"] }
  ];

  // Filter steps based on user role
  const availableSteps = steps.filter(step => 
    step.roles.includes(isAdmin ? "admin" : "staff")
  );

  const currentStepIndex = availableSteps.findIndex(step => step.id === currentStep);
  const totalSteps = availableSteps.length;
  const progressPercentage = ((currentStepIndex + 1) / totalSteps) * 100;

  const handleNext = (data: any) => {
    setStepData(prev => ({ ...prev, ...data }));
    
    // If language was changed in the first step, update the app language
    if (data.language) {
      setLanguage(data.language);
    }
    
    const nextStepIndex = currentStepIndex + 1;
    if (nextStepIndex < availableSteps.length) {
      setCurrentStep(availableSteps[nextStepIndex].id);
    } else {
      // Mark onboarding as complete
      localStorage.setItem('onboarding-complete', 'true');
      onComplete();
    }
  };

  const handleBack = () => {
    const prevStepIndex = currentStepIndex - 1;
    if (prevStepIndex >= 0) {
      setCurrentStep(availableSteps[prevStepIndex].id);
    }
  };

  const getCurrentStepComponent = () => {
    const step = availableSteps.find(s => s.id === currentStep);
    if (!step) return null;

    const StepComponent = step.component;
    return (
      <StepComponent
        data={stepData}
        onNext={handleNext}
        onBack={currentStepIndex > 0 ? handleBack : undefined}
        isAdmin={isAdmin}
      />
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-gray-950">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-white to-purple-50/20 dark:from-gray-950 dark:via-gray-900 dark:to-blue-950/10" />
      
      <div className="relative w-full max-w-4xl mx-auto px-6 h-full flex flex-col">
        {/* Minimal header */}
        <div className="pt-4 pb-2">
          {/* Temporary reset button for testing */}
          <button 
            onClick={() => {
              localStorage.removeItem('onboarding-complete');
              window.location.reload();
            }}
            className="absolute top-4 right-4 text-xs text-gray-400 hover:text-gray-600 transition-colors z-10"
            style={{ fontSize: '10px' }}
          >
            Reset
          </button>
        </div>

        {/* Step content */}
        <div className="flex-1 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-2xl"
            >
              {getCurrentStepComponent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}