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
    { icon: User, label: "Me", path: "/profile" },
  ];

  return (
    <div className="border-t border-border bg-background pb-safe w-full">
      <nav className="flex items-center justify-between h-16 w-full px-2">
        {navItems.map((item) => {
          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <div
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full min-w-0 px-1 space-y-1 cursor-pointer transition-colors duration-200",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon
                  strokeWidth={isActive ? 2.5 : 2}
                  className={cn("w-6 h-6 shrink-0", isActive && "animate-in zoom-in-50 duration-200")}
                />
                <span className="text-[10px] font-medium truncate w-full text-center">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
