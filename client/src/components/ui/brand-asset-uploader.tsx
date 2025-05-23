import { useState, useRef } from "react";
import { Upload, Building2, Star, Smartphone, X, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BrandAssetUploaderProps {
  onAssetUpload?: (file: File, type: 'logo' | 'favicon' | 'app-icon') => void;
  className?: string;
}

interface BrandAsset {
  file: File;
  preview: string;
  name: string;
}

const assetTypes = [
  {
    type: 'logo' as const,
    title: 'Company Logo',
    description: 'For invoice headers & documents',
    icon: Building2,
    acceptedSizes: 'Any size, transparent background preferred',
    color: 'from-blue-500 to-blue-600'
  },
  {
    type: 'favicon' as const,
    title: 'Favicon',
    description: 'Browser tab icon',
    icon: Star,
    acceptedSizes: '16x16 or 32x32 pixels',
    color: 'from-green-500 to-green-600'
  },
  {
    type: 'app-icon' as const,
    title: 'App Icon',
    description: 'Mobile & desktop app icon',
    icon: Smartphone,
    acceptedSizes: '256x256 or 512x512 pixels',
    color: 'from-purple-500 to-purple-600'
  }
];

export function BrandAssetUploader({ onAssetUpload, className }: BrandAssetUploaderProps) {
  const [dragActive, setDragActive] = useState<{[key: string]: boolean}>({});
  const [assets, setAssets] = useState<{[key: string]: BrandAsset}>({});
  
  const fileInputRefs = {
    logo: useRef<HTMLInputElement>(null),
    favicon: useRef<HTMLInputElement>(null),
    'app-icon': useRef<HTMLInputElement>(null)
  };

  const handleDrag = (e: React.DragEvent, type: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(prev => ({ ...prev, [type]: true }));
    } else if (e.type === "dragleave") {
      setDragActive(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleDrop = (e: React.DragEvent, type: 'logo' | 'favicon' | 'app-icon') => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [type]: false }));
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0], type);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon' | 'app-icon') => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0], type);
    }
  };

  const handleFile = (file: File, type: 'logo' | 'favicon' | 'app-icon') => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        const asset: BrandAsset = {
          file,
          preview,
          name: file.name
        };
        
        setAssets(prev => ({ ...prev, [type]: asset }));
        onAssetUpload?.(file, type);
        
        // Update favicon immediately if it's a favicon upload
        if (type === 'favicon') {
          updateFavicon(preview);
        }
        
        // Update app title logo if it's a logo upload
        if (type === 'logo') {
          updateAppLogo(preview);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const updateFavicon = (dataUrl: string) => {
    // Update favicon in the document head
    let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = dataUrl;
  };

  const updateAppLogo = (dataUrl: string) => {
    // Save logo to localStorage for use throughout the app
    localStorage.setItem('company-logo', dataUrl);
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('logo-updated', { detail: dataUrl }));
  };

  const removeAsset = (type: string) => {
    setAssets(prev => {
      const newAssets = { ...prev };
      delete newAssets[type];
      return newAssets;
    });
    
    if (type === 'favicon') {
      // Reset to default favicon
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
      if (link) {
        link.href = '/favicon.ico';
      }
    }
    
    if (type === 'logo') {
      localStorage.removeItem('company-logo');
      window.dispatchEvent(new CustomEvent('logo-updated', { detail: null }));
    }
  };

  const openFileDialog = (type: 'logo' | 'favicon' | 'app-icon') => {
    fileInputRefs[type].current?.click();
  };

  return (
    <Card className={cn("modern-card", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Brand Assets
        </CardTitle>
        <CardDescription>
          Upload your brand assets to personalize your invoices and app experience
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6">
          {assetTypes.map((assetType) => {
            const Icon = assetType.icon;
            const hasAsset = assets[assetType.type];
            const isActive = dragActive[assetType.type];
            
            return (
              <div key={assetType.type} className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-2xl bg-gradient-to-r flex items-center justify-center", assetType.color)}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{assetType.title}</h4>
                    <p className="text-xs text-muted-foreground">{assetType.description}</p>
                  </div>
                </div>
                
                {hasAsset ? (
                  <div className="flex items-center gap-4 p-4 bg-accent/30 rounded-2xl border border-border/50">
                    <div className="relative">
                      <img 
                        src={hasAsset.preview} 
                        alt={assetType.title}
                        className="w-16 h-16 rounded-xl object-cover border border-border"
                      />
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <h5 className="font-medium text-sm">{hasAsset.name}</h5>
                      <p className="text-xs text-muted-foreground">Successfully uploaded</p>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAsset(assetType.type)}
                      className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    className={cn(
                      "relative border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-300 cursor-pointer",
                      isActive 
                        ? "border-primary bg-primary/5 scale-[1.02]" 
                        : "border-border hover:border-primary/50 hover:bg-accent/30"
                    )}
                    onDragEnter={(e) => handleDrag(e, assetType.type)}
                    onDragLeave={(e) => handleDrag(e, assetType.type)}
                    onDragOver={(e) => handleDrag(e, assetType.type)}
                    onDrop={(e) => handleDrop(e, assetType.type)}
                    onClick={() => openFileDialog(assetType.type)}
                  >
                    <input
                      ref={fileInputRefs[assetType.type]}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileInput(e, assetType.type)}
                      className="hidden"
                    />
                    
                    <div className="space-y-3">
                      <div className="w-12 h-12 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center">
                        <Upload className="w-6 h-6 text-primary" />
                      </div>
                      
                      <div>
                        <h5 className="font-medium text-sm mb-1">Drop your {assetType.title.toLowerCase()} here</h5>
                        <p className="text-xs text-muted-foreground mb-2">
                          {assetType.acceptedSizes}
                        </p>
                        <Button 
                          size="sm"
                          variant="outline"
                          className="btn-modern"
                          type="button"
                        >
                          Choose File
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}