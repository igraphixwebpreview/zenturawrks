import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Eye, Download, FileText, Palette } from "lucide-react";

interface TemplatePreviewProps {
  onPreviewWord?: () => void;
  onDownloadTemplate?: () => void;
}

export function TemplatePreview({ onPreviewWord, onDownloadTemplate }: TemplatePreviewProps) {
  const { toast } = useToast();

  const handleWordPreview = () => {
    toast({
      title: "Opening Word Preview",
      description: "Your template will open in Microsoft Word for preview...",
    });
    onPreviewWord?.();
  };

  const handleDownloadTemplate = () => {
    toast({
      title: "Downloading Template",
      description: "Your custom invoice template is being downloaded...",
    });
    onDownloadTemplate?.();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          One-Click Template Preview
        </CardTitle>
        <CardDescription>
          Preview your invoice template in Microsoft Word with real data before generating invoices.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Template Preview Card */}
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-20 h-24 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <FileText className="w-10 h-10 text-blue-600" />
            </div>
            
            <div>
              <h3 className="font-medium text-lg mb-2">Professional Invoice Template</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Your customized template with company branding
              </p>
              
              <div className="flex gap-2 justify-center mb-4">
                <Badge variant="secondary">PDF Ready</Badge>
                <Badge variant="secondary">Word Compatible</Badge>
                <Badge variant="secondary">Fully Customizable</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={handleWordPreview}
            className="flex-1"
            variant="default"
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview in Word
          </Button>
          
          <Button 
            onClick={handleDownloadTemplate}
            variant="outline"
            className="flex-1"
          >
            <Download className="mr-2 h-4 w-4" />
            Download Template
          </Button>
        </div>

        {/* Template Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Template Features:</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Professional header design</li>
              <li>• Company logo placement</li>
              <li>• Automatic calculations</li>
              <li>• Payment terms section</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Supported Formats:</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Microsoft Word (.docx)</li>
              <li>• PDF Generation</li>
              <li>• Email Templates</li>
              <li>• Print Ready</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DragDropTemplateBuilder() {
  const { toast } = useToast();
  const [selectedElements, setSelectedElements] = useState<string[]>([]);

  const templateElements = [
    { id: 'header', name: 'Company Header', icon: '🏢', required: true },
    { id: 'logo', name: 'Company Logo', icon: '🖼️', required: false },
    { id: 'invoice-details', name: 'Invoice Details', icon: '📄', required: true },
    { id: 'client-info', name: 'Client Information', icon: '👤', required: true },
    { id: 'items-table', name: 'Items Table', icon: '📊', required: true },
    { id: 'totals', name: 'Totals Section', icon: '💰', required: true },
    { id: 'payment-terms', name: 'Payment Terms', icon: '📋', required: false },
    { id: 'notes', name: 'Notes Section', icon: '📝', required: false },
    { id: 'footer', name: 'Footer', icon: '⬇️', required: false },
  ];

  const handleElementToggle = (elementId: string) => {
    setSelectedElements(prev =>
      prev.includes(elementId)
        ? prev.filter(id => id !== elementId)
        : [...prev, elementId]
    );
  };

  const handleBuildTemplate = () => {
    toast({
      title: "Building Custom Template",
      description: `Creating template with ${selectedElements.length} elements...`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Drag-and-Drop Template Builder
        </CardTitle>
        <CardDescription>
          Create custom invoice templates by selecting and arranging elements exactly how you want them.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Template Elements */}
        <div>
          <h3 className="font-medium mb-4">Select Template Elements:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {templateElements.map((element) => (
              <div
                key={element.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedElements.includes(element.id) || element.required
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                } ${element.required ? 'opacity-75' : ''}`}
                onClick={() => !element.required && handleElementToggle(element.id)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{element.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{element.name}</h4>
                    {element.required && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        Required
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Template Preview Area */}
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="font-medium mb-2">Template Preview</h3>
            <p className="text-sm mb-4">
              Your custom template layout will appear here
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {selectedElements.map((elementId) => {
                const element = templateElements.find(e => e.id === elementId);
                return element ? (
                  <Badge key={elementId} variant="outline">
                    {element.icon} {element.name}
                  </Badge>
                ) : null;
              })}
              {templateElements.filter(e => e.required).map((element) => (
                <Badge key={element.id} variant="default">
                  {element.icon} {element.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Build Button */}
        <div className="flex justify-center">
          <Button 
            onClick={handleBuildTemplate}
            size="lg"
            className="min-w-48"
          >
            <Palette className="mr-2 h-4 w-4" />
            Build Custom Template
          </Button>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            How to Use:
          </h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>1. Select the elements you want in your template</li>
            <li>2. Required elements are included automatically</li>
            <li>3. Click "Build Custom Template" to generate</li>
            <li>4. Download and customize in Microsoft Word</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}