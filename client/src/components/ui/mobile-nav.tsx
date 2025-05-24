import { Home, FileText, Plus, Settings, BarChart3, Bell, Mail } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const navItems = [
  {
    href: "/",
    icon: Home,
    label: "Home",
  },
  {
    href: "/invoices",
    icon: FileText,
    label: "Invoices",
  },
  {
    href: "/create-invoice",
    icon: Plus,
    label: "Create",
  },
  {
    href: "/export",
    icon: BarChart3,
    label: "Export",
  },
  {
    href: "/settings",
    icon: Settings,
    label: "Settings",
  },
];

export function MobileNav() {
  const [location, setLocation] = useLocation();
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 border-t border-slate-200 rounded-t-3xl px-4 py-3 shadow-2xl dark:bg-gray-900/95 dark:border-gray-700">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <button
              key={item.href}
              onClick={() => setLocation(item.href)}
              className={cn(
                "mobile-nav-item",
                isActive && "active"
              )}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}