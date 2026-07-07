import React, { useEffect, useState } from "react";
import { Activity, Bell, BookOpen, ChevronDown, Files, HeartHandshake, HelpCircle, Home, LayoutDashboard, LogIn, LogOut, Mail, Menu, Search, Settings, ShieldCheck, User, Users, X } from "lucide-react";
import { useLocation } from "wouter";
import { onAuthStateChanged, signOut, type User as FirebaseUser } from "firebase/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
  ];

  const userName = user?.displayName || cachedHeader?.email?.split("@")[0] || user?.email?.split("@")[0] || "Contributor";
  const userEmail = user?.email || cachedHeader?.email || "Not signed in";
  const initials = userName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "U";

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
          </nav>

          <div className="flex shrink-0 items-center justify-end gap-2">
            <div className="hidden items-center gap-1 xl:flex">
              <NavButton icon={LayoutDashboard} label="Dashboard" active={isActiveRoute(location, "/contributors/dashboard")} onClick={() => goTo(hasKnownSession ? "/contributors/dashboard" : "/auth?returnTo=/contributors/dashboard")} />
              <NavButton icon={User} label="Profile" active={isActiveRoute(location, "/profile")} onClick={() => goTo(hasKnownSession ? "/profile" : "/auth?returnTo=/profile")} />
            </div>
            {isAdmin && <AdminDropdown active={location.startsWith("/admin")} onNavigate={goTo} />}
            {hasKnownSession && (
              <Button variant="ghost" size="icon" className="hidden h-10 w-10 shrink-0 rounded-2xl lg:inline-flex" aria-label="Notifications">
                <Bell className="h-4 w-4" />
              </Button>
            )}
            {hasKnownSession ? (
              <AccountDropdown name={userName} email={userEmail} role={role} initials={initials} onNavigate={goTo} onSignOut={handleSignOut} />
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
              <MobileNavButton icon={LayoutDashboard} label="Dashboard" onClick={() => goTo(hasKnownSession ? "/contributors/dashboard" : "/auth?returnTo=/contributors/dashboard")} />
              <MobileNavButton icon={User} label="Profile" onClick={() => goTo(hasKnownSession ? "/profile" : "/auth?returnTo=/profile")} />
              {isAdmin && <MobileNavButton icon={ShieldCheck} label="Admin Dashboard" onClick={() => goTo("/admin")} />}
              {isAdmin && <MobileNavButton icon={HeartHandshake} label="Resource Review Queue" onClick={() => goTo("/admin/resources/review")} />}
              {isAdmin && <MobileNavButton icon={Files} label="Manage Resources" onClick={() => goTo("/admin/resources")} />}
              {isAdmin && <MobileNavButton icon={Mail} label="Contact Messages" onClick={() => goTo("/admin/contact-messages")} />}
              {isAdmin && <MobileNavButton icon={BookOpen} label="Academic Hierarchy" onClick={() => goTo("/admin/academic-hierarchy")} />}
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

function AdminDropdown({ active, onNavigate }: { active: boolean; onNavigate: (path: string) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={`h-10 shrink-0 rounded-2xl px-3 font-semibold xl:px-4 ${active ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary" : ""}`}>
          <ShieldCheck className="mr-2 h-4 w-4 shrink-0" />
          Admin
          <ChevronDown className="ml-1 h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2">
        <DropdownMenuLabel>Admin Tools</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onNavigate("/admin")}><LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onNavigate("/admin/resources/review")}><HeartHandshake className="mr-2 h-4 w-4" /> Resource Review Queue</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onNavigate("/admin/resources")}><Files className="mr-2 h-4 w-4" /> Manage Resources</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onNavigate("/admin")}><Users className="mr-2 h-4 w-4" /> Manage Users</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onNavigate("/admin/contact-messages")}><Mail className="mr-2 h-4 w-4" /> Contact Messages</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onNavigate("/admin/academic-hierarchy")}><BookOpen className="mr-2 h-4 w-4" /> Academic Hierarchy</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onNavigate("/admin")}><ShieldCheck className="mr-2 h-4 w-4" /> Reports</DropdownMenuItem>
        <DropdownMenuItem disabled><Activity className="mr-2 h-4 w-4" /> System Health</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AccountDropdown({ name, email, role, initials, onNavigate, onSignOut }: { name: string; email: string; role: string; initials: string; onNavigate: (path: string) => void; onSignOut: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="hidden h-10 shrink-0 rounded-full p-0 lg:inline-flex" aria-label="Open profile menu">
          <Avatar className="h-10 w-10 border border-border/70">
            <AvatarFallback className="bg-primary/10 text-sm font-black text-primary">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 rounded-2xl p-2">
        <DropdownMenuLabel>
          <span className="block truncate font-black">{name}</span>
          <span className="block truncate text-xs font-medium text-muted-foreground">{email}</span>
          <span className="mt-1 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-primary">{role}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onNavigate("/profile")}><User className="mr-2 h-4 w-4" /> Profile</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onNavigate("/contributors/dashboard")}><LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard</DropdownMenuItem>
        <DropdownMenuItem disabled><Settings className="mr-2 h-4 w-4" /> Settings</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onNavigate("/help")}><HelpCircle className="mr-2 h-4 w-4" /> Help Center</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-600 focus:text-red-700" onClick={onSignOut}><LogOut className="mr-2 h-4 w-4" /> Sign Out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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

