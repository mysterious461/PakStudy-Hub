import React, { useEffect, useState } from "react";
import { BookOpen, Files, Home, LayoutDashboard, LogIn, LogOut, Menu, Search, ShieldCheck, User, X } from "lucide-react";
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
    { icon: Search, label: "Resources", path: "/resources" },
    { icon: BookOpen, label: "Contribute", path: hasKnownSession ? "/contributors/upload" : "/auth?returnTo=/contributors/upload" },
    { icon: Files, label: "My Uploads", path: hasKnownSession ? "/contributors/uploads" : "/auth?returnTo=/contributors/uploads" },
    { icon: LayoutDashboard, label: "Dashboard", path: hasKnownSession ? "/contributors/dashboard" : "/auth?returnTo=/contributors/dashboard" },
    { icon: User, label: "Profile", path: hasKnownSession ? "/profile" : "/auth?returnTo=/profile" },
  ];

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto grid min-h-[76px] max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:px-6 lg:grid-cols-[minmax(230px,260px)_minmax(0,1fr)_auto] xl:grid-cols-[260px_minmax(0,1fr)_auto]">
          <button className="flex min-w-0 items-center gap-3 text-left lg:min-w-[230px] lg:shrink-0 xl:min-w-[260px]" onClick={() => goTo("/contribute")}>
            <div className="h-11 w-11 shrink-0 rounded-2xl border border-border/50 bg-white p-1.5 shadow-sm">
              <img src={logoImage} alt="PakStudy Hub" className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0 lg:min-w-[168px]">
              <p className="whitespace-nowrap text-base font-black leading-tight">PakStudy Hub</p>
              <p className="whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-primary">Contributor Portal</p>
            </div>
          </button>

          <nav className="hidden min-w-0 items-center justify-center gap-1 lg:flex xl:gap-2">
            {navItems.map((item) => (
              <NavButton key={item.label} icon={item.icon} label={item.label} active={isActiveRoute(location, item.path)} onClick={() => goTo(item.path)} />
            ))}
            <AdminNavSlot visible={isAdmin} active={isActiveRoute(location, "/admin")} label="Admin" onClick={() => goTo("/admin")} />
            <AdminNavSlot visible={isAdmin} active={isActiveRoute(location, "/admin/resources/review")} label="Review" onClick={() => goTo("/admin/resources/review")} />
          </nav>

          <div className="flex shrink-0 items-center justify-end gap-2">
            {hasKnownSession ? (
              <Button variant="outline" className="hidden h-10 shrink-0 rounded-2xl px-4 font-bold lg:inline-flex" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            ) : (
              <Button className="hidden h-10 shrink-0 rounded-2xl px-4 font-bold lg:inline-flex" onClick={() => goTo("/auth?returnTo=/profile")}>
                <LogIn className="mr-2 h-4 w-4" />
                Sign In / Sign Up
              </Button>
            )}
            <Button variant="ghost" size="icon" className="rounded-2xl lg:hidden" onClick={() => setMenuOpen((open) => !open)}>
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-border/60 bg-background px-4 py-3 lg:hidden">
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
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.2fr_repeat(6,1fr)]">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl border border-border/50 bg-white p-1.5 shadow-sm">
                <img src={logoImage} alt="PakStudy Hub" className="h-full w-full object-contain" />
              </div>
              <div>
                <p className="font-black">PakStudy Hub</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Student Resource Library</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">A reviewed academic resource library built by students for students across Pakistan.</p>
          </div>
          <FooterGroup title="Company" links={[["About", "/about"], ["Roadmap", "/about"], ["Future Universities", "/about"]]} onNavigate={goTo} />
          <FooterGroup title="Community" links={[["Contribute", "/contributors/upload"], ["Dashboard", "/contributors/dashboard"], ["My Uploads", "/contributors/uploads"]]} onNavigate={goTo} />
          <FooterGroup title="Resources" links={[["Browse Library", "/resources"], ["Guidelines", "/guidelines"], ["Help Center", "/help"], ["Upload Rules", "/guidelines"]]} onNavigate={goTo} />
          <FooterGroup title="Support" links={[["Contact", "/contact"], ["Common Issues", "/help"], ["Support Request", "/help"]]} onNavigate={goTo} />
          <FooterGroup title="Legal" links={[["Privacy Policy", "/privacy"], ["Terms of Service", "/terms"], ["Copyright Policy", "/copyright"], ["Academic Integrity", "/academic-integrity"]]} onNavigate={goTo} />
          <div>
            <h3 className="mb-3 text-sm font-black">Social Media</h3>
            <div className="space-y-2">
              {["GitHub", "LinkedIn", "Facebook", "Instagram", "YouTube"].map((label) => (
                <span key={label} className="block cursor-not-allowed text-sm font-semibold text-muted-foreground/70" aria-label={`${label} profile coming soon`}>
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export const ContributorPortalShell = ContributorPortalLayout;

function isActiveRoute(location: string, path: string) {
  if (path === "/contribute") return location === "/" || location === "/contribute";
  if (path === "/admin") return location === "/admin";
  return location === path || location.startsWith(`${path}/`);
}

function NavButton({ icon: Icon, label, active, onClick }: { icon: any; label: string; active?: boolean; onClick: () => void }) {
  return (
    <Button variant="ghost" className={`h-10 shrink-0 rounded-2xl px-3 font-semibold xl:px-4 ${active ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary" : ""}`} onClick={onClick} aria-current={active ? "page" : undefined}>
      <Icon className="mr-2 h-4 w-4 shrink-0" />
      {label}
    </Button>
  );
}

function AdminNavSlot({ visible, active, label, onClick }: { visible: boolean; active?: boolean; label: string; onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      className={`h-10 min-w-[92px] shrink-0 rounded-2xl px-3 font-semibold xl:px-4 ${active ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary" : ""} ${visible ? "" : "invisible pointer-events-none"}`}
      onClick={onClick}
      aria-hidden={!visible}
      aria-current={visible && active ? "page" : undefined}
      tabIndex={visible ? 0 : -1}
    >
      <ShieldCheck className="mr-2 h-4 w-4 shrink-0" />
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

function FooterGroup({ title, links, onNavigate }: { title: string; links: string[][]; onNavigate: (path: string) => void }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-black">{title}</h3>
      <div className="space-y-2">
        {links.map(([label, path]) => (
          <button key={`${title}-${label}`} className="block text-left text-sm font-semibold text-muted-foreground hover:text-primary" onClick={() => onNavigate(path)}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
