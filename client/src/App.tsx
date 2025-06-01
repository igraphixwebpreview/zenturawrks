import { useState, useEffect, useRef } from "react";
import { Switch, Route, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { LoginForm } from "@/components/auth/login-form";
import { Sidebar } from "@/components/ui/sidebar";
import { MobileNav } from "@/components/ui/mobile-nav";
import { ThemeCustomizer } from "@/components/ui/theme-customizer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Menu, Plus, Home, FileText, Bell, Mail, BarChart3, Settings as SettingsIcon, Zap, Send, Download, Layers, LogOut, Search, LifeBuoy, User, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { checkSuspiciousSignIn, isIPVerified as checkIsIPVerified, markLoginAsVerified, verifyEmail } from "@/lib/firebase-auth";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useToast } from "@/hooks/use-toast";
import { WelcomeScreen } from "@/components/auth/welcome-screen";

// Pages
import Dashboard from "@/pages/dashboard";
import CreateInvoice from "@/pages/create-invoice";
import Invoices from "@/pages/invoices";
import Clients from "@/pages/clients";
import Templates from "@/pages/templates";
import Settings from "@/pages/settings";
import Export from "@/pages/export";
import Reminders from "@/pages/reminders";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";
import VerifyEmailPage from "@/pages/verify-email";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { auth } from "./lib/firebase";

// Mock Data Types
interface MockInvoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  amount: number;
  status: string;
}

interface MockClient {
  id: string;
  name: string;
  email: string;
  company?: string;
}

// Mock Data
const mockInvoices: MockInvoice[] = [
  { id: 'inv_001', invoiceNumber: 'INV-001', clientName: 'Acme Corp', amount: 1500.00, status: 'Paid' },
  { id: 'inv_002', invoiceNumber: 'INV-002', clientName: 'Beta Solutions', amount: 750.50, status: 'Pending' },
  { id: 'inv_003', invoiceNumber: 'INV-003', clientName: 'Acme Corp', amount: 2200.00, status: 'Draft' },
];

const mockClients: MockClient[] = [
  { id: 'client_001', name: 'John Doe', email: 'john.doe@acmecorp.com', company: 'Acme Corp' },
  { id: 'client_002', name: 'Jane Smith', email: 'jane.smith@betasolutions.com', company: 'Beta Solutions' },
];

