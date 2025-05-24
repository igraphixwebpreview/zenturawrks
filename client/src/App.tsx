import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
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
import { WelcomeScreen } from "@/components/ui/welcome-screen";
import { Button } from "@/components/ui/button";
import { Menu, Plus, Home, FileText, Bell, Mail, BarChart3, Settings as SettingsIcon, Zap, Send, Download, Layers, LogOut } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const { signOut, user } = useAuth();

  return (
    <div 
      className="flex h-screen dark:from-gray-900 dark:via-blue-900 dark:to-purple-900"
      style={{
        background: `linear-gradient(to bottom right, hsl(var(--bg-from)), hsl(var(--bg-via)), hsl(var(--bg-to)))`
      }}
    >
      {/* Dynamic glassy overlay effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/20 pointer-events-none" />
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle 800px at 100% 200px, hsl(var(--primary) / 0.3), transparent)`
        }}
      />
      
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-md md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar - Hidden on mobile */}
      {!isMobile && (
        <div className="relative">
          <Sidebar 
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Glassy header */}
        <div className="flex h-16 items-center justify-between px-4 md:px-8 border-b border-white/20 backdrop-blur-xl bg-white/10">
          {/* Left side - Mobile menu or logo */}
          <div className="flex items-center gap-4">
            {isMobile && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="btn-modern"
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem onClick={() => setLocation('/create-invoice')}>
                    <Zap className="mr-2 h-4 w-4" />
                    Quick Invoice
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation('/reminders')}>
                    <Send className="mr-2 h-4 w-4" />
                    Bulk Email
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation('/export')}>
                    <Download className="mr-2 h-4 w-4" />
                    Export Report
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation('/templates')}>
                    <Layers className="mr-2 h-4 w-4" />
                    Templates
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setLocation('/reminders')}>
                    <Bell className="mr-2 h-4 w-4" />
                    Reminders
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation('/templates')}>
                    <Mail className="mr-2 h-4 w-4" />
                    Email Templates
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLocation('/settings')}>
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Invoice Generator
            </h1>
          </div>

          {/* Right side - Theme customizer and actions */}
          <div className="flex items-center gap-3">
            <ThemeCustomizer />
            {!isMobile && (
              <Button 
                onClick={() => setLocation('/create-invoice')}
                className="btn-modern btn-primary"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Invoice
              </Button>
            )}
          </div>
        </div>

        {/* Glassy content area */}
        <main className={`flex-1 overflow-y-auto custom-scrollbar ${isMobile ? 'p-2 pb-24' : 'p-4 md:p-8'}`}>
          <div className={`${isMobile ? 'w-full max-w-none' : 'max-w-6xl'} mx-auto`}>
            <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-6 border border-white/20 shadow-2xl">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function AuthenticatedApp() {
  const [location, setLocation] = useLocation();
  const [showWelcome, setShowWelcome] = useState(true);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const { user } = useAuth();
  
  // Check for stored company logo
  useEffect(() => {
    const storedLogo = localStorage.getItem('company-logo');
    if (storedLogo) {
      setCompanyLogo(storedLogo);
    }
  }, []);
  
  if (showWelcome) {
    return (
      <WelcomeScreen 
        onComplete={() => setShowWelcome(false)}
        userEmail={user?.email}
        companyLogo={companyLogo || undefined}
      />
    );
  }
  
  return (
    <>
      <AppLayout>
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
              <Route path="/" component={Dashboard} />
              <Route path="/create-invoice" component={CreateInvoice} />
              <Route path="/invoices" component={Invoices} />
              <Route path="/clients" component={Clients} />
              <Route path="/templates" component={Templates} />
              <Route path="/export" component={Export} />
              <Route path="/reminders" component={Reminders} />
              <Route path="/settings" component={Settings} />
              <Route component={NotFound} />
            </Switch>
          </motion.div>
        </AnimatePresence>
      </AppLayout>
      
      {/* Beautiful Mobile Navigation */}
      <MobileNav />
      
      {/* Floating Action Button for Quick Invoice Creation */}
      <motion.button 
        className="fab md:hidden"
        onClick={() => setLocation('/create-invoice')}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <Plus className="w-6 h-6" />
      </motion.button>
    </>
  );
}

function AppContent() {
  // Skip authentication for demo mode - go straight to the app
  return <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <AppContent />
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
