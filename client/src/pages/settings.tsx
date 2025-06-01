import { useState, useEffect } from "react";
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
import { Save, Image, User, Settings as SettingsIcon, Bell, Shield, Download, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { 
  uploadProfilePicture, 
  validateImageFile, 
  updateDisplayName, 
  getStoredProfilePicture, 
  getProfilePictureUrl, 
  getInitials, 
  subscribeToProfileUpdates,
  type UserProfile 
} from "@/lib/profile-upload";
import { getCurrentUser } from "@/lib/firebase-auth";
import { useProfilePicture } from "@/hooks/use-profile-picture";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { writeBatch, doc, query, collection, getDocs, where } from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { getSettings, updateSettings } from "@/lib/firebase-storage";

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
  const { user: firebaseUser, signOut } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile: userProfile, profilePicture: profilePictureUrl, profileMetadata, isLoading: profileLoading, error: profileError } = useProfilePicture();
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    invoiceReminders: true,
    paymentAlerts: true,
    systemUpdates: true,
  });

  // Initialize form with default values
  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      displayName: "User",
      companyName: "Your Company",
      companyAddress: "123 Business Street\nCity, State 12345",
      companyPhone: "+1 (555) 123-4567",
      companyEmail: "company@example.com",
      invoicePrefix: "INV-",
      nextInvoiceNumber: 1001,
      defaultVat: 0,
      paymentTerms: 30,
    },
  });

  // Load settings when component mounts
  useEffect(() => {
    const loadSettings = async () => {
      console.log("Starting to load settings...");
      console.log("Firebase user:", firebaseUser);
      
      if (!firebaseUser) {
        console.log("No Firebase user found, returning...");
        setError("No authenticated user found. Please sign in.");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        console.log("Fetching settings for user:", firebaseUser.uid);
        const settings = await getSettings(firebaseUser.uid);
        console.log("Retrieved settings:", settings);
        
        if (settings) {
          console.log("Updating form with settings:", settings);
          form.reset({
            displayName: userProfile?.displayName || "User",
            companyName: settings.companyName,
            companyAddress: settings.companyAddress,
            companyPhone: settings.companyPhone || "",
            companyEmail: userProfile?.email || settings.companyEmail,
            invoicePrefix: settings.invoicePrefix,
            nextInvoiceNumber: settings.nextInvoiceNumber,
            defaultVat: parseFloat(settings.defaultVat),
            paymentTerms: settings.paymentTerms,
          });
        } else {
          console.log("No settings found, creating default settings");
          // Create default settings
          const defaultSettings = await updateSettings(firebaseUser.uid, {
            companyName: "Your Company",
            companyAddress: "123 Business Street\nCity, State 12345",
            companyPhone: "+1 (555) 123-4567",
            companyEmail: userProfile?.email || "",
            invoicePrefix: "INV-",
            nextInvoiceNumber: 1,
            defaultVat: "0",
            paymentTerms: 30,
          });
          
          form.reset({
            displayName: userProfile?.displayName || "User",
            companyName: defaultSettings.companyName,
            companyAddress: defaultSettings.companyAddress,
            companyPhone: defaultSettings.companyPhone || "",
            companyEmail: userProfile?.email || defaultSettings.companyEmail,
            invoicePrefix: defaultSettings.invoicePrefix,
            nextInvoiceNumber: defaultSettings.nextInvoiceNumber,
            defaultVat: parseFloat(defaultSettings.defaultVat),
            paymentTerms: defaultSettings.paymentTerms,
          });
        }
      } catch (error: any) {
        console.error("Error loading settings:", error);
        setError(error.message || "Failed to load settings. Please try again.");
        toast({
          title: "Error",
          description: error.message || "Failed to load settings. Please try again.",
          variant: "destructive",
        });
      } finally {
        console.log("Finished loading settings");
        setLoading(false);
      }
    };

    loadSettings();
  }, [firebaseUser, userProfile, form, toast]);

  // Update form when user profile changes
  useEffect(() => {
    console.log("User profile changed:", userProfile);
    if (userProfile) {
      form.setValue('displayName', userProfile.displayName || form.getValues('displayName'));
      form.setValue('companyEmail', userProfile.email || form.getValues('companyEmail'));
    }
  }, [userProfile, form]);

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      await uploadProfilePicture(file);

      toast({
        title: "Profile Picture Updated",
        description: "Your profile picture has been updated successfully!",
      });

    } catch (error: any) {
      console.error("Profile picture upload error:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload profile picture. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const onSubmit = async (data: SettingsForm) => {
    if (!firebaseUser) return;

    try {
      // Update display name if changed
      if (userProfile && data.displayName !== userProfile.displayName) {
        await updateDisplayName(data.displayName);
      }

      // Update settings in Firebase
      await updateSettings(firebaseUser.uid, {
        companyName: data.companyName,
        companyAddress: data.companyAddress,
        companyPhone: data.companyPhone || null,
        companyEmail: data.companyEmail,
        invoicePrefix: data.invoicePrefix,
        nextInvoiceNumber: data.nextInvoiceNumber,
        defaultVat: data.defaultVat.toString(),
        paymentTerms: data.paymentTerms,
      });
      
      toast({
        title: "Settings updated",
        description: "Your settings have been saved successfully.",
      });
      
    } catch (error: any) {
      console.error("Settings update error:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (!firebaseUser) return;

    try {
      // 1. Download user data
      const userData = {
        profile: userProfile,
        settings: await getSettings(firebaseUser.uid),
        // Get all clients
        clients: (await getDocs(query(collection(db, 'clients'), where('userId', '==', firebaseUser.uid)))).docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })),
        // Get all invoices
        invoices: (await getDocs(query(collection(db, 'invoices'), where('userId', '==', firebaseUser.uid)))).docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })),
        // Get all email templates
        emailTemplates: (await getDocs(query(collection(db, 'email_templates'), where('userId', '==', firebaseUser.uid)))).docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })),
        // Get all reminders
        reminders: (await getDocs(query(collection(db, 'reminders'), where('userId', '==', firebaseUser.uid)))).docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })),
        // Get all payment records
        payments: (await getDocs(query(collection(db, 'payments'), where('userId', '==', firebaseUser.uid)))).docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })),
        // Get all login history
        loginHistory: (await getDocs(collection(db, 'users', firebaseUser.uid, 'loginHistory'))).docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })),
        // Add export metadata
        exportMetadata: {
          exportedAt: new Date().toISOString(),
          userId: firebaseUser.uid,
          userEmail: firebaseUser.email
        }
      };

      // Create and download the data file
      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `user-data-${firebaseUser.uid}-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // 2. Delete user's data from Firestore
      const batch = writeBatch(db);
      
      // Delete user document
      const userRef = doc(db, 'users', firebaseUser.uid);
      batch.delete(userRef);

      // Delete user's settings
      const settingsQuery = query(collection(db, 'settings'), where('userId', '==', firebaseUser.uid));
      const settingsSnapshot = await getDocs(settingsQuery);
      settingsSnapshot.docs.forEach(doc => batch.delete(doc.ref));

      // Delete user's clients
      const clientsQuery = query(collection(db, 'clients'), where('userId', '==', firebaseUser.uid));
      const clientsSnapshot = await getDocs(clientsQuery);
      clientsSnapshot.docs.forEach(doc => batch.delete(doc.ref));

      // Delete user's invoices
      const invoicesQuery = query(collection(db, 'invoices'), where('userId', '==', firebaseUser.uid));
      const invoicesSnapshot = await getDocs(invoicesQuery);
      invoicesSnapshot.docs.forEach(doc => batch.delete(doc.ref));

      // Delete user's email templates
      const templatesQuery = query(collection(db, 'email_templates'), where('userId', '==', firebaseUser.uid));
      const templatesSnapshot = await getDocs(templatesQuery);
      templatesSnapshot.docs.forEach(doc => batch.delete(doc.ref));

      // Delete user's reminders
      const remindersQuery = query(collection(db, 'reminders'), where('userId', '==', firebaseUser.uid));
      const remindersSnapshot = await getDocs(remindersQuery);
      remindersSnapshot.docs.forEach(doc => batch.delete(doc.ref));

      // Delete user's payments
      const paymentsQuery = query(collection(db, 'payments'), where('userId', '==', firebaseUser.uid));
      const paymentsSnapshot = await getDocs(paymentsQuery);
      paymentsSnapshot.docs.forEach(doc => batch.delete(doc.ref));

      // Delete user's login history
      const loginHistoryRef = collection(db, 'users', firebaseUser.uid, 'loginHistory');
      const loginHistorySnapshot = await getDocs(loginHistoryRef);
      loginHistorySnapshot.docs.forEach(doc => batch.delete(doc.ref));

      // Try to delete profile picture, but continue if it fails
      if (userProfile?.photoPath) {
        try {
          const storageRef = ref(storage, userProfile.photoPath);
          await deleteObject(storageRef);
        } catch (error: any) {
          console.warn("Could not delete profile picture:", error);
          // Continue with account deletion even if profile picture deletion fails
        }
      }

      // Commit all deletions
      await batch.commit();

      // 3. Delete Firebase Auth account
      await firebaseUser.delete();

      // 4. Sign out and redirect
      await signOut();
      window.location.href = '/login';

      toast({
        title: "Account Deleted",
        description: "Your account has been successfully deleted. A copy of your data has been downloaded.",
      });
    } catch (error: any) {
      console.error("Account deletion error:", error);
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (error) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center">
        <div className="text-destructive text-lg font-medium">
          {error}
        </div>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (profileLoading || loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center">
        <div className="relative">
          {/* Outer ring */}
          <div className="absolute inset-0 w-16 h-16 border-4 border-primary/20 rounded-full animate-pulse" />
          
          {/* Middle ring */}
          <div className="absolute inset-0 w-16 h-16 border-4 border-primary/40 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
          
          {/* Inner spinning ring */}
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="mt-8 text-lg text-muted-foreground font-medium">
          Loading settings...
        </p>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center">
        <div className="text-destructive text-lg font-medium">
          Error loading profile: {profileError.message}
        </div>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (!firebaseUser || !userProfile) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="company" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            Company
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="relative group">
                    <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center overflow-hidden border-4 border-background shadow-lg">
                      {profilePictureUrl ? (
                        <img
                          src={profilePictureUrl}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-medium text-primary-foreground">
                          {getInitials(userProfile.displayName || '')}
                        </span>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <label htmlFor="profile-upload" className={`cursor-pointer ${uploading || profileLoading ? 'pointer-events-none' : ''}`}>
                        {uploading ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        ) : (
                          <Image className="h-5 w-5 text-white" />
                        )}
                        <span className="sr-only">
                          {uploading ? 'Uploading...' : profileLoading ? 'Loading...' : profilePictureUrl ? 'Change Photo' : 'Upload Photo'}
                        </span>
                      </label>
                    </div>
                    <input
                      id="profile-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleProfilePictureUpload}
                      disabled={uploading || profileLoading}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="text-lg font-medium text-foreground">
                        {userProfile.displayName || userProfile.email?.split('@')[0] || 'User'}
                      </h3>
                      <p className="text-sm text-muted-foreground">{userProfile.email}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={firebaseUser?.emailVerified ? "secondary" : "destructive"}
                        className={firebaseUser?.emailVerified ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"}
                      >
                        {firebaseUser?.emailVerified ? 'Active' : 'Verify Email'}
                      </Badge>
                      <Badge variant="outline">
                        {userProfile.isAdmin ? 'Admin' : 'User'}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input 
                      id="displayName"
                      placeholder="Enter your display name"
                      {...form.register('displayName')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profileEmail">Email Address</Label>
                    <Input 
                      id="profileEmail"
                      type="email"
                      value={userProfile.email || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company">
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
                </div>
                
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="companyAddress">Company Address</Label>
                  <Textarea 
                    id="companyAddress"
                    {...form.register("companyAddress")}
                    rows={3}
                    placeholder="Enter full company address"
                  />
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
                </div>
              </div>
            </CardContent>
          </Card>

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
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="nextInvoiceNumber">Next Invoice Number</Label>
                  <Input 
                    id="nextInvoiceNumber"
                    type="number"
                    {...form.register("nextInvoiceNumber", { valueAsNumber: true })}
                  />
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
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="paymentTerms">Default Payment Terms (days)</Label>
                  <Input 
                    id="paymentTerms"
                    type="number"
                    {...form.register("paymentTerms", { valueAsNumber: true })}
                    placeholder="30"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, emailNotifications: checked }))}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Invoice Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Get reminded about upcoming and overdue invoices
                    </p>
                  </div>
                  <Switch
                    checked={notifications.invoiceReminders}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, invoiceReminders: checked }))}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Payment Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications for payments and refunds
                    </p>
                  </div>
                  <Switch
                    checked={notifications.paymentAlerts}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, paymentAlerts: checked }))}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>System Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Stay informed about new features and updates
                    </p>
                  </div>
                  <Switch
                    checked={notifications.systemUpdates}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, systemUpdates: checked }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Button variant="outline">Enable 2FA</Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Download Account Data</Label>
                    <p className="text-sm text-muted-foreground">
                      Download a copy of your account data
                    </p>
                  </div>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Download Data
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-destructive">Delete Account</Label>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all associated data
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="flex items-center gap-2">
                        <Trash2 className="h-4 w-4" />
                        Delete Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your account
                          and remove all associated data from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete Account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button 
          type="submit" 
          size="lg"
          onClick={form.handleSubmit(onSubmit)}
        >
          <Save className="h-4 w-4 mr-2" />
          Save All Settings
        </Button>
      </div>
    </div>
  );
}
