import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  File, 
  LayoutDashboard, 
  Plus, 
  FileText, 
  Mail, 
  Settings, 
  Download,
  Clock,
  LogOut,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  collapsed?: boolean;
  onToggle?: () => void;
}

const navigationItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Create Invoice", 
    href: "/create-invoice",
    icon: Plus,
  },
  {
    title: "All Invoices",
    href: "/invoices", 
    icon: FileText,
  },
  {
    title: "Email Templates",
    href: "/templates",
    icon: Mail,
  },
  {
    title: "Export Data",
    href: "/export",
    icon: Download,
  },
  {
    title: "Reminders",
    href: "/reminders",
    icon: Clock,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar({ className, collapsed = false, onToggle, ...props }: SidebarProps) {
  const [location] = useLocation();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div
      className={cn(
        "flex h-screen flex-col border-r border-border bg-background",
        collapsed ? "w-16" : "w-64",
        "transition-all duration-300 ease-in-out",
        className
      )}
      {...props}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-xs font-bold text-primary-foreground">IG</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">InvoiceGen</h1>
              <p className="text-xs text-muted-foreground">iGraphix Marketing & Co.</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <span className="text-sm font-bold text-primary-foreground">IG</span>
          </div>
        )}
        {onToggle && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="ml-auto"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        <div className="space-y-8">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start h-16 py-6 leading-relaxed",
                    collapsed ? "px-2" : "px-3",
                    isActive && "bg-primary/10 text-primary hover:bg-primary/20 border-r-2 border-primary"
                  )}
                  title={collapsed ? item.title : undefined}
                >
                  <Icon className={cn("h-4 w-4", collapsed ? "mx-auto" : "mr-3")} />
                  {!collapsed && <span>{item.title}</span>}
                </Button>
              </Link>
            );
          })}
        </div>
      </nav>

      <Separator />

      {/* User Section */}
      <div className="p-2">
        {!collapsed && user && (
          <div className="flex items-center space-x-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-primary-foreground">
                {user.email.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user.email}
              </p>
              <p className="text-xs text-muted-foreground">Admin</p>
            </div>
          </div>
        )}
        
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start text-muted-foreground hover:text-foreground",
            collapsed ? "px-2" : "px-3"
          )}
          onClick={handleSignOut}
          title={collapsed ? "Sign out" : undefined}
        >
          <LogOut className={cn("h-4 w-4", collapsed ? "mx-auto" : "mr-3")} />
          {!collapsed && <span>Sign out</span>}
        </Button>
      </div>
    </div>
  );
}

export function SidebarTrigger({ 
  className,
  ...props 
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("h-8 w-8 p-0", className)}
      {...props}
    >
      <File className="h-4 w-4" />
      <span className="sr-only">Toggle sidebar</span>
    </Button>
  );
}
