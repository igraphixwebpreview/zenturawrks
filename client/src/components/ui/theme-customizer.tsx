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
      <PopoverContent className="w-80 rounded-2xl p-0 border-0 shadow-xl" align="end">
        <Card className="border-0 shadow-none bg-white">
          <CardHeader className="pb-4 px-6 pt-6">
            <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <Palette className="w-5 h-5 text-gray-700" />
              Choose Your Theme
            </CardTitle>
            <CardDescription className="text-gray-600 text-sm mt-1">
              Pick a color that matches your brand and personality
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="grid grid-cols-2 gap-4">
              {themes.map((theme) => (
                <button
                  key={theme.value}
                  onClick={() => applyTheme(theme.value)}
                  className={cn(
                    "relative p-4 rounded-2xl border-2 transition-all duration-300 text-left group hover:shadow-md",
                    currentTheme === theme.value
                      ? "border-2 bg-gray-50/50 shadow-lg ring-2 ring-opacity-20"
                      : "border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/30"
                  )}
                  style={{
                    borderColor: currentTheme === theme.value ? theme.color : undefined,
                    ringColor: currentTheme === theme.value ? `${theme.color}40` : undefined
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center shadow-sm ring-1 ring-white/20"
                      style={{ backgroundColor: theme.color }}
                    >
                      {currentTheme === theme.value && (
                        <Check className="w-4 h-4 text-white font-bold" />
                      )}
                    </div>
                    <span className="font-bold text-base text-gray-900">{theme.name}</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed font-medium">{theme.description}</p>
                </button>
              ))}
            </div>
            
            <div className="pt-6 border-t border-gray-100 mt-6">
              <div className="text-xs text-gray-500 text-center font-medium">
                Your theme preference is saved automatically
              </div>
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}