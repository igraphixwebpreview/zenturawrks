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
import { Save, Send, RotateCcw, Plus, Edit, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { setupAuthHeaders } from "@/lib/auth";
import { replaceTemplateVariables } from "@/lib/email";

const templateSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
});

type TemplateForm = z.infer<typeof templateSchema>;

const availableVariables = [
  { key: "client_name", description: "Client's name" },
  { key: "invoice_number", description: "Invoice number" },
  { key: "invoice_date", description: "Invoice date" },
  { key: "due_date", description: "Due date" },
  { key: "total_amount", description: "Total amount" },
  { key: "company_name", description: "Company name" },
];

const sampleData = {
  client_name: "John Doe",
  invoice_number: "INV-0001",
  invoice_date: "December 15, 2023",
  due_date: "January 15, 2024",
  total_amount: "$2,500.00",
  company_name: "Acme Corporation",
};

export function EmailTemplateEditor() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: template, isLoading } = useQuery({
    queryKey: ["/api/email-templates/default"],
    queryFn: async () => {
      const headers = await setupAuthHeaders();
      const response = await fetch("/api/email-templates/default", {
        headers,
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch template");
      return response.json();
    },
  });

  const updateTemplate = useMutation({
    mutationFn: async (data: TemplateForm) => {
      const headers = await setupAuthHeaders();
      const response = await fetch(`/api/email-templates/${template.id}`, {
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
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates/default"] });
      toast({
        title: "Template updated",
        description: "Email template has been saved successfully.",
      });
    },
  });

  const form = useForm<TemplateForm>({
    resolver: zodResolver(templateSchema),
    values: template ? {
      subject: template.subject,
      body: template.body,
    } : undefined,
  });

  const watchedSubject = form.watch("subject");
  const watchedBody = form.watch("body");

  const onSubmit = (data: TemplateForm) => {
    updateTemplate.mutate(data);
  };

  const resetToDefault = () => {
    if (template) {
      form.reset({
        subject: "Your Invoice from iGraphix Marketing & Co. - [Invoice #{invoice_number}]",
        body: `Dear {client_name},

Please find attached your invoice #{invoice_number} for the services rendered.

You can download your invoice using the button below. Thank you for your business.

Invoice Details:
- Invoice Number: {invoice_number}
- Invoice Date: {invoice_date}
- Due Date: {due_date}
- Amount: {total_amount}

Best regards,
iGraphix Marketing & Co.`,
      });
    }
  };

  const previewSubject = watchedSubject ? replaceTemplateVariables(watchedSubject, sampleData) : "";
  const previewBody = watchedBody ? replaceTemplateVariables(watchedBody, sampleData) : "";

  if (isLoading) {
    return <div>Loading template...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Email Templates</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Template Editor */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Default Invoice Template</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject Line Template</Label>
                  <Input 
                    id="subject"
                    {...form.register("subject")}
                    placeholder="Email subject with variables"
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
                    rows={12}
                    placeholder="Email body with variables"
                  />
                  {form.formState.errors.body && (
                    <p className="text-sm text-destructive">{form.formState.errors.body.message}</p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:justify-between pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetToDefault}
                    className="flex-1 sm:flex-none"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset to Default
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateTemplate.isPending}
                    className="flex-1 sm:flex-none"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateTemplate.isPending ? "Saving..." : "Save Template"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Available Variables */}
          <Card>
            <CardHeader>
              <CardTitle>Available Variables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-4">
                  Use these variables in your template. They will be replaced with actual values when sending emails.
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {availableVariables.map((variable) => (
                    <div key={variable.key} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                      <Badge variant="secondary" className="font-mono">
                        {`{${variable.key}}`}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{variable.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Template Preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
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
                  <div className="mt-1 p-4 bg-muted/50 rounded border max-h-96 overflow-y-auto">
                    <div className="text-sm whitespace-pre-wrap">
                      {previewBody || "Enter a body template"}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test Email</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Send a test email to verify your template works correctly.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="test-email">Test Email Address</Label>
                  <Input 
                    id="test-email"
                    type="email"
                    placeholder="test@example.com"
                  />
                </div>
                <Button className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  Send Test Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