function AppLayout({ children, onSignOut }: { children: React.ReactNode, onSignOut?: () => void }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<(MockInvoice | MockClient)[]>([]);

  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const { signOut, user } = useAuth();

  // Basic client-side search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    const lowerCaseQuery = query.toLowerCase();

    const filteredInvoices = mockInvoices.filter(invoice => 
      invoice.invoiceNumber.toLowerCase().includes(lowerCaseQuery) ||
      invoice.clientName.toLowerCase().includes(lowerCaseQuery) ||
      invoice.status.toLowerCase().includes(lowerCaseQuery)
    );

    const filteredClients = mockClients.filter(client =>
      client.name.toLowerCase().includes(lowerCaseQuery) ||
      client.email.toLowerCase().includes(lowerCaseQuery) ||
      (client.company && client.company.toLowerCase().includes(lowerCaseQuery))
    );

    setSearchResults([...filteredInvoices, ...filteredClients]);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Top Header */}
      <div className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        {/* Logo and Menu Button */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
          <img src="/logo.png" alt="Logo" className="h-5 sm:h-6 w-auto object-contain" />
        </div>
        
        {/* Right side icons and buttons */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setShowSearchDialog(true)}
          >
            <Search className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <LifeBuoy className="w-4 h-4" /> {/* Placeholder for Support */}
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Bell className="w-4 h-4" /> {/* Placeholder for Notifications */}
          </Button>
          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="rounded-full w-6 h-6 p-0">
                 {/* Placeholder User Icon */}
                 <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {user?.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-medium text-primary-foreground">
                        {user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                      </span>
                    )}
                 </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="flex flex-col items-start p-2">
                <span className="font-medium">{user?.displayName || user?.email}</span>
                <span className="text-xs text-muted-foreground">{user?.email}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setLocation('/settings')}>
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onSignOut || signOut}>
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Menu Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 md:hidden">
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 shadow-lg">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">Menu</h2>
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="flex-1 p-4 space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => { setLocation('/'); setSidebarOpen(false); }}
                >
                  <Home className="mr-2 h-4 w-4" /> Dashboard
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => { setLocation('/create-invoice'); setSidebarOpen(false); }}
                >
                  <Plus className="mr-2 h-4 w-4" /> Create Invoice
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => { setLocation('/invoices'); setSidebarOpen(false); }}
                >
                  <FileText className="mr-2 h-4 w-4" /> Invoices
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => { setLocation('/clients'); setSidebarOpen(false); }}
                >
                  <User className="mr-2 h-4 w-4" /> Clients
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => { setLocation('/templates'); setSidebarOpen(false); }}
                >
                  <Layers className="mr-2 h-4 w-4" /> Templates
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => { setLocation('/export'); setSidebarOpen(false); }}
                >
                  <Download className="mr-2 h-4 w-4" /> Export
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => { setLocation('/reminders'); setSidebarOpen(false); }}
                >
                  <Bell className="mr-2 h-4 w-4" /> Reminders
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => { setLocation('/settings'); setSidebarOpen(false); }}
                >
                  <SettingsIcon className="mr-2 h-4 w-4" /> Settings
                </Button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar and Main Content Area */}
      <div className="flex flex-1 pt-16"> {/* pt-16 to offset the fixed header */}
        {/* Sidebar */}
        {!isMobile && (
          <div className="relative z-10">
            <Sidebar
              collapsed={sidebarCollapsed}
              onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
              onSignOut={onSignOut}
            />
          </div>
        )}

        {/* Main Content */}
        <main className={`flex-1 overflow-y-auto custom-scrollbar ${isMobile ? 'p-2 pb-24' : 'p-8'}`}>
          <div className={`${isMobile ? 'w-full max-w-none' : 'max-w-6xl'} mx-auto`}>
              {children}
          </div>
        </main>
      </div>

      {/* Search Dialog */}
      <Dialog open={showSearchDialog} onOpenChange={setShowSearchDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Search</DialogTitle>
            <DialogDescription>
              Search for invoices, clients, or other data.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              id="search"
              placeholder="Enter keywords..."
              className="col-span-3"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {/* Search results */}
            <div className="mt-4 max-h-60 overflow-y-auto">
              {searchResults.length === 0 && searchQuery.length > 1 ? (
                <p className="text-center text-muted-foreground">No results found.</p>
              ) : searchResults.map((result) => (
                <div key={result.id} className="p-2 border-b last:border-b-0">
                  {'invoiceNumber' in result ? (
                    <div>
                      <p className="font-medium">Invoice: {result.invoiceNumber}</p>
                      <p className="text-sm text-muted-foreground">Client: {result.clientName}, Amount: ${result.amount.toFixed(2)}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium">Client: {result.name}</p>
                      <p className="text-sm text-muted-foreground">Email: {result.email}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}

function AuthenticatedApp({ onSignOut }: { onSignOut?: () => void }) {
  const [location] = useLocation();
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const { user, loading } = useAuth();
  const [isSuspicious, setIsSuspicious] = useState(false);
  const [checkingSuspicious, setCheckingSuspicious] = useState(true);
  const [isCurrentIPVerified, setIsCurrentIPVerified] = useState(false);
  const hasCheckedSuspicious = useRef(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check for stored company logo
  useEffect(() => {
    const storedLogo = localStorage.getItem('company-logo');
    if (storedLogo) {
      setCompanyLogo(storedLogo);
    }
  }, []);

  // Initial check for suspicious sign-in and IP verification
  useEffect(() => {
    const checkInitialStatus = async () => {
      if (user && !hasCheckedSuspicious.current) {
        try {
          console.log("AuthenticatedApp: Performing initial suspicious sign-in check.");
          // Get current IP
          const response = await fetch('https://api.ipify.org?format=json');
          const { ip } = await response.json();
          console.log("AuthenticatedApp: Fetched IP for initial check:", ip);

          // Check if this is a suspicious sign-in
          const suspicious = await checkSuspiciousSignIn(user.uid, ip);
          setIsSuspicious(suspicious);

          // Check if IP is verified
          const verified = await checkIsIPVerified(user.uid, ip);
          setIsCurrentIPVerified(verified);

          hasCheckedSuspicious.current = true;
           console.log("AuthenticatedApp: Initial check result - isSuspicious:", suspicious, "isCurrentIPVerified:", verified);

        } catch (error) {
          console.error("AuthenticatedApp: Error checking initial suspicious status:", error);
          setIsSuspicious(false);
          setIsCurrentIPVerified(false);
          hasCheckedSuspicious.current = true;
        } finally {
             setCheckingSuspicious(false);
        }
      }
       else if (!user) {
           // If user logs out while AuthenticatedApp is mounted, reset state
            setIsSuspicious(false);
            setIsCurrentIPVerified(false);
            setCheckingSuspicious(true);
            hasCheckedSuspicious.current = false;
             if (pollingIntervalRef.current) {
                 clearInterval(pollingIntervalRef.current);
                 pollingIntervalRef.current = null;
             }
       }
    };

    checkInitialStatus();

  }, [user, loading]);


  // Polling to detect IP verification status changes
  useEffect(() => {
       // Only start polling if not loading, user exists, suspicious, and IP is not verified
      if (!loading && !checkingSuspicious && user && isSuspicious && !isCurrentIPVerified) {
           console.log("AuthenticatedApp: Starting IP verification polling.");
           // Start polling if not already polling
            if (!pollingIntervalRef.current) {
                pollingIntervalRef.current = setInterval(async () => {
                    console.log("AuthenticatedApp: Polling for IP verification status...");
                    if (user) {
                        try {
                             // Get current IP
                            const response = await fetch('https://api.ipify.org?format=json');
                            const { ip } = await response.json();

                            const verified = await checkIsIPVerified(user.uid, ip);
                             console.log("AuthenticatedApp: Polling checkIsIPVerified result:", verified);
                            setIsCurrentIPVerified(verified);

                            // If verified, the main render logic will handle the transition
                            if (verified) {
                                console.log("AuthenticatedApp: Polling detected IP verified. Stopping polling.");
                                 if (pollingIntervalRef.current) {
                                     clearInterval(pollingIntervalRef.current);
                                     pollingIntervalRef.current = null;
                                 }
                            }
                        } catch (error) {
                            console.error("AuthenticatedApp: Error during polling for IP verification:", error);
                            // Continue polling on error
                        }
                    }
                }, 5000); // Poll every 5 seconds
            }
      } else {
           // If conditions for polling are not met, ensure polling is stopped
            if (pollingIntervalRef.current) {
                console.log("AuthenticatedApp: Conditions for polling not met. Stopping polling.");
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
      }

      // Cleanup interval on effect cleanup or when component unmounts
      return () => {
          console.log("AuthenticatedApp: useEffect cleanup. Clearing polling interval if active.");
          if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
          }
      };

  }, [user, loading, checkingSuspicious, isSuspicious, isCurrentIPVerified]);


  // Determine whether to render the VerifyEmailPage or the main AppLayout
  // Redirect to VerifyEmailPage if email is not verified, OR if email is verified but suspicious and IP is not verified.
  const shouldRenderVerifyEmailPage = !user?.emailVerified || (isSuspicious && !isCurrentIPVerified);

  if (shouldRenderVerifyEmailPage) {
      console.log("AuthenticatedApp: Rendering VerifyEmailPage. Email Verified:", user?.emailVerified, "Suspicious:", isSuspicious, "IP Verified:", isCurrentIPVerified);
    return <VerifyEmailPage />;
  }

   console.log("AuthenticatedApp: Rendering main AppLayout. Email Verified:", user?.emailVerified, "Suspicious:", isSuspicious, "IP Verified:", isCurrentIPVerified);
  // If we get here, email is verified AND (not suspicious OR IP is verified)
  return (
      <AppLayout onSignOut={onSignOut}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ 
              duration: 0.3, 
              ease: "easeInOut"
            }}
            className="h-full"
          >
            <Switch>
              {/* Public routes */}
              {/* NOTE: These should ideally not be reachable if AuthenticatedApp is rendered, but defining them here for clarity if needed */}
              <Route path="/login" component={LoginForm} /> {/* Should be handled by AppContent redirect */}
              
              {/* Email Verification Page (accessible when authenticated but not fully verified) */}
              {/* This route is still needed for direct navigation, but rendering is controlled by shouldRenderVerifyEmailPage logic above */}
               {/* <Route path="/verify-email" component={VerifyEmailPage} /> */}

              {/* Protected routes */}
              <Route path="/">
                <ProtectedRoute><Dashboard /></ProtectedRoute>
              </Route>
              <Route path="/create-invoice">
                <ProtectedRoute><CreateInvoice /></ProtectedRoute>
              </Route>
              <Route path="/invoices">
                <ProtectedRoute><Invoices /></ProtectedRoute>
              </Route>
              <Route path="/clients">
                <ProtectedRoute><Clients /></ProtectedRoute>
              </Route>
              <Route path="/templates">
                <ProtectedRoute><Templates /></ProtectedRoute>
              </Route>
              <Route path="/export">
                <ProtectedRoute><Export /></ProtectedRoute>
              </Route>
              <Route path="/reminders">
                <ProtectedRoute><Reminders /></ProtectedRoute>
              </Route>
              <Route path="/settings">
                <ProtectedRoute><Settings /></ProtectedRoute>
              </Route>
              
              {/* 404 Not Found */}
              <Route component={NotFound} />
            </Switch>
          </motion.div>
        </AnimatePresence>
      </AppLayout>
  );
}

function AppContent() {
  const { user, loading, signOut } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [signInMethod, setSignInMethod] = useState<'email' | 'google' | 'facebook' | 'apple'>('email');
  const prevUser = useRef(user);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Effect to handle initial load
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Effect to handle sign-in state
  useEffect(() => {
    if (user && !prevUser.current) {
      setLoggingIn(true);
      const timer = setTimeout(() => {
        setLoggingIn(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
    prevUser.current = user;
  }, [user]);

  // Effect to handle sign-out state
  useEffect(() => {
    if (!user && prevUser.current) {
      setLoggingOut(true);
      const timer = setTimeout(() => {
        setLoggingOut(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  // Effect to handle email verification action code from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oobCode = params.get('oobCode');
    const mode = params.get('mode');

    if (oobCode && mode === 'verifyEmail' && user && !loading) {
      const handleVerification = async () => {
        try {
          await verifyEmail(oobCode);
          const response = await fetch('https://api.ipify.org?format=json');
          const { ip } = await response.json();

          try {
            await markLoginAsVerified(user.uid, ip);
          } catch (markError) {
            console.error("Error calling markLoginAsVerified:", markError);
            toast({
              title: "Device Verification Failed",
              description: "Could not mark device as verified after email verification.",
              variant: "destructive",
            });
          }

          toast({
            title: "Email Verified!",
            description: "Your email has been successfully verified.",
          });

          setShowWelcome(true);
          setIsNewUser(true);
          setSignInMethod('email');

          params.delete('oobCode');
          params.delete('mode');
          const newUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
          window.history.replaceState({}, '', newUrl);
        } catch (error) {
          console.error("Error handling verification:", error);
          toast({
            title: "Verification Failed",
            description: "Failed to verify your email. Please try again.",
            variant: "destructive",
          });
        }
      };

      handleVerification();
    }
  }, [user, loading, toast]);

  // Effect to handle first-time user detection and redirection
  useEffect(() => {
    if (user && !prevUser.current) {
      const checkIfNewUser = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const isNewUser = !userDoc.exists();
          
          if (isNewUser) {
            setShowWelcome(true);
            setIsNewUser(true);
            setSignInMethod('email');
          } else {
            setLocation('/');
          }
        } catch (error) {
          console.error("Error checking if user is new:", error);
          setLocation('/');
        }
      };
      
      checkIfNewUser();
    }
  }, [user, setLocation]);

  const handleSignOut = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      // Add a small delay to ensure the loading screen is visible
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLocation("/login");
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Ensure loggingOut state is reset even if there's an error
      setLoggingOut(false);
    }
  };

  // Show loading screen during initial load, sign-in, or sign-out
  if (isInitialLoad || loggingIn || loggingOut) {
    return (
      <LoadingScreen 
        message={
          loggingIn ? "Signing you in..." :
          loggingOut ? "Signing you out..." :
          "Loading your workspace..."
        } 
      />
    );
  }

  // If welcome screen should be shown, render it
  if (showWelcome) {
    return (
      <WelcomeScreen 
        isNewUser={isNewUser} 
        signInMethod={signInMethod} 
        onComplete={() => setShowWelcome(false)}
      />
    );
  }

  // If user exists, render the AuthenticatedApp with protected routes setup
  if (user) {
    return <AuthenticatedApp onSignOut={handleSignOut} />;
  }

  // If no user, render the LoginForm
  return <LoginForm />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <AppContent />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
