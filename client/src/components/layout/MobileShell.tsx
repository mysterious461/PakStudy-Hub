import React from "react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { BottomNav } from "./BottomNav";

interface MobileShellProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileShell({ children, className }: MobileShellProps) {
  const [location] = useLocation();
  
  // Only show nav on specific routes
  const showNav = ["/home", "/subjects", "/profile"].includes(location) || location.startsWith("/question/");

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-neutral-100 dark:bg-neutral-900 p-0 sm:p-4">
      {/* Phone Frame for Desktop View */}
      <div className="w-full max-w-md h-[100dvh] sm:h-[800px] bg-background relative overflow-hidden shadow-2xl sm:rounded-[2rem] sm:border-[8px] sm:border-neutral-800 flex flex-col">
        {/* iOS-style Status Bar Simulation (Visual Only) */}
        <div className="h-8 w-full bg-background/80 backdrop-blur-md z-50 flex items-center justify-between px-6 select-none border-b border-transparent absolute top-0 left-0 right-0">
          <div className="text-xs font-semibold">9:41</div>
          <div className="flex gap-1.5">
            <div className="w-4 h-2.5 bg-foreground/90 rounded-[2px]" />
            <div className="w-2.5 h-2.5 bg-foreground/90 rounded-full" />
            <div className="w-6 h-2.5 border border-foreground/30 rounded-[3px] relative">
                <div className="absolute inset-0.5 bg-foreground/90 rounded-[1px] w-3/4" />
            </div>
          </div>
        </div>
        
        {/* Main Content Area */}
        <main className={cn("flex-1 flex flex-col relative w-full overflow-hidden mt-8", className)}>
          {children}
        </main>

        {/* Global Bottom Navigation */}
        {showNav && (
          <div className="shrink-0 z-50 bg-background">
            <BottomNav />
          </div>
        )}
      </div>
    </div>
  );
}
