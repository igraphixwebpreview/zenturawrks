import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Rocket, Sparkles } from "lucide-react";

interface WelcomeCompleteStepProps {
  data: any;
  onNext: (data: any) => void;
  onBack?: () => void;
  isAdmin: boolean;
}

export function WelcomeCompleteStep({ data, onNext, isAdmin }: WelcomeCompleteStepProps) {
  const handleComplete = () => {
    onNext({});
  };

  const completedSteps = [
    { 
      icon: CheckCircle, 
      title: "Profile Setup", 
      description: `Language: ${data.language?.toUpperCase()}, Name: ${data.displayName}`,
      completed: true 
    },
    ...(isAdmin ? [{
      icon: CheckCircle,
      title: "Company Information",
      description: `${data.companyInfo?.companyName || 'Company details configured'}`,
      completed: true
    }] : []),
    ...(isAdmin ? [{
      icon: CheckCircle,
      title: "Brand Assets",
      description: "Logo and brand colors uploaded",
      completed: true
    }] : []),
    {
      icon: CheckCircle,
      title: "Invoice Settings",
      description: `Prefix: ${data.invoiceSettings?.invoicePrefix}, Currency: ${data.invoiceSettings?.currency}`,
      completed: true
    }
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto border-0 shadow-xl bg-white/95 backdrop-blur-md">
      <CardHeader className="text-center pb-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative mx-auto mb-6"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-3xl flex items-center justify-center shadow-lg">
            <Rocket className="w-10 h-10 text-white" />
          </div>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="absolute -top-2 -right-2"
          >
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <CardTitle className="text-3xl font-light text-gray-900 mb-3">
            🎉 Welcome to InvoiceGen!
          </CardTitle>
          <p className="text-gray-500 text-lg">
            Your workspace is ready! You're all set to create professional invoices.
          </p>
        </motion.div>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Setup Summary */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Setup Complete
          </h3>
          
          <div className="space-y-3">
            {completedSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 + index * 0.1, duration: 0.4 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800"
              >
                <step.icon className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-medium text-green-900 dark:text-green-100">
                    {step.title}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300">
                    {step.description}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Role Badge */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className={`p-4 rounded-xl border-2 ${
            isAdmin 
              ? "bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800" 
              : "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
          }`}
        >
          <div className="text-center">
            <div className={`text-lg font-bold ${
              isAdmin ? "text-purple-700 dark:text-purple-300" : "text-blue-700 dark:text-blue-300"
            }`}>
              {isAdmin ? "🔐 Admin Access" : "👤 Staff Member"}
            </div>
            <p className={`text-sm mt-1 ${
              isAdmin ? "text-purple-600 dark:text-purple-400" : "text-blue-600 dark:text-blue-400"
            }`}>
              {isAdmin 
                ? "You have full access to all features and settings" 
                : "You can create invoices and manage your profile"
              }
            </p>
          </div>
        </motion.div>

        {/* Next Steps */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="space-y-3"
        >
          <h3 className="text-lg font-semibold text-gray-900">
            What's Next?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <div className="font-medium text-gray-900 dark:text-gray-100">📄 Create Invoice</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Start with your first invoice</div>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <div className="font-medium text-gray-900 dark:text-gray-100">👥 Add Clients</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Build your client database</div>
            </div>
            {isAdmin && (
              <>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <div className="font-medium text-gray-900 dark:text-gray-100">📧 Email Templates</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Customize email messages</div>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <div className="font-medium text-gray-900 dark:text-gray-100">👤 Add Staff</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Invite team members</div>
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Get Started Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.5 }}
          className="pt-6"
        >
          <Button 
            onClick={handleComplete}
            className="w-full h-14 text-lg bg-primary hover:bg-primary/90 shadow-lg"
          >
            <Rocket className="w-5 h-5 mr-2" />
            Launch InvoiceGen
          </Button>
        </motion.div>
      </CardContent>
    </Card>
  );
}