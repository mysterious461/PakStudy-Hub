import React, { useEffect, useState } from "react";
import { BookOpen, Files, GraduationCap, HelpCircle, Home, LayoutDashboard, LogIn, LogOut, Menu, ShieldCheck, User, X } from "lucide-react";
import { useLocation } from "wouter";
import { onAuthStateChanged, signOut, type User as FirebaseUser } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/firebase";
import { apiRequest } from "@/lib/queryClient";
import logoImage from "@assets/generated_images/minimalist_education_logo_with_book_and_crescent_moon_green.png";

type ContributorPortalShellProps = {
  children: React.ReactNode;
};

export function ContributorPortalLayout({ children }: ContributorPortalShellProps) {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [role, setRole] = useState("Student");
  const [menuOpen, setMenuOpen] = useState(false);
  const isAdmin = role === "Admin" || role === "Moderator";

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setRole("Student");

      if (currentUser) {
        void apiRequest("GET", "/api/user/profile")
          .then((response) => response.json())
          .then((profile) => {
            setRole(profile?.role === "Admin" || profile?.role === "Moderator" ? profile.role : "Student");
          })
          .catch((error) => {
            if (import.meta.env.DEV) console.warn("Portal profile role fetch failed:", error);
          });
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  const goTo = (path: string) => {
    setMenuOpen(false);
    setLocation(path);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setRole("Student");
    setMenuOpen(false);
    setLocation("/contribute");
  };

  const navItems = [
    { icon: Home, label: "Home", path: "/contribute" },
    { icon: BookOpen, label: "Contribute", path: user ? "/contributors/upload" : "/auth?returnTo=/contributors/upload" },
    { icon: Files, label: "My Uploads", path: user ? "/contributors/uploads" : "/auth?returnTo=/contributors/uploads" },
    { icon: LayoutDashboard, label: "Dashboard", path: user ? "/contributors/dashboard" : "/auth?returnTo=/contributors/dashboard" },
    { icon: User, label: "Profile", path: user ? "/profile" : "/auth?returnTo=/profile" },
    ...(isAdmin ? [
      { icon: ShieldCheck, label: "Admin", path: "/admin" },
      { icon: ShieldCheck, label: "Review", path: "/admin/resources/review" },
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <button className="flex min-w-0 items-center gap-3 text-left" onClick={() => goTo("/contribute")}>
            <div className="h-11 w-11 shrink-0 rounded-2xl border border-border/50 bg-white p-1.5 shadow-sm">
              <img src={logoImage} alt="PakStudy Hub" className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-black leading-tight">PakStudy Hub</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Contributor Portal</p>
            </div>
          </button>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <NavButton key={item.label} icon={item.icon} label={item.label} onClick={() => goTo(item.path)} />
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <Button variant="outline" className="hidden rounded-2xl font-bold sm:inline-flex" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            ) : (
              <Button className="hidden rounded-2xl font-bold sm:inline-flex" onClick={() => goTo("/auth?returnTo=/profile")}>
                <LogIn className="mr-2 h-4 w-4" />
                Sign In / Sign Up
              </Button>
            )}
            <Button variant="ghost" size="icon" className="rounded-2xl md:hidden" onClick={() => setMenuOpen((open) => !open)}>
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-border/60 bg-background px-4 py-3 md:hidden">
            <div className="mx-auto grid max-w-7xl gap-2">
              {navItems.map((item) => (
                <MobileNavButton key={item.label} icon={item.icon} label={item.label} onClick={() => goTo(item.path)} />
              ))}
              {user ? (
                <MobileNavButton icon={LogOut} label="Sign Out" onClick={handleSignOut} />
              ) : (
                <MobileNavButton icon={LogIn} label="Sign In / Sign Up" onClick={() => goTo("/auth?returnTo=/profile")} />
              )}
            </div>
          </div>
        )}
      </header>

      <main>{children}</main>

      <footer className="border-t border-border/60 bg-background">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 text-sm text-muted-foreground sm:grid-cols-5 sm:px-6">
          <FooterLink label="About PakStudy Hub" />
          <FooterLink label="Contributor Guidelines" />
          <FooterLink label="Help Center" />
          <FooterLink label="Contact" />
          <FooterLink label="Privacy Policy" />
        </div>
      </footer>
    </div>
  );
}

export const ContributorPortalShell = ContributorPortalLayout;

function NavButton({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <Button variant="ghost" className="rounded-2xl font-semibold" onClick={onClick}>
      <Icon className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}

function MobileNavButton({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <Button variant="ghost" className="h-11 justify-start rounded-2xl font-semibold" onClick={onClick}>
      <Icon className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}

function FooterLink({ label }: { label: string }) {
  const Icon = label === "Help Center" ? HelpCircle : label === "About PakStudy Hub" ? GraduationCap : null;
  return (
    <button className="flex items-center gap-2 text-left font-semibold hover:text-primary">
      {Icon ? <Icon className="h-4 w-4" /> : null}
      {label}
    </button>
  );
}
