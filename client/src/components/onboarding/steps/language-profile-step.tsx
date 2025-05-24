import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Globe, Upload, Camera } from "lucide-react";
import { uploadProfilePicture } from "@/lib/profile-upload";

interface LanguageProfileStepProps {
  data: any;
  onNext: (data: any) => void;
  onBack?: () => void;
}

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
];

export function LanguageProfileStep({ data, onNext, onBack }: LanguageProfileStepProps) {
  const [language, setLanguage] = useState(data.language || 'en');
  const [displayName, setDisplayName] = useState(data.displayName || '');
  const [profilePicture, setProfilePicture] = useState(data.profilePicture || '');
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
          className="w-20 h-20 bg-gradient-to-br from-primary via-primary to-primary/80 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl"
        >
          <User className="w-10 h-10 text-white" />
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent mb-4">
            Set Up Your Profile
          </h1>
          <p className="text-gray-600 text-lg max-w-md mx-auto leading-relaxed">
            Choose your preferred language and create your professional profile
          </p>
        </motion.div>
      </motion.div>

      {/* Main Content Card */}
      <Card className="flex-1 border-0 shadow-xl bg-white/95 backdrop-blur-md">
        <CardContent className="p-8 space-y-8">
          
          {/* Language Selection */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="space-y-4"
          >
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
                      {selectedLanguage.name}
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{lang.flag}</span>
                      {lang.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>

          {/* Profile Picture */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="space-y-4"
          >
            <Label className="text-base font-medium flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Profile Picture (Optional)
            </Label>
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                  {profilePicture ? (
                    <img 
                      src={profilePicture} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-gray-400" />
                  )}
                </div>
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('profile-upload')?.click()}
                  disabled={isUploading}
                  className="h-12 px-6"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isUploading ? 'Uploading...' : 'Upload Photo'}
                </Button>
                <p className="text-sm text-gray-500 mt-2">
                  JPG, PNG up to 5MB
                </p>
              </div>
            </div>
          </motion.div>

          {/* Display Name */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="space-y-4"
          >
            <Label htmlFor="displayName" className="text-base font-medium">
              Display Name *
            </Label>
            <Input
              id="displayName"
              type="text"
              placeholder="Enter your full name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="h-12 text-base"
            />
          </motion.div>

        </CardContent>
      </Card>

      {/* Navigation */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="flex justify-between items-center"
      >
        {onBack ? (
          <Button variant="outline" onClick={onBack} className="px-8 h-12 rounded-xl">
            Back
          </Button>
        ) : (
          <div />
        )}
        
        <Button 
          onClick={handleNext}
          disabled={!isValid}
          className="px-8 h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
        >
          Next
        </Button>
      </motion.div>
    </div>
  );
}