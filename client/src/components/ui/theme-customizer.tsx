import { useState, useEffect } from "react";
import { Palette, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const themes = [
  { name: "Purple", value: "theme-purple", color: "#7C3AED", description: "Creative & Inspiring" },
  { name: "Blue", value: "theme-blue", color: "#3B82F6", description: "Professional & Trustworthy" },
  { name: "Emerald", value: "theme-emerald", color: "#10B981", description: "Fresh & Modern" },
  { name: "Rose", value: "theme-rose", color: "#F43F5E", description: "Bold & Energetic" },
  { name: "Orange", value: "theme-orange", color: "#F97316", description: "Vibrant & Dynamic" },
  { name: "Pink", value: "theme-pink", color: "#EC4899", description: "Playful & Creative" },
  { name: "Indigo", value: "theme-indigo", color: "#6366F1", description: "Deep & Sophisticated" },
  { name: "Cyan", value: "theme-cyan", color: "#06B6D4", description: "Cool & Refreshing" },
];

export function ThemeCustomizer() {
  const [currentTheme, setCurrentTheme] = useState("theme-purple");

  useEffect(() => {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem("invoice-theme") || "theme-purple";
    setCurrentTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (theme: string) => {
    // Remove all theme classes
    themes.forEach(t => document.documentElement.classList.remove(t.value));
    // Add selected theme class
    document.documentElement.classList.add(theme);
    // Save to localStorage
    localStorage.setItem("invoice-theme", theme);
    setCurrentTheme(theme);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="btn-modern">
          <Palette className="w-4 h-4 mr-2" />
          Theme
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 rounded-2xl" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Palette className="w-5 h-5" />
              Choose Your Theme
            </CardTitle>
            <CardDescription>
              Pick a color that matches your brand and personality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {themes.map((theme) => (
                <button
                  key={theme.value}
                  onClick={() => applyTheme(theme.value)}
                  className={cn(
                    "relative p-4 rounded-2xl border-2 transition-all duration-300 hover:scale-105 text-left",
                    currentTheme === theme.value
                      ? "border-primary bg-primary/5 shadow-lg"
                      : "border-border hover:border-border/80 hover:bg-accent/30"
                  )}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className="theme-color-picker"
                      style={{ backgroundColor: theme.color }}
                    >
                      {currentTheme === theme.value && (
                        <Check className="w-4 h-4 text-white m-auto mt-1" />
                      )}
                    </div>
                    <span className="font-semibold text-sm">{theme.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{theme.description}</p>
                </button>
              ))}
            </div>
            
            <div className="pt-4 border-t border-border/50">
              <div className="text-xs text-muted-foreground text-center">
                Your theme preference is saved automatically
              </div>
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}