import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Download, 
  Building2, 
  FileSpreadsheet, 
  Calculator, 
  Waves, 
  BookOpen,
  Zap,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickExportFormat {
  id: string;
  name: string;
  description: string;
  icon: string;
  popular?: boolean;
  fileExtension: string;
}

const quickExportFormats: QuickExportFormat[] = [
  {
    id: 'quickbooks_iif',
    name: 'QuickBooks',
    description: 'Export directly to QuickBooks Desktop',
    icon: 'Building2',
    popular: true,
    fileExtension: '.iif'
  },
  {
    id: 'xero_csv',
    name: 'Xero',
    description: 'Cloud-based accounting platform',
    icon: 'FileSpreadsheet',
    popular: true,
    fileExtension: '.csv'
  },
  {
    id: 'sage_csv',
    name: 'Sage',
    description: 'Professional accounting software',
    icon: 'Calculator',
    fileExtension: '.csv'
  },
  {
    id: 'wave_csv',
    name: 'Wave',
    description: 'Free accounting for small business',
    icon: 'Waves',
    popular: true,
    fileExtension: '.csv'
  },
  {
    id: 'freshbooks_csv',
    name: 'FreshBooks',
    description: 'Invoice and expense tracking',
    icon: 'BookOpen',
    fileExtension: '.csv'
  },
  {
    id: 'generic_csv',
    name: 'Generic CSV',
    description: 'Universal format for any platform',
    icon: 'Download',
    fileExtension: '.csv'
  }
];

const getIcon = (iconName: string) => {
  const icons = {
    Building2,
    FileSpreadsheet,
    Calculator,
    Waves,
    BookOpen,
    Download
  };
  return icons[iconName as keyof typeof icons] || Download;
};

export function QuickExport() {
  const { toast } = useToast();
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);

  const exportMutation = useMutation({
    mutationFn: async (format: string) => {
      const response = await fetch("/api/export/quick", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-firebase-uid": "demo-uid",
        },
        credentials: "include",
        body: JSON.stringify({
          format,
          status: "all", // Export all invoices by default
        }),
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      return response.json();
    },
    onSuccess: (data, format) => {
      const formatName = quickExportFormats.find(f => f.id === format)?.name || "Unknown";
      
      if (data.success && data.downloadUrl) {
        // Create download link
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.download = data.filename || `invoices-${format}-${new Date().toISOString().split('T')[0]}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: "Export Successful!",
          description: `Your invoices have been exported to ${formatName} format and downloaded.`,
        });
      } else {
        toast({
          title: "No Data Found",
          description: data.message || "No invoices available for export.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any, format) => {
      const formatName = quickExportFormats.find(f => f.id === format)?.name || "Unknown";
      toast({
        title: "Export Failed",
        description: `Failed to export to ${formatName}: ${error.message}`,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setExportingFormat(null);
    },
  });

  const handleQuickExport = (format: string) => {
    setExportingFormat(format);
    exportMutation.mutate(format);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Quick Export
        </CardTitle>
        <CardDescription>
          Instantly export all your invoices to popular accounting platforms
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickExportFormats.map((format) => {
            const IconComponent = getIcon(format.icon);
            const isExporting = exportingFormat === format.id;
            
            return (
              <Button
                key={format.id}
                variant="outline"
                className={cn(
                  "h-auto p-4 flex flex-col items-start gap-3 text-left transition-all duration-200",
                  "hover:bg-primary/5 hover:border-primary/50 hover:scale-105",
                  isExporting && "bg-primary/10 border-primary"
                )}
                onClick={() => handleQuickExport(format.id)}
                disabled={isExporting}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-sm">{format.name}</span>
                  </div>
                  {format.popular && (
                    <Badge variant="secondary" className="text-xs px-2 py-0.5">
                      Popular
                    </Badge>
                  )}
                </div>
                
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {format.description}
                </p>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Format: {format.fileExtension}</span>
                  <ExternalLink className="h-3 w-3" />
                </div>
                
                {isExporting && (
                  <div className="flex items-center gap-2 text-xs text-primary">
                    <div className="animate-spin h-3 w-3 border border-primary border-t-transparent rounded-full"></div>
                    Exporting...
                  </div>
                )}
              </Button>
            );
          })}
        </div>
        
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium">Quick Export Features</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Exports all invoices instantly</li>
                <li>• Optimized formats for each platform</li>
                <li>• Automatic file download</li>
                <li>• No configuration required</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}