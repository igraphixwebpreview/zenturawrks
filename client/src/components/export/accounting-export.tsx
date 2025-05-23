import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, Download, Building2, FileSpreadsheet, Calculator, Waves, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ExportFormat {
  id: string;
  name: string;
  description: string;
  fileExtension: string;
  icon: string;
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

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

export function AccountingExport() {
  const { toast } = useToast();
  const [selectedFormat, setSelectedFormat] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });

  // Fetch available export formats
  const { data: formats, isLoading: formatsLoading } = useQuery({
    queryKey: ["/api/export/formats"],
    queryFn: async () => {
      const response = await fetch("/api/export/formats", {
        headers: { "x-firebase-uid": "demo-uid" },
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch formats");
      return response.json() as Promise<ExportFormat[]>;
    },
  });

  // Export invoices mutation
  const exportMutation = useMutation({
    mutationFn: async (data: { format: string; dateRange?: any; status: string }) => {
      const response = await fetch("/api/export/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-firebase-uid": "demo-uid",
        },
        body: JSON.stringify({
          format: data.format,
          dateRange: data.dateRange ? {
            start: data.dateRange.from?.toISOString(),
            end: data.dateRange.to?.toISOString(),
          } : undefined,
          status: data.status,
        }),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Export failed");
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Export Ready!",
          description: `Successfully prepared ${data.count} invoices for ${data.format} export.`,
        });
      } else {
        toast({
          title: "No Data Found",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleExport = () => {
    if (!selectedFormat) {
      toast({
        title: "Format Required",
        description: "Please select an accounting software format.",
        variant: "destructive",
      });
      return;
    }

    exportMutation.mutate({
      format: selectedFormat,
      dateRange: dateRange.from && dateRange.to ? dateRange : undefined,
      status: selectedStatus,
    });
  };

  if (formatsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Export Options...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export to Accounting Software
          </CardTitle>
          <CardDescription>
            Export your invoice data to popular accounting platforms for seamless bookkeeping.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Export Format Selection */}
          <div className="space-y-3">
            <Label htmlFor="format">Select Accounting Software</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {formats?.map((format) => {
                const IconComponent = getIcon(format.icon);
                return (
                  <div
                    key={format.id}
                    className={cn(
                      "border rounded-lg p-4 cursor-pointer transition-all hover:border-blue-500",
                      selectedFormat === format.id
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                        : "border-gray-200 dark:border-gray-700"
                    )}
                    onClick={() => setSelectedFormat(format.id)}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent className="h-6 w-6 text-blue-600" />
                      <div className="flex-1">
                        <h3 className="font-medium">{format.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {format.description}
                        </p>
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {format.fileExtension}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status Filter */}
            <div className="space-y-2">
              <Label htmlFor="status">Invoice Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Invoices</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-2">
              <Label>Date Range (Optional)</Label>
              <div className="grid grid-cols-2 gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !dateRange?.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        format(dateRange.from, "PPP")
                      ) : (
                        <span>From date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange?.from}
                      onSelect={(date) =>
                        setDateRange({ ...dateRange, from: date })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal",
                        !dateRange?.to && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.to ? (
                        format(dateRange.to, "PPP")
                      ) : (
                        <span>To date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange?.to}
                      onSelect={(date) =>
                        setDateRange({ ...dateRange, to: date })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Export Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleExport}
              disabled={!selectedFormat || exportMutation.isPending}
              className="min-w-32"
            >
              {exportMutation.isPending ? (
                "Exporting..."
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export Data
                </>
              )}
            </Button>
          </div>

          {/* Export Preview */}
          {exportMutation.data?.success && (
            <Card className="border-green-200 bg-green-50 dark:bg-green-950">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <h4 className="font-medium text-green-800 dark:text-green-200">
                    Export Ready
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {exportMutation.data.message}
                  </p>
                  <div className="mt-3">
                    <h5 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                      Invoices to Export:
                    </h5>
                    <div className="space-y-1">
                      {exportMutation.data.invoices?.slice(0, 5).map((invoice: any) => (
                        <div key={invoice.id} className="text-xs text-green-700 dark:text-green-300">
                          {invoice.invoiceNumber} - {invoice.clientName} - ${invoice.total}
                        </div>
                      ))}
                      {exportMutation.data.invoices?.length > 5 && (
                        <div className="text-xs text-green-600 dark:text-green-400">
                          +{exportMutation.data.invoices.length - 5} more invoices...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}