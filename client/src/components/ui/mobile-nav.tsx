import { Home, FileText, Plus, Settings, Users, Bell, Mail } from "lucide-react";
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
    href: "/clients",
    icon: Users,
    label: "Clients",
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-2xl bg-white/20 border-t border-white/30 rounded-t-3xl px-4 py-3 shadow-2xl">
      <div className="flex justify-around items-center h-19 relative">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          if (item.href === '/create-invoice') {
            return (
              <button
                key={item.href}
                onClick={() => setLocation(item.href)}
                className={cn(
                  "mobile-nav-item flex mb-19 flex-col items-center justify-center h-16 w-20 bg-gradient-to-br from-primary to-primary/80 rounded-xl text-white shadow-lg transition-all duration-300 ease-in-out transform hover:scale-110 pb-0.5 pt-0.5",
                  isActive ? "scale-110" : "-translate-y-3"
                )}
                style={{ marginTop: '-3rem' }}
              >
                <Icon className="w-9 h-4 text-white mt-0.5" />
                <span className="text-xs font-medium text-white -mt-0.1">{item.label}</span>
              </button>
            );
          }

          return (
            <button
              key={item.href}
              onClick={() => setLocation(item.href)}
              className={cn(
                "mobile-nav-item flex flex-col items-center text-center px-5 py-5 rounded-xl transition-colors duration-200",
                isActive ? "text-primary" : "text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary"
              )}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}