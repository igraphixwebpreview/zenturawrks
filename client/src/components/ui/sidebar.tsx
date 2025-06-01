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
  ChevronRight,
  Users
} from "lucide-react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useProfilePicture } from "@/hooks/use-profile-picture";
import { getProfilePictureUrl, getInitials } from "@/lib/profile-upload";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  collapsed?: boolean;
  onToggle?: () => void;
  onSignOut?: () => void;
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
    title: "Clients",
    href: "/clients",
    icon: Users,
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

export function Sidebar({ className, collapsed = false, onToggle, onSignOut, ...props }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const { profilePicture } = useProfilePicture();
  const [imageUrl, setImageUrl] = React.useState<string>('');

  React.useEffect(() => {
    const loadImageUrl = async () => {
      if (profilePicture) {
        try {
          const url = await getProfilePictureUrl({ photoURL: profilePicture });
          setImageUrl(url);
        } catch (error) {
          console.error('Error loading profile picture:', error);
        }
      }
    };
    loadImageUrl();
  }, [profilePicture]);

  const handleSignOut = async () => {
    if (onSignOut) {
      await onSignOut();
    }
  };

  return (
    <div
      className={cn(
        "flex h-full flex-col backdrop-blur-2xl bg-white/20 border-r border-white/30 shadow-2xl",
        collapsed ? "w-16" : "w-64",
        "transition-all duration-300 ease-in-out relative z-10",
        className
      )}
      {...props}
    >
      {/* Header */}
      <div className={cn(
        "flex h-16 items-center justify-between border-b border-border",
        collapsed ? "px-2" : "px-4"
      )}>
        {!collapsed && (
          <div className="flex items-center space-x-3">
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                {user?.displayName ? `Hello, ${user.displayName.split(' ')[0]}!` : 'InvoiceGen'}
              </h1>
            </div>
          </div>
        )}
        {collapsed ? (
          <div className="flex items-center justify-between w-full px-2">
            {/* User Profile Picture/Initials (Collapsed) */}
            <div 
              className="w-7 h-7 bg-primary rounded-full flex items-center justify-center overflow-hidden shadow-lg cursor-pointer hover:scale-105 transition-transform flex-shrink-0"
              onClick={onToggle}
              title={user?.displayName || user?.email || ''}
            >
              {imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs font-medium text-primary-foreground">
                  {getInitials(user?.displayName || '')}
                </span>
              )}
            </div>
            
            {/* Toggle Arrow Button (Collapsed) */}
            {onToggle && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                onClick={onToggle}
                title="Expand sidebar"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : (
          onToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="ml-auto"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )
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
                <button
                  className={cn(
                    "w-full h-16 py-6 leading-relaxed rounded-2xl transition-all duration-300 flex items-center",
                    collapsed ? "px-2 justify-center" : "px-3 justify-start",
                    isActive 
                      ? "backdrop-blur-md bg-white/20 text-primary shadow-lg border border-white/30 border-r-4 border-r-primary" 
                      : "text-gray-600 hover:text-primary hover:backdrop-blur-sm hover:bg-white/10 hover:shadow-md"
                  )}
                  title={collapsed ? item.title : undefined}
                >
                  <Icon className={cn("h-4 w-4", collapsed ? "mx-auto" : "mr-3")} />
                  {!collapsed && <span>{item.title}</span>}
                </button>
              </Link>
            );
          })}
        </div>
      </nav>

      <Separator />

      {/* User Section */}
      <div className="mt-auto p-4">
        {!collapsed && user && (
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center overflow-hidden">
              {imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs font-medium text-primary-foreground">
                  {getInitials(user.displayName || '')}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user.displayName || user.email}
              </p>
              <p className="text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
          </div>
        )}
        
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start text-muted-foreground hover:text-foreground",
            collapsed ? "px-2" : "px-0"
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
