import React from "react";
import { Link, useLocation } from "wouter";
import { Home, PlusSquare, User, BookOpen, Banknote, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { icon: Home, label: "Home", path: "/home" },
    { icon: ShoppingCart, label: "Buy", path: "/subjects" },
    { icon: PlusSquare, label: "Post", path: "/post" },
    { icon: Banknote, label: "Sell", path: "/sell" },
    { icon: User, label: "Me", path: "/profile" },
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2 pointer-events-none">
      <nav className="flex items-center justify-between h-16 w-full px-2 bg-background/80 backdrop-blur-xl border border-border/50 shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.1)] rounded-3xl pointer-events-auto dark:shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.3)]">
        {navItems.map((item) => {
          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <div
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full min-w-[3.5rem] px-1 space-y-1 cursor-pointer transition-all duration-300 relative group",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isActive && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full animate-in fade-in zoom-in" />
                )}
                <div className={cn(
                  "p-2 rounded-2xl transition-all duration-300",
                  isActive ? "bg-primary/10 text-primary -translate-y-1" : "group-hover:bg-muted/50"
                )}>
                  <item.icon
                    strokeWidth={isActive ? 2.5 : 2}
                    className={cn("w-5 h-5 shrink-0 transition-transform duration-300", isActive && "scale-110")}
                  />
                </div>
                <span className={cn(
                  "text-[9px] font-semibold truncate transition-all duration-300 absolute bottom-1",
                  isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                )}>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
