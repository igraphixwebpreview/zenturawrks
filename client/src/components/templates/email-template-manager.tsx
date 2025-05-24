import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Send, RotateCcw, Plus, Edit, Trash2, Mail } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { setupAuthHeaders } from "@/lib/auth";
import { replaceTemplateVariables } from "@/lib/email";

const templateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
  invoiceType: z.string().min(1, "Invoice type is required"),
});

type TemplateForm = z.infer<typeof templateSchema>;

const sampleData = {
  client_name: "John Doe",
  invoice_number: "INV-0001",
  invoice_date: "December 15, 2023",
  due_date: "January 15, 2024",
  total_amount: "$2,500.00",
  company_name: "Acme Corporation",
};

const invoiceTypes = [
  { value: "quotation", label: "Quotation" },
  { value: "invoice_with_deposit", label: "Invoice with Deposit" },
  { value: "final_invoice", label: "Final Invoice" },
  { value: "receipt", label: "Receipt" },
  { value: "balance_due_receipt", label: "Balance Due Receipt" },
  { value: "contract_invoice", label: "Contract Invoice" },
];

const defaultTemplates = {
  quotation: {
    name: "Quotation Email",
    subject: "Your Quotation from {company_name} - #{invoice_number}",
    body: `Dear {client_name},

Thank you for your interest in our services. Please find attached your quotation #{invoice_number}.

Quotation Details:
- Quotation Number: {invoice_number}
- Date: {invoice_date}
- Valid Until: {due_date}
- Total Amount: {total_amount}

This quotation is valid for 30 days. Please review the details and let us know if you have any questions.

Best regards,
{company_name}`
  },
  final_invoice: {
    name: "Final Invoice Email",
    subject: "Invoice #{invoice_number} from {company_name}",
    body: `Dear {client_name},

Please find attached your invoice #{invoice_number} for the services completed.

Invoice Details:
- Invoice Number: {invoice_number}
- Invoice Date: {invoice_date}
- Due Date: {due_date}
- Amount Due: {total_amount}

Payment is due by {due_date}. Thank you for your business!

Best regards,
{company_name}`
  },
  receipt: {
    name: "Receipt Email",
    subject: "Payment Receipt #{invoice_number} from {company_name}",
    body: `Dear {client_name},

Thank you for your payment! Please find attached your receipt #{invoice_number}.

Receipt Details:
- Receipt Number: {invoice_number}
- Payment Date: {invoice_date}
- Amount Paid: {total_amount}

We appreciate your prompt payment and continued business.

Best regards,
{company_name}`
  }
};

export function EmailTemplateManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [selectedInvoiceType, setSelectedInvoiceType] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);

  // Fetch all email templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["/api/email-templates"],
    queryFn: async () => {
      const headers = await setupAuthHeaders();
      const response = await fetch("/api/email-templates", {
        headers,
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch templates");
      return response.json();
    },
  });

  // Get current template (either selected or for creation)
  const currentTemplate = selectedTemplateId 
    ? templates.find((t: any) => t.id === selectedTemplateId)
    : null;

  const form = useForm<TemplateForm>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      subject: "",
      body: "",
      invoiceType: "",
    },
    values: currentTemplate ? {
      name: currentTemplate.name,
      subject: currentTemplate.subject,
      body: currentTemplate.body,
      invoiceType: currentTemplate.invoiceType,
    } : undefined,
  });

  const watchedSubject = form.watch("subject");
  const watchedBody = form.watch("body");

  // Create template mutation
  const createTemplate = useMutation({
    mutationFn: async (data: TemplateForm) => {
      const headers = await setupAuthHeaders();
      const response = await fetch("/api/email-templates", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to create template");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates"] });
      setIsCreating(false);
      toast({
        title: "Template created",
        description: "Email template has been created successfully.",
      });
    },
  });

  // Update template mutation
  const updateTemplate = useMutation({
    mutationFn: async (data: TemplateForm) => {
      if (!selectedTemplateId) throw new Error("No template selected");
      const headers = await setupAuthHeaders();
      const response = await fetch(`/api/email-templates/${selectedTemplateId}`, {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to update template");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates"] });
      toast({
        title: "Template updated",
        description: "Email template has been updated successfully.",
      });
    },
  });

  // Delete template mutation
  const deleteTemplate = useMutation({
    mutationFn: async (id: number) => {
      const headers = await setupAuthHeaders();
      const response = await fetch(`/api/email-templates/${id}`, {
        method: "DELETE",
        headers,
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete template");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates"] });
      setSelectedTemplateId(null);
      toast({
        title: "Template deleted",
        description: "Email template has been deleted successfully.",
      });
    },
  });

  const onSubmit = (data: TemplateForm) => {
    if (isCreating) {
      createTemplate.mutate(data);
    } else if (selectedTemplateId) {
      updateTemplate.mutate(data);
    }
  };

  const loadDefaultTemplate = (invoiceType: string) => {
    const defaultTemplate = defaultTemplates[invoiceType as keyof typeof defaultTemplates];
    if (defaultTemplate) {
      form.setValue("name", defaultTemplate.name);
      form.setValue("subject", defaultTemplate.subject);
      form.setValue("body", defaultTemplate.body);
      form.setValue("invoiceType", invoiceType);
    }
  };

  const startCreating = () => {
    setIsCreating(true);
    setSelectedTemplateId(null);
    form.reset({
      name: "",
      subject: "",
      body: "",
      invoiceType: "",
    });
  };

  const previewSubject = watchedSubject ? replaceTemplateVariables(watchedSubject, sampleData) : "";
  const previewBody = watchedBody ? replaceTemplateVariables(watchedBody, sampleData) : "";

  if (isLoading) {
    return <div>Loading templates...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Email Templates</h1>
        <Button onClick={startCreating} className="btn-modern btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Create/Edit Template Section - Full Width */}
      {(isCreating || selectedTemplateId) && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>
              {isCreating ? "Create New Template" : "Edit Template"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name</Label>
                  <Input 
                    id="name"
                    {...form.register("name")}
                    placeholder="Template name"
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoiceType">Invoice Type</Label>
                  <Select
                    value={form.watch("invoiceType")}
                    onValueChange={(value) => form.setValue("invoiceType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {invoiceTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.invoiceType && (
                    <p className="text-sm text-destructive">{form.formState.errors.invoiceType.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject Line Template</Label>
                <Input 
                  id="subject"
                  {...form.register("subject")}
                  placeholder="Email subject with variables like {client_name}"
                />
                {form.formState.errors.subject && (
                  <p className="text-sm text-destructive">{form.formState.errors.subject.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Email Body Template</Label>
                <Textarea 
                  id="body"
                  {...form.register("body")}
                  rows={8}
                  placeholder="Email body with variables like {client_name}, {invoice_number}, etc."
                />
                {form.formState.errors.body && (
                  <p className="text-sm text-destructive">{form.formState.errors.body.message}</p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  type="submit" 
                  disabled={createTemplate.isPending || updateTemplate.isPending}
                  className="btn-modern btn-primary flex-shrink-0"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isCreating ? "Create Template" : "Update Template"}
                </Button>
                
                {isCreating && (
                  <Select
                    value={selectedInvoiceType}
                    onValueChange={(value) => {
                      setSelectedInvoiceType(value);
                      loadDefaultTemplate(value);
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-48 flex-shrink-0">
                      <SelectValue placeholder="Load default for..." />
                    </SelectTrigger>
                    <SelectContent>
                      {invoiceTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          Default {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Template List */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Templates by Invoice Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invoiceTypes.map((type) => {
                  const typeTemplates = templates.filter((t: any) => t.invoiceType === type.value);
                  return (
                    <div key={type.value} className="space-y-2">
                      <h4 className="font-medium text-sm text-foreground">{type.label}</h4>
                      {typeTemplates.length > 0 ? (
                        typeTemplates.map((template: any) => (
                          <div
                            key={template.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                              selectedTemplateId === template.id
                                ? "bg-primary/10 border-primary"
                                : "bg-muted/50 hover:bg-muted border-border"
                            }`}
                            onClick={() => {
                              setSelectedTemplateId(template.id);
                              setIsCreating(false);
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm">{template.name}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {template.subject}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteTemplate.mutate(template.id);
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground">No templates</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview and Variables */}
        <div className="space-y-6">
          {/* Preview Section */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {(isCreating || selectedTemplateId) ? (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Subject:</Label>
                    <div className="mt-1 p-3 bg-muted/50 rounded border">
                      <p className="text-sm font-medium">{previewSubject || "Enter a subject template"}</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Body:</Label>
                    <div className="mt-1 p-4 bg-muted/50 rounded border max-h-64 overflow-y-auto">
                      <div className="text-sm whitespace-pre-wrap">
                        {previewBody || "Enter a body template"}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Select a template to see preview
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Variable Guide */}
          <Card>
            <CardHeader>
              <CardTitle>Available Variables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Badge variant="outline">{"{client_name}"}</Badge>
                  <Badge variant="outline">{"{invoice_number}"}</Badge>
                  <Badge variant="outline">{"{invoice_date}"}</Badge>
                  <Badge variant="outline">{"{due_date}"}</Badge>
                  <Badge variant="outline">{"{total_amount}"}</Badge>
                  <Badge variant="outline">{"{company_name}"}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Use these variables in your templates. They will be automatically replaced with actual values when sending emails.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}