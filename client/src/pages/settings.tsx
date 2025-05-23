import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BrandAssetUploader } from "@/components/ui/brand-asset-uploader";
import { Save, Plus, Trash2, User, Image } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { setupAuthHeaders } from "@/lib/auth";
import { useAuth } from "@/hooks/use-auth";

const settingsSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  companyAddress: z.string().min(1, "Company address is required"),
  companyPhone: z.string().optional(),
  companyEmail: z.string().email("Valid email is required"),
  invoicePrefix: z.string().min(1, "Invoice prefix is required"),
  nextInvoiceNumber: z.number().min(1, "Next invoice number must be at least 1"),
  defaultVat: z.number().min(0).max(100, "VAT must be between 0 and 100"),
  paymentTerms: z.number().min(1, "Payment terms must be at least 1 day"),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export default function Settings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/settings"],
    queryFn: async () => {
      const headers = await setupAuthHeaders();
      const response = await fetch("/api/settings", {
        headers,
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch settings");
      return response.json();
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (data: Partial<SettingsForm>) => {
      const headers = await setupAuthHeaders();
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to update settings");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Settings updated",
        description: "Your settings have been saved successfully.",
      });
    },
  });

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    values: settings ? {
      companyName: settings.companyName,
      companyAddress: settings.companyAddress,
      companyPhone: settings.companyPhone || "",
      companyEmail: settings.companyEmail,
      invoicePrefix: settings.invoicePrefix,
      nextInvoiceNumber: settings.nextInvoiceNumber,
      defaultVat: parseFloat(settings.defaultVat),
      paymentTerms: settings.paymentTerms,
    } : undefined,
  });

  const onSubmit = (data: SettingsForm) => {
    console.log("Form submitted with data:", data);
    console.log("Form errors:", form.formState.errors);
    updateSettings.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <div>Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input 
                  id="companyName"
                  {...form.register("companyName")}
                />
                {form.formState.errors.companyName && (
                  <p className="text-sm text-destructive">{form.formState.errors.companyName.message}</p>
                )}
              </div>
              
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="companyAddress">Company Address</Label>
                <Textarea 
                  id="companyAddress"
                  {...form.register("companyAddress")}
                  rows={3}
                  placeholder="Enter full company address"
                />
                {form.formState.errors.companyAddress && (
                  <p className="text-sm text-destructive">{form.formState.errors.companyAddress.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="companyPhone">Phone Number</Label>
                <Input 
                  id="companyPhone"
                  {...form.register("companyPhone")}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="companyEmail">Email Address</Label>
                <Input 
                  id="companyEmail"
                  type="email"
                  {...form.register("companyEmail")}
                />
                {form.formState.errors.companyEmail && (
                  <p className="text-sm text-destructive">{form.formState.errors.companyEmail.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Brand Assets */}
        <BrandAssetUploader 
          onAssetUpload={(file, type) => {
            // Handle asset upload
            console.log(`Uploaded ${type}:`, file.name);
            toast({
              title: "Brand Asset Uploaded",
              description: `Your ${type.replace('-', ' ')} has been uploaded successfully!`,
            });
          }}
        />

        {/* Invoice Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoicePrefix">Invoice Number Prefix</Label>
                <Input 
                  id="invoicePrefix"
                  {...form.register("invoicePrefix")}
                  placeholder="INV-"
                />
                {form.formState.errors.invoicePrefix && (
                  <p className="text-sm text-destructive">{form.formState.errors.invoicePrefix.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nextInvoiceNumber">Next Invoice Number</Label>
                <Input 
                  id="nextInvoiceNumber"
                  type="number"
                  {...form.register("nextInvoiceNumber", { valueAsNumber: true })}
                />
                {form.formState.errors.nextInvoiceNumber && (
                  <p className="text-sm text-destructive">{form.formState.errors.nextInvoiceNumber.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="defaultVat">Default VAT Rate (%)</Label>
                <Input 
                  id="defaultVat"
                  type="number"
                  step="0.01"
                  {...form.register("defaultVat", { valueAsNumber: true })}
                  placeholder="20.00"
                />
                {form.formState.errors.defaultVat && (
                  <p className="text-sm text-destructive">{form.formState.errors.defaultVat.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Default Payment Terms (days)</Label>
                <Input 
                  id="paymentTerms"
                  type="number"
                  {...form.register("paymentTerms", { valueAsNumber: true })}
                  placeholder="30"
                />
                {form.formState.errors.paymentTerms && (
                  <p className="text-sm text-destructive">{form.formState.errors.paymentTerms.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Management */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Admin Users</CardTitle>
            <Button type="button" variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Admin
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {user && (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                      Active
                    </Badge>
                    <Badge variant="outline">
                      Admin
                    </Badge>
                  </div>
                </div>
              )}
            </div>
            <Separator className="my-4" />
            <p className="text-sm text-muted-foreground">
              Additional admin management features will be available in future updates.
            </p>
          </CardContent>
        </Card>

        {/* Save Settings */}
        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={updateSettings.isPending}
            size="lg"
          >
            <Save className="h-4 w-4 mr-2" />
            {updateSettings.isPending ? "Saving..." : "Save All Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
