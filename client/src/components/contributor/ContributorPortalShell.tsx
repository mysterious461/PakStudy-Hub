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

type PortalHeaderCache = {
  uid: string;
  email: string;
  role: "Student" | "Admin" | "Moderator";
};

const HEADER_CACHE_KEY = "pakstudy.portal.header";

function readHeaderCache(): PortalHeaderCache | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(HEADER_CACHE_KEY) || "null");
    if (!parsed?.uid) return null;
    return {
      uid: parsed.uid,
      email: parsed.email || "",
      role: parsed.role === "Admin" || parsed.role === "Moderator" ? parsed.role : "Student",
    };
  } catch {
    return null;
  }
}

function writeHeaderCache(cache: PortalHeaderCache | null) {
  if (typeof window === "undefined") return;
  if (!cache) {
    window.localStorage.removeItem(HEADER_CACHE_KEY);
    return;
  }
  window.localStorage.setItem(HEADER_CACHE_KEY, JSON.stringify(cache));
}

export function ContributorPortalLayout({ children }: ContributorPortalShellProps) {
  const [location, setLocation] = useLocation();
  const [cachedHeader, setCachedHeader] = useState<PortalHeaderCache | null>(() => readHeaderCache());
  const [user, setUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [role, setRole] = useState<PortalHeaderCache["role"]>(() => readHeaderCache()?.role || "Student");
  const [authResolved, setAuthResolved] = useState(Boolean(auth.currentUser));
  const [menuOpen, setMenuOpen] = useState(false);
  const [routeSettling, setRouteSettling] = useState(false);
  const hasKnownSession = Boolean(user || (!authResolved && cachedHeader));
  const isAdmin = role === "Admin" || role === "Moderator";

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthResolved(true);

      if (currentUser) {
        const latestCache = readHeaderCache();
        if (latestCache?.uid === currentUser.uid) {
          setCachedHeader(latestCache);
          setRole(latestCache.role);
        }

        void apiRequest("GET", "/api/user/profile")
          .then((response) => response.json())
          .then((profile) => {
            const nextRole = profile?.role === "Admin" || profile?.role === "Moderator" ? profile.role : "Student";
            const nextCache = {
              uid: currentUser.uid,
              email: profile?.email || currentUser.email || "",
              role: nextRole,
            };
            setRole(nextRole);
            setCachedHeader(nextCache);
            writeHeaderCache(nextCache);
          })
          .catch((error) => {
            if (import.meta.env.DEV) console.warn("Portal profile role fetch failed:", error);
          });
      } else {
        setCachedHeader(null);
        setRole("Student");
        writeHeaderCache(null);
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    setRouteSettling(true);
    const timeout = window.setTimeout(() => setRouteSettling(false), 180);
    return () => window.clearTimeout(timeout);
  }, [location]);

  const goTo = (path: string) => {
    setMenuOpen(false);
    setLocation(path);
  };

  const handleSignOut = async () => {
    writeHeaderCache(null);
    setCachedHeader(null);
    await signOut(auth);
    setRole("Student");
    setMenuOpen(false);
    setLocation("/contribute");
  };

  const navItems = [
    { icon: Home, label: "Home", path: "/contribute" },
    { icon: BookOpen, label: "Contribute", path: hasKnownSession ? "/contributors/upload" : "/auth?returnTo=/contributors/upload" },
    { icon: Files, label: "My Uploads", path: hasKnownSession ? "/contributors/uploads" : "/auth?returnTo=/contributors/uploads" },
    { icon: LayoutDashboard, label: "Dashboard", path: hasKnownSession ? "/contributors/dashboard" : "/auth?returnTo=/contributors/dashboard" },
    { icon: User, label: "Profile", path: hasKnownSession ? "/profile" : "/auth?returnTo=/profile" },
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
            <AdminNavSlot visible={isAdmin} label="Admin" onClick={() => goTo("/admin")} />
            <AdminNavSlot visible={isAdmin} label="Review" onClick={() => goTo("/admin/resources/review")} />
          </nav>

          <div className="flex items-center gap-2">
            {hasKnownSession ? (
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
              {isAdmin && <MobileNavButton icon={ShieldCheck} label="Admin" onClick={() => goTo("/admin")} />}
              {isAdmin && <MobileNavButton icon={ShieldCheck} label="Review" onClick={() => goTo("/admin/resources/review")} />}
              {hasKnownSession ? (
                <MobileNavButton icon={LogOut} label="Sign Out" onClick={handleSignOut} />
              ) : (
                <MobileNavButton icon={LogIn} label="Sign In / Sign Up" onClick={() => goTo("/auth?returnTo=/profile")} />
              )}
            </div>
          </div>
        )}
      </header>

      <div className="h-1 bg-background">
        <div className={`h-full bg-primary transition-all duration-200 ${routeSettling ? "w-full opacity-70" : "w-0 opacity-0"}`} />
      </div>

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

function AdminNavSlot({ visible, label, onClick }: { visible: boolean; label: string; onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      className={`min-w-[92px] rounded-2xl font-semibold ${visible ? "" : "invisible pointer-events-none"}`}
      onClick={onClick}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
    >
      <ShieldCheck className="mr-2 h-4 w-4" />
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
