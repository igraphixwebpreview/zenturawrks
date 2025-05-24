import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, MapPin, Phone, Mail } from "lucide-react";

interface CompanyInfoStepProps {
  data: any;
  onNext: (data: any) => void;
  onBack?: () => void;
  isAdmin: boolean;
}

export function CompanyInfoStep({ data, onNext, onBack }: CompanyInfoStepProps) {
  const [companyInfo, setCompanyInfo] = useState({
    companyName: data.companyInfo?.companyName || "",
    companyAddress: data.companyInfo?.companyAddress || "",
    companyPhone: data.companyInfo?.companyPhone || "",
    companyEmail: data.companyInfo?.companyEmail || "",
    website: data.companyInfo?.website || "",
    taxId: data.companyInfo?.taxId || "",
    description: data.companyInfo?.description || ""
  });

  const handleInputChange = (field: string, value: string) => {
    setCompanyInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    onNext({ companyInfo });
  };

  const isValid = companyInfo.companyName.trim().length > 0 && 
                 companyInfo.companyAddress.trim().length > 0;

  return (
    <Card className="w-full max-w-2xl mx-auto border-0 shadow-xl bg-white/95 backdrop-blur-md flex flex-col max-h-[90vh]">
      <CardHeader className="text-center pb-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4"
        >
          <Building2 className="w-8 h-8 text-white" />
        </motion.div>
        <CardTitle className="text-2xl font-light text-gray-900">
          Company Information
        </CardTitle>
        <p className="text-gray-500 mt-2">
          Set up your business details for professional invoices
        </p>
      </CardHeader>

      <CardContent className="space-y-6 flex-1 overflow-y-auto px-6 pb-6">
        {/* Company Name */}
        <div className="space-y-2">
          <Label htmlFor="companyName" className="text-base font-medium">
            Company Name *
          </Label>
          <Input
            id="companyName"
            type="text"
            placeholder="Your Company Ltd."
            value={companyInfo.companyName}
            onChange={(e) => handleInputChange("companyName", e.target.value)}
            className="h-12 text-base"
          />
        </div>

        {/* Company Address */}
        <div className="space-y-2">
          <Label htmlFor="companyAddress" className="text-base font-medium flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Business Address *
          </Label>
          <Textarea
            id="companyAddress"
            placeholder="123 Business Street&#10;City, State 12345&#10;Country"
            value={companyInfo.companyAddress}
            onChange={(e) => handleInputChange("companyAddress", e.target.value)}
            className="min-h-[100px] text-base resize-none"
          />
        </div>

        {/* Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="companyPhone" className="text-base font-medium flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Phone Number
            </Label>
            <Input
              id="companyPhone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={companyInfo.companyPhone}
              onChange={(e) => handleInputChange("companyPhone", e.target.value)}
              className="h-12 text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyEmail" className="text-base font-medium flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Business Email
            </Label>
            <Input
              id="companyEmail"
              type="email"
              placeholder="info@yourcompany.com"
              value={companyInfo.companyEmail}
              onChange={(e) => handleInputChange("companyEmail", e.target.value)}
              className="h-12 text-base"
            />
          </div>
        </div>

        {/* Additional Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="website" className="text-base font-medium">
              Website
            </Label>
            <Input
              id="website"
              type="url"
              placeholder="https://yourcompany.com"
              value={companyInfo.website}
              onChange={(e) => handleInputChange("website", e.target.value)}
              className="h-12 text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxId" className="text-base font-medium">
              Tax ID / VAT Number
            </Label>
            <Input
              id="taxId"
              type="text"
              placeholder="12-3456789"
              value={companyInfo.taxId}
              onChange={(e) => handleInputChange("taxId", e.target.value)}
              className="h-12 text-base"
            />
          </div>
        </div>

        {/* Company Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-base font-medium">
            Business Description
          </Label>
          <Textarea
            id="description"
            placeholder="Brief description of your business services..."
            value={companyInfo.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            className="min-h-[80px] text-base resize-none"
          />
          <p className="text-sm text-gray-500">
            This will appear on your invoices and help clients understand your business
          </p>
        </div>

      </CardContent>
      
      {/* Fixed Navigation at bottom */}
      <div className="flex justify-between items-center p-6 border-t-2 border-gray-200 dark:border-gray-700 bg-white/95 backdrop-blur-md">
        {onBack ? (
          <Button 
            variant="outline" 
            onClick={onBack} 
            className="px-8 py-3 h-12 text-base font-medium border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
          >
            Back
          </Button>
        ) : (
          <div />
        )}
        
        <Button 
          onClick={handleNext}
          disabled={!isValid}
          className="px-8 py-3 h-12 text-base font-medium bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-600 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </Button>
      </div>
    </Card>
  );
}