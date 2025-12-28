import React from "react";
import { Link, useLocation } from "wouter";
import { Home, PlusSquare, User, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { icon: Home, label: "Home", path: "/home" },
    { icon: BookOpen, label: "Subjects", path: "/subjects" },
    { icon: PlusSquare, label: "Post", path: "/post" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-background/80 backdrop-blur-lg pb-safe">
      <nav className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <div
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full space-y-1 cursor-pointer transition-colors duration-200",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon
                  strokeWidth={isActive ? 2.5 : 2}
                  className={cn("w-6 h-6", isActive && "animate-in zoom-in-50 duration-200")}
                />
                <span className="text-[10px] font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
