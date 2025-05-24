import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Hash, Percent, Calendar } from "lucide-react";

interface InvoiceSettingsStepProps {
  data: any;
  onNext: (data: any) => void;
  onBack?: () => void;
  isAdmin: boolean;
}

export function InvoiceSettingsStep({ data, onNext, onBack, isAdmin }: InvoiceSettingsStepProps) {
  const [invoiceSettings, setInvoiceSettings] = useState({
    invoicePrefix: data.invoiceSettings?.invoicePrefix || "INV-",
    nextInvoiceNumber: data.invoiceSettings?.nextInvoiceNumber || 1001,
    defaultVat: data.invoiceSettings?.defaultVat || "0",
    paymentTerms: data.invoiceSettings?.paymentTerms || 30,
    currency: data.invoiceSettings?.currency || "USD",
    dateFormat: data.invoiceSettings?.dateFormat || "MM/DD/YYYY",
    timeZone: data.invoiceSettings?.timeZone || "America/New_York"
  });

  const handleInputChange = (field: string, value: string | number) => {
    setInvoiceSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    onNext({ invoiceSettings });
  };

  const currencies = [
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "EUR", name: "Euro", symbol: "€" },
    { code: "GBP", name: "British Pound", symbol: "£" },
    { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
    { code: "AUD", name: "Australian Dollar", symbol: "A$" },
    { code: "JPY", name: "Japanese Yen", symbol: "¥" },
    { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
    { code: "CNY", name: "Chinese Yuan", symbol: "¥" }
  ];

  const dateFormats = [
    { value: "MM/DD/YYYY", label: "MM/DD/YYYY (12/31/2024)" },
    { value: "DD/MM/YYYY", label: "DD/MM/YYYY (31/12/2024)" },
    { value: "YYYY-MM-DD", label: "YYYY-MM-DD (2024-12-31)" },
    { value: "DD MMM YYYY", label: "DD MMM YYYY (31 Dec 2024)" }
  ];

  const timeZones = [
    { value: "America/New_York", label: "Eastern Time (ET)" },
    { value: "America/Chicago", label: "Central Time (CT)" },
    { value: "America/Denver", label: "Mountain Time (MT)" },
    { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
    { value: "Europe/London", label: "London (GMT)" },
    { value: "Europe/Paris", label: "Paris (CET)" },
    { value: "Asia/Tokyo", label: "Tokyo (JST)" },
    { value: "Australia/Sydney", label: "Sydney (AEST)" }
  ];

  const isValid = invoiceSettings.invoicePrefix.trim().length > 0 && 
                 invoiceSettings.nextInvoiceNumber > 0;

  return (
    <Card className="w-full max-w-2xl mx-auto border-0 shadow-xl bg-white/95 backdrop-blur-md h-[80vh] flex flex-col">
      <CardHeader className="text-center pb-6 flex-shrink-0">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4"
        >
          <FileText className="w-8 h-8 text-white" />
        </motion.div>
        <CardTitle className="text-2xl font-light text-gray-900">
          Invoice Settings
        </CardTitle>
        <p className="text-gray-500 mt-2">
          Configure your invoice preferences and numbering system
        </p>
      </CardHeader>

      <CardContent className="space-y-6 flex-1 overflow-y-auto px-6 pb-4">
        {/* Invoice Numbering */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="invoicePrefix" className="text-base font-medium flex items-center gap-2">
              <Hash className="w-4 h-4" />
              Invoice Prefix
            </Label>
            <Input
              id="invoicePrefix"
              type="text"
              placeholder="INV-"
              value={invoiceSettings.invoicePrefix}
              onChange={(e) => handleInputChange("invoicePrefix", e.target.value)}
              className="h-12 text-base"
            />
            <p className="text-sm text-gray-500">
              Example: INV-1001, INV-1002
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nextInvoiceNumber" className="text-base font-medium">
              Starting Number
            </Label>
            <Input
              id="nextInvoiceNumber"
              type="number"
              min="1"
              value={invoiceSettings.nextInvoiceNumber}
              onChange={(e) => handleInputChange("nextInvoiceNumber", parseInt(e.target.value) || 1)}
              className="h-12 text-base"
            />
          </div>
        </div>

        {/* VAT and Payment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="defaultVat" className="text-base font-medium flex items-center gap-2">
              <Percent className="w-4 h-4" />
              Default VAT/Tax (%)
            </Label>
            <Input
              id="defaultVat"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={invoiceSettings.defaultVat}
              onChange={(e) => handleInputChange("defaultVat", e.target.value)}
              className="h-12 text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentTerms" className="text-base font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Payment Terms (Days)
            </Label>
            <Select 
              value={invoiceSettings.paymentTerms.toString()} 
              onValueChange={(value) => handleInputChange("paymentTerms", parseInt(value))}
            >
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="14">14 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="45">45 days</SelectItem>
                <SelectItem value="60">60 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Currency */}
        <div className="space-y-2">
          <Label className="text-base font-medium">
            Default Currency
          </Label>
          <Select value={invoiceSettings.currency} onValueChange={(value) => handleInputChange("currency", value)}>
            <SelectTrigger className="h-12">
              <SelectValue>
                {currencies.find(c => c.code === invoiceSettings.currency) && (
                  <div className="flex items-center gap-2">
                    <span>{currencies.find(c => c.code === invoiceSettings.currency)?.symbol}</span>
                    <span>{currencies.find(c => c.code === invoiceSettings.currency)?.name}</span>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {currencies.map((currency) => (
                <SelectItem key={currency.code} value={currency.code}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">{currency.symbol}</span>
                    <span>{currency.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Format */}
        <div className="space-y-2">
          <Label className="text-base font-medium">
            Date Format
          </Label>
          <Select value={invoiceSettings.dateFormat} onValueChange={(value) => handleInputChange("dateFormat", value)}>
            <SelectTrigger className="h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dateFormats.map((format) => (
                <SelectItem key={format.value} value={format.value}>
                  {format.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Time Zone */}
        <div className="space-y-2">
          <Label className="text-base font-medium">
            Time Zone
          </Label>
          <Select value={invoiceSettings.timeZone} onValueChange={(value) => handleInputChange("timeZone", value)}>
            <SelectTrigger className="h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeZones.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Role indicator */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>{isAdmin ? "Admin Access" : "Staff Access"}:</strong> {" "}
            {isAdmin 
              ? "You have full access to all invoice settings and can modify company-wide preferences."
              : "You can configure personal invoice settings. Contact an admin for company-wide changes."
            }
          </p>
        </div>

      </CardContent>
      
      {/* Fixed Navigation at bottom */}
      <div className="flex justify-between items-center p-6 border-t-2 border-gray-200/50 dark:border-gray-700/50 bg-white/80 backdrop-blur-xl shadow-lg">
        {onBack ? (
          <Button 
            variant="outline" 
            onClick={onBack} 
            className="px-8 py-3 h-12 text-base font-medium border-2 border-white/30 hover:border-white/50 bg-white/20 hover:bg-white/30 backdrop-blur-sm"
          >
            Back
          </Button>
        ) : (
          <div />
        )}
        
        <Button 
          onClick={handleNext}
          disabled={!isValid}
          className="px-8 py-3 h-12 text-base font-medium bg-blue-600/90 hover:bg-blue-700/90 text-white border-2 border-blue-400/50 shadow-lg hover:shadow-xl backdrop-blur-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </Button>
      </div>
    </Card>
  );
}