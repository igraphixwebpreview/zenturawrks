import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Image, FileText, Palette } from "lucide-react";

interface BrandAssetsStepProps {
  data: any;
  onNext: (data: any) => void;
  onBack?: () => void;
  isAdmin: boolean;
}

export function BrandAssetsStep({ data, onNext, onBack }: BrandAssetsStepProps) {
  const [brandAssets, setBrandAssets] = useState({
    companyLogo: data.brandAssets?.companyLogo || null,
    letterhead: data.brandAssets?.letterhead || null,
    signature: data.brandAssets?.signature || null,
    brandColors: data.brandAssets?.brandColors || {
      primary: "#7C3AED",
      secondary: "#3B82F6",
      accent: "#10B981"
    }
  });

  const handleFileUpload = (type: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataURL = e.target?.result as string;
      setBrandAssets(prev => ({ ...prev, [type]: dataURL }));
    };
    reader.readAsDataURL(file);
  };

  const handleColorChange = (colorType: string, color: string) => {
    setBrandAssets(prev => ({
      ...prev,
      brandColors: { ...prev.brandColors, [colorType]: color }
    }));
  };

  const handleNext = () => {
    onNext({ brandAssets });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto border-0 shadow-xl bg-white/95 backdrop-blur-md">
      <CardHeader className="text-center pb-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4"
        >
          <Palette className="w-8 h-8 text-white" />
        </motion.div>
        <CardTitle className="text-2xl font-light text-gray-900">
          Brand Assets
        </CardTitle>
        <p className="text-gray-500 mt-2">
          Upload your brand assets to create professional, branded invoices
        </p>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Company Logo */}
        <div className="space-y-4">
          <Label className="text-base font-medium flex items-center gap-2">
            <Image className="w-4 h-4" />
            Company Logo
          </Label>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden">
              {brandAssets.companyLogo ? (
                <img
                  src={brandAssets.companyLogo}
                  alt="Company Logo"
                  className="w-full h-full object-contain"
                />
              ) : (
                <Upload className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload('companyLogo')}
                className="hidden"
                id="logo-upload"
              />
              <Label
                htmlFor="logo-upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer transition-colors text-sm font-medium"
              >
                <Upload className="w-4 h-4" />
                {brandAssets.companyLogo ? "Change Logo" : "Upload Logo"}
              </Label>
              <p className="text-xs text-gray-500 mt-2">
                Recommended: PNG or SVG, transparent background
              </p>
            </div>
          </div>
        </div>

        {/* Letterhead */}
        <div className="space-y-4">
          <Label className="text-base font-medium flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Letterhead Template
          </Label>
          <div className="flex items-center gap-6">
            <div className="w-24 h-32 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden">
              {brandAssets.letterhead ? (
                <img
                  src={brandAssets.letterhead}
                  alt="Letterhead"
                  className="w-full h-full object-contain"
                />
              ) : (
                <FileText className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload('letterhead')}
                className="hidden"
                id="letterhead-upload"
              />
              <Label
                htmlFor="letterhead-upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer transition-colors text-sm font-medium"
              >
                <Upload className="w-4 h-4" />
                {brandAssets.letterhead ? "Change Letterhead" : "Upload Letterhead"}
              </Label>
              <p className="text-xs text-gray-500 mt-2">
                Optional: Header design for your invoices
              </p>
            </div>
          </div>
        </div>

        {/* Digital Signature */}
        <div className="space-y-4">
          <Label className="text-base font-medium">
            Digital Signature
          </Label>
          <div className="flex items-center gap-6">
            <div className="w-32 h-16 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden">
              {brandAssets.signature ? (
                <img
                  src={brandAssets.signature}
                  alt="Signature"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-xs text-gray-400 text-center">Signature</div>
              )}
            </div>
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload('signature')}
                className="hidden"
                id="signature-upload"
              />
              <Label
                htmlFor="signature-upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer transition-colors text-sm font-medium"
              >
                <Upload className="w-4 h-4" />
                {brandAssets.signature ? "Change Signature" : "Upload Signature"}
              </Label>
              <p className="text-xs text-gray-500 mt-2">
                Optional: Your digital signature for invoices
              </p>
            </div>
          </div>
        </div>

        {/* Brand Colors */}
        <div className="space-y-4">
          <Label className="text-base font-medium">
            Brand Colors
          </Label>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary-color" className="text-sm text-gray-600">
                Primary
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="primary-color"
                  value={brandAssets.brandColors.primary}
                  onChange={(e) => handleColorChange('primary', e.target.value)}
                  className="w-12 h-12 rounded-xl border-2 border-gray-200 cursor-pointer"
                />
                <span className="text-xs text-gray-500 font-mono">
                  {brandAssets.brandColors.primary}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary-color" className="text-sm text-gray-600">
                Secondary
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="secondary-color"
                  value={brandAssets.brandColors.secondary}
                  onChange={(e) => handleColorChange('secondary', e.target.value)}
                  className="w-12 h-12 rounded-xl border-2 border-gray-200 cursor-pointer"
                />
                <span className="text-xs text-gray-500 font-mono">
                  {brandAssets.brandColors.secondary}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accent-color" className="text-sm text-gray-600">
                Accent
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="accent-color"
                  value={brandAssets.brandColors.accent}
                  onChange={(e) => handleColorChange('accent', e.target.value)}
                  className="w-12 h-12 rounded-xl border-2 border-gray-200 cursor-pointer"
                />
                <span className="text-xs text-gray-500 font-mono">
                  {brandAssets.brandColors.accent}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-8 border-t border-gray-100 dark:border-gray-800">
          {onBack ? (
            <Button variant="outline" onClick={onBack} className="px-8 h-12">
              Back
            </Button>
          ) : (
            <div />
          )}
          
          <Button 
            onClick={handleNext}
            className="px-8 h-12 bg-primary hover:bg-primary/90 text-white"
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}