import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, Rocket, Sparkles, FileText, Users, Settings } from "lucide-react";

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

  return (
    <div className="w-full max-w-2xl mx-auto h-[85vh] flex flex-col space-y-6">
      {/* Hero Section */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="text-center py-8"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative mx-auto mb-6 w-fit"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-primary via-primary to-primary/80 rounded-full flex items-center justify-center shadow-2xl">
            <Rocket className="w-12 h-12 text-white" />
          </div>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="absolute -top-1 -right-1"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-4">
            Welcome to InvoiceGen!
          </h1>
          <p className="text-gray-600 text-lg max-w-md mx-auto leading-relaxed">
            Your professional invoice workspace is ready! Let's start creating amazing invoices.
          </p>
        </motion.div>
      </motion.div>

      {/* Main Content Card */}
      <Card className="flex-1 border-0 shadow-xl bg-white/95 backdrop-blur-md overflow-hidden">
        <div className="p-6 h-full flex flex-col">
          
          {/* Setup Complete Badge */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <span className="text-green-800 font-semibold text-lg">Setup Complete!</span>
            </div>
          </motion.div>

          {/* Quick Start Cards */}
          <div className="flex-1 overflow-y-auto space-y-6">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="space-y-4"
            >
              <h3 className="text-xl font-bold text-gray-900 text-center mb-6">
                Ready to Get Started?
              </h3>
              
              <div className="space-y-4">
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 1.0, duration: 0.4 }}
                  className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">Create Your First Invoice</h4>
                      <p className="text-gray-600">Start generating professional invoices right away</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 1.1, duration: 0.4 }}
                  className="p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">Add Your Clients</h4>
                      <p className="text-gray-600">Build your client database for faster invoicing</p>
                    </div>
                  </div>
                </motion.div>

                {isAdmin && (
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 1.2, duration: 0.4 }}
                    className="p-6 rounded-2xl bg-gradient-to-br from-orange-50 to-red-50 border border-orange-100 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Settings className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg">Customize Templates</h4>
                        <p className="text-gray-600">Set up email templates and invoice designs</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </Card>

      {/* Launch Button */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.5 }}
        className="w-full"
      >
        <Button 
          onClick={handleComplete}
          className="w-full h-16 text-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-2xl hover:shadow-xl transition-all duration-300 rounded-2xl"
        >
          <Rocket className="w-6 h-6 mr-3" />
          Launch InvoiceGen
        </Button>
      </motion.div>
    </div>
  );
}