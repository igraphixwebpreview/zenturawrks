import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, User, Globe } from "lucide-react";
import { uploadProfilePicture } from "@/lib/profile-upload";
import { useAuth } from "@/hooks/use-auth";

interface LanguageProfileStepProps {
  data: any;
  onNext: (data: any) => void;
  onBack?: () => void;
  isAdmin: boolean;
}

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "ar", name: "العربية", flag: "🇸🇦" }
];

export function LanguageProfileStep({ data, onNext, onBack, isAdmin }: LanguageProfileStepProps) {
  const { user } = useAuth();
  const [language, setLanguage] = useState(data.language || "en");
  const [displayName, setDisplayName] = useState(data.displayName || user?.displayName || "");
  const [profilePicture, setProfilePicture] = useState<string | null>(data.profilePicture || user?.photoURL || null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadProfilePicture(file);
      setProfilePicture(url);
    } catch (error) {
      console.error("Failed to upload profile picture:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleNext = () => {
    onNext({
      language,
      displayName,
      profilePicture
    });
  };

  const isValid = displayName.trim().length > 0;
  const selectedLanguage = languages.find(lang => lang.code === language);

  return (
    <Card className="w-full max-w-2xl mx-auto border-0 shadow-xl bg-white/95 backdrop-blur-md">
      <CardHeader className="text-center pb-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4"
        >
          <User className="w-8 h-8 text-white" />
        </motion.div>
        <CardTitle className="text-2xl font-light text-gray-900">
          Set Up Your Profile
        </CardTitle>
        <p className="text-gray-500 mt-2">
          Choose your preferred language and set up your professional profile
        </p>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Language Selection */}
        <div className="space-y-3">
          <Label className="text-base font-medium flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Preferred Language
          </Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="h-12 text-base">
              <SelectValue>
                {selectedLanguage && (
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{selectedLanguage.flag}</span>
                    <span>{selectedLanguage.name}</span>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{lang.flag}</span>
                    <span>{lang.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Display Name */}
        <div className="space-y-3">
          <Label htmlFor="displayName" className="text-base font-medium">
            Display Name
          </Label>
          <Input
            id="displayName"
            type="text"
            placeholder="Enter your full name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="h-12 text-base"
          />
          <p className="text-sm text-gray-500">
            This name will appear on your invoices and throughout the app
          </p>
        </div>

        {/* Profile Picture */}
        <div className="space-y-3">
          <Label className="text-base font-medium">
            Profile Picture {isAdmin ? "(Admin)" : "(Staff)"}
          </Label>
          <div className="flex items-center gap-6">
            <div className="relative">
              {profilePicture ? (
                <img
                  src={profilePicture}
                  alt="Profile"
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-4 border-white shadow-lg">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
              )}
              {isUploading && (
                <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="profile-upload"
                disabled={isUploading}
              />
              <Label
                htmlFor="profile-upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl cursor-pointer transition-colors text-sm font-medium"
              >
                <Camera className="w-4 h-4" />
                {profilePicture ? "Change Photo" : "Upload Photo"}
              </Label>
              <p className="text-xs text-gray-500 mt-2">
                Recommended: Square image, at least 200x200px
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-6">
          {onBack ? (
            <Button variant="outline" onClick={onBack} className="px-8">
              Back
            </Button>
          ) : (
            <div />
          )}
          
          <Button 
            onClick={handleNext}
            disabled={!isValid}
            className="px-8 bg-primary hover:bg-primary/90"
          >
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}