import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useProfilePicture } from "@/hooks/use-profile-picture";
import { getInitials } from "@/lib/profile-upload";
import { Menu, User } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { User as FirebaseUser } from "firebase/auth";

interface HeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  onMenuClick?: () => void;
}

export function Header({ className, onMenuClick, ...props }: HeaderProps) {
  const { user: firebaseUser } = useAuth();
  const { profilePicture: profilePictureUrl, isLoading, error } = useProfilePicture();
  
  const profileTooltip = React.useMemo(() => {
    if (!firebaseUser) return "";
    const name = firebaseUser.displayName || firebaseUser.email;
    return `${name}\n${firebaseUser.email}`;
  }, [firebaseUser]);

  return (
    <header
      className={cn(
        "flex h-16 items-center justify-between border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-4">
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4">
        {firebaseUser && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity">
                  <div className="relative w-8 h-8 bg-primary rounded-full flex items-center justify-center overflow-hidden group">
                    {isLoading ? (
                      <div className="absolute inset-0 bg-primary/20 animate-pulse" />
                    ) : error ? (
                      <User className="w-4 h-4 text-primary-foreground" />
                    ) : profilePictureUrl ? (
                      <>
                        <img 
                          src={profilePictureUrl} 
                          alt="Profile" 
                          className={cn(
                            "w-full h-full object-cover transition-all duration-200",
                            isLoading ? "opacity-0 scale-95" : "opacity-100 scale-100",
                            "group-hover:scale-105"
                          )}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
                      </>
                    ) : (
                      <span className="text-xs font-medium text-primary-foreground">
                        {getInitials(firebaseUser.displayName)}
                      </span>
                    )}
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium">{firebaseUser.displayName || firebaseUser.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {firebaseUser.email}
                    </p>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-center whitespace-pre-line">
                {profileTooltip}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </header>
  );
} 