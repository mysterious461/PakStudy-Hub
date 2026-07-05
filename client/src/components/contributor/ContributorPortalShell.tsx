import React, { useEffect, useState } from "react";
import { BookOpen, GraduationCap, HelpCircle, Home, LayoutDashboard, LogIn, LogOut, ShieldCheck, UploadCloud, User, Files } from "lucide-react";
import { useLocation } from "wouter";
import { onAuthStateChanged, signOut, type User as FirebaseUser } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { auth, db } from "@/lib/firebase";
import { apiRequest } from "@/lib/queryClient";
import logoImage from "@assets/generated_images/minimalist_education_logo_with_book_and_crescent_moon_green.png";

type ContributorPortalShellProps = {
  children: React.ReactNode;
};

export function ContributorPortalShell({ children }: ContributorPortalShellProps) {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [role, setRole] = useState("Student");
  const isAdmin = role === "Admin" || role === "Moderator";

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setRole("Student");
      unsubscribeProfile?.();
      unsubscribeProfile = undefined;

      if (currentUser) {
        void apiRequest("GET", "/api/user/profile")
          .then((response) => response.json())
          .then((profile) => {
            setRole(profile?.role === "Admin" || profile?.role === "Moderator" ? profile.role : "Student");
          })
          .catch((error) => {
            if (import.meta.env.DEV) console.warn("Portal profile role fetch failed:", error);
          });

        unsubscribeProfile = onSnapshot(doc(db, "users", currentUser.uid), (snapshot) => {
          const nextRole = snapshot.data()?.role;
          setRole(nextRole === "Admin" || nextRole === "Moderator" ? nextRole : "Student");
        }, () => setRole("Student"));
      }
    });

    return () => {
      unsubscribeProfile?.();
      unsubscribeAuth();
    };
  }, []);

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <button className="flex items-center gap-3 text-left" onClick={() => setLocation("/contribute")}>
            <div className="h-11 w-11 rounded-2xl border border-border/50 bg-white p-1.5 shadow-sm">
              <img src={logoImage} alt="PakStudy Hub" className="h-full w-full object-contain" />
            </div>
            <div>
              <p className="text-base font-black leading-tight">PakStudy Hub</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Contributor Portal</p>
            </div>
          </button>

          <nav className="hidden items-center gap-1 md:flex">
            <NavButton icon={Home} label="Home" onClick={() => setLocation("/contribute")} />
            <NavButton icon={BookOpen} label="Contribute" onClick={() => setLocation(user ? "/contributors/upload" : "/auth?returnTo=/contributors/upload")} />
            <NavButton icon={Files} label="My Uploads" onClick={() => setLocation(user ? "/contributors/uploads" : "/auth?returnTo=/contributors/uploads")} />
            <NavButton icon={LayoutDashboard} label="Dashboard" onClick={() => setLocation(user ? "/contributors/dashboard" : "/auth?returnTo=/contributors/dashboard")} />
            <NavButton icon={User} label="Profile" onClick={() => setLocation(user ? "/profile" : "/auth?returnTo=/profile")} />
            {isAdmin && <NavButton icon={ShieldCheck} label="Admin" onClick={() => setLocation("/admin")} />}
            {isAdmin && <NavButton icon={ShieldCheck} label="Review" onClick={() => setLocation("/admin/resources/review")} />}
          </nav>

          <Button
            variant={user ? "outline" : "default"}
            className="rounded-2xl font-bold"
            onClick={() => setLocation(user ? "/profile" : "/auth?returnTo=/profile")}
          >
            {user ? <User className="mr-2 h-4 w-4" /> : <LogIn className="mr-2 h-4 w-4" />}
            <span className="hidden sm:inline">{user ? "Profile" : "Sign In / Sign Up"}</span>
            <span className="sm:hidden">{user ? "Profile" : "Sign In"}</span>
          </Button>
          {user && (
            <Button variant="ghost" size="icon" className="rounded-2xl" onClick={() => void signOut(auth)}>
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-3 sm:px-6 md:hidden">
          <Button variant="outline" size="sm" className="shrink-0 rounded-full" onClick={() => setLocation("/contribute")}>Home</Button>
          <Button variant="outline" size="sm" className="shrink-0 rounded-full" onClick={() => setLocation(user ? "/contributors/upload" : "/auth?returnTo=/contributors/upload")}>Contribute</Button>
          <Button variant="outline" size="sm" className="shrink-0 rounded-full" onClick={() => setLocation(user ? "/contributors/uploads" : "/auth?returnTo=/contributors/uploads")}>My Uploads</Button>
          <Button variant="outline" size="sm" className="shrink-0 rounded-full" onClick={() => setLocation(user ? "/contributors/dashboard" : "/auth?returnTo=/contributors/dashboard")}>Dashboard</Button>
          <Button variant="outline" size="sm" className="shrink-0 rounded-full" onClick={() => setLocation(user ? "/profile" : "/auth?returnTo=/profile")}>Profile</Button>
          {isAdmin && <Button variant="outline" size="sm" className="shrink-0 rounded-full" onClick={() => setLocation("/admin")}>Admin</Button>}
          {isAdmin && <Button variant="outline" size="sm" className="shrink-0 rounded-full" onClick={() => setLocation("/admin/resources/review")}>Review</Button>}
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-border/60 bg-background">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-8 text-sm text-muted-foreground sm:grid-cols-5 sm:px-6">
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

function NavButton({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <Button variant="ghost" className="rounded-2xl font-semibold" onClick={onClick}>
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
