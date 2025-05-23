import { useState, useRef } from "react";
import { Upload, Image, X, Check, Building2, Star, Smartphone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface LogoUploaderProps {
  onLogoUpload?: (file: File, type: 'logo' | 'favicon' | 'app-icon') => void;
  className?: string;
}

interface BrandAsset {
  file: File;
  preview: string;
  name: string;
}

export function LogoUploader({ onLogoUpload, className }: LogoUploaderProps) {
  const [dragActive, setDragActive] = useState<{[key: string]: boolean}>({});
  const [brandAssets, setBrandAssets] = useState<{
    logo?: BrandAsset;
    favicon?: BrandAsset;
    'app-icon'?: BrandAsset;
  }>({});
  
  const fileInputRefs = {
    logo: useRef<HTMLInputElement>(null),
    favicon: useRef<HTMLInputElement>(null),
    'app-icon': useRef<HTMLInputElement>(null)
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files: FileList) => {
    const file = files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        
        // Determine file type based on dimensions (simplified logic)
        const img = document.createElement('img');
        img.onload = () => {
          let type: 'logo' | 'favicon' | 'app-icon' = 'logo';
          
          if (img.width === img.height && img.width <= 64) {
            type = 'favicon';
          } else if (img.width === img.height && img.width <= 512) {
            type = 'app-icon';
          }
          
          const uploadedFile: UploadedFile = {
            file,
            preview,
            type
          };
          
          setUploadedFiles(prev => [...prev.filter(f => f.type !== type), uploadedFile]);
          onLogoUpload?.(file, type);
        };
        img.src = preview;
      };
      reader.readAsDataURL(file);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'logo':
        return { label: 'Company Logo', description: 'For invoice headers', color: 'bg-blue-500' };
      case 'favicon':
        return { label: 'Favicon', description: '16x16 or 32x32 px', color: 'bg-green-500' };
      case 'app-icon':
        return { label: 'App Icon', description: '256x256 or 512x512 px', color: 'bg-purple-500' };
      default:
        return { label: 'Image', description: '', color: 'bg-gray-500' };
    }
  };

  return (
    <Card className={cn("modern-card", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image className="w-5 h-5" />
          Brand Assets
        </CardTitle>
        <CardDescription>
          Upload your company logo, favicon, and app icon to personalize your invoices
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Drag & Drop Area */}
        <div
          className={cn(
            "relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300",
            dragActive 
              ? "border-primary bg-primary/5 scale-[1.02]" 
              : "border-border hover:border-primary/50 hover:bg-accent/30"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
            multiple
          />
          
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-2">Drop your images here</h3>
              <p className="text-muted-foreground mb-4">
                or click to browse your files
              </p>
              <Button 
                onClick={onButtonClick}
                className="btn-modern btn-primary"
                size="sm"
              >
                Choose Files
              </Button>
            </div>
            
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="secondary" className="rounded-full">PNG</Badge>
              <Badge variant="secondary" className="rounded-full">JPG</Badge>
              <Badge variant="secondary" className="rounded-full">SVG</Badge>
              <Badge variant="secondary" className="rounded-full">WEBP</Badge>
            </div>
          </div>
        </div>

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Uploaded Files
            </h4>
            <div className="grid gap-3">
              {uploadedFiles.map((uploadedFile, index) => {
                const typeInfo = getTypeInfo(uploadedFile.type);
                return (
                  <div 
                    key={index}
                    className="flex items-center gap-4 p-4 bg-accent/30 rounded-2xl border border-border/50"
                  >
                    <div className="relative">
                      <img 
                        src={uploadedFile.preview} 
                        alt="Uploaded"
                        className="w-12 h-12 rounded-xl object-cover border border-border"
                      />
                      <div className={cn(
                        "absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center",
                        typeInfo.color
                      )}>
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <h5 className="font-medium text-sm">{typeInfo.label}</h5>
                      <p className="text-xs text-muted-foreground">
                        {uploadedFile.file.name} • {typeInfo.description}
                      </p>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Usage Guidelines */}
        <div className="bg-accent/20 rounded-2xl p-4 space-y-3">
          <h4 className="font-semibold text-sm">Guidelines</h4>
          <div className="grid gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span><strong>Company Logo:</strong> High resolution, transparent background preferred</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span><strong>Favicon:</strong> Square format, 16x16 or 32x32 pixels</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span><strong>App Icon:</strong> Square format, 256x256 or 512x512 pixels</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}