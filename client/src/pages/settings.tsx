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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { BrandAssetUploader } from "@/components/ui/brand-asset-uploader";
import { Save, Plus, Trash2, User, Image } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { uploadProfilePicture, validateImageFile, updateDisplayName } from "@/lib/profile-upload";

const settingsSchema = z.object({
  displayName: z.string().min(1, "Display name is required"),
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
  const [uploading, setUploading] = useState(false);

  // Initialize form with default values for now
  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      displayName: user?.displayName || "User",
      companyName: "Your Company",
      companyAddress: "123 Business Street\nCity, State 12345",
      companyPhone: "+1 (555) 123-4567",
      companyEmail: user?.email || "company@example.com",
      invoicePrefix: "INV-",
      nextInvoiceNumber: 1001,
      defaultVat: 0,
      paymentTerms: 30,
    },
  });

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      
      // Validate the file
      validateImageFile(file);
      
      // Upload the file to Firebase Storage
      const downloadURL = await uploadProfilePicture(file);
      
      toast({
        title: "Profile Picture Updated",
        description: "Your profile picture has been updated successfully!",
      });
      
      // Refresh the page to show the new profile picture
      window.location.reload();
      
    } catch (error: any) {
      console.error("Profile picture upload error:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload profile picture. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: SettingsForm) => {
    try {
      // Update display name if it changed
      if (data.displayName !== user?.displayName) {
        await updateDisplayName(data.displayName);
      }
      
      // TODO: Save other settings to database when backend is ready
      
      toast({
        title: "Settings updated",
        description: "Your settings have been saved successfully.",
      });
      
      // Refresh the page to show updated display name everywhere
      window.location.reload();
      
    } catch (error: any) {
      console.error("Settings update error:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    }
  };

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

        {/* Profile Management */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {user && (
                <div className="flex items-start space-x-4">
                  <div className="relative group">
                    <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center overflow-hidden border-4 border-background shadow-lg">
                      {user.photoURL ? (
                        <img 
                          src={user.photoURL} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-medium text-primary-foreground">
                          {user.displayName?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label htmlFor="profile-upload" className="cursor-pointer">
                        <Image className="h-5 w-5 text-white" />
                        <span className="sr-only">Upload profile picture</span>
                      </label>
                    </div>
                    <input
                      id="profile-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleProfilePictureUpload}
                      disabled={uploading}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="text-lg font-medium text-foreground">
                        {user.displayName || user.email.split('@')[0]}
                      </h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                        Active
                      </Badge>
                      <Badge variant="outline">
                        {user.isAdmin ? 'Admin' : 'User'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Account created: {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter your display name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-2">
                  <Label htmlFor="profileEmail">Email Address</Label>
                  <Input 
                    id="profileEmail"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Image className="h-4 w-4 mr-2" />
                  Change Picture
                </Button>
                <Button variant="outline" size="sm">
                  Update Profile
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Settings */}
        <div className="flex justify-end">
          <Button 
            type="submit" 
            size="lg"
          >
            <Save className="h-4 w-4 mr-2" />
            Save All Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
