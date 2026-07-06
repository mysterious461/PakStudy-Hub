import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Award, BookOpenCheck, CheckCircle2, FileUp, Loader2, Lock, Mail, ShieldCheck, UserRound } from "lucide-react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { apiRequest } from "@/lib/queryClient";
import logoImage from "@assets/generated_images/minimalist_education_logo_with_book_and_crescent_moon_green.png";

type AuthMode = "login" | "register";

export default function Auth() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [mode, setMode] = useState<AuthMode>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [formError, setFormError] = useState("");

  const returnTo = useMemo(() => {
    const query = location.includes("?") ? location.slice(location.indexOf("?")) : window.location.search;
    const value = new URLSearchParams(query).get("returnTo");
    return value?.startsWith("/") ? value : "/contributors/dashboard";
  }, [location]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setIsCheckingSession(false);
      if (currentUser) setLocation(returnTo || "/contributors/dashboard");
    });
    return () => unsubscribe();
  }, [returnTo, setLocation]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setIsLoading(true);

    const form = event.currentTarget;
    const email = readFormValue(form, "email");
    const password = readFormValue(form, "password");

    if (!email || !password) {
      setFormError("Enter your email and password to continue.");
      setIsLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      await apiRequest("GET", "/api/user/profile");
      setLocation(returnTo);
    } catch (error: any) {
      setFormError(toFriendlyAuthError(error));
      toast({ title: "Login failed", description: toFriendlyAuthError(error), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setIsLoading(true);

    const form = event.currentTarget;
    const name = readFormValue(form, "name");
    const email = readFormValue(form, "email");
    const password = readFormValue(form, "password");

    if (!name || !email || password.length < 6) {
      setFormError("Enter your name, email, and a password with at least 6 characters.");
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      await userCredential.user.getIdToken(true);
      await apiRequest("GET", "/api/user/profile");
      setLocation(returnTo);
    } catch (error: any) {
      setFormError(toFriendlyAuthError(error));
      toast({ title: "Registration failed", description: toFriendlyAuthError(error), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setFormError("");
    const emailInput = document.querySelector<HTMLInputElement>("#login-email");
    const email = emailInput?.value.trim();
    if (!email) {
      setFormError("Enter your email first, then request a password reset.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      toast({ title: "Password reset sent", description: "Check your inbox for Firebase Auth reset instructions." });
    } catch (error: any) {
      setFormError(toFriendlyAuthError(error));
      toast({ title: "Reset email not sent", description: toFriendlyAuthError(error), variant: "destructive" });
    }
  };

  if (isCheckingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-100 px-4">
        <div className="flex items-center rounded-2xl border border-border/60 bg-background px-5 py-4 text-sm font-semibold text-muted-foreground shadow-sm">
          <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
          Checking session
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[linear-gradient(135deg,rgba(22,163,74,0.12),rgba(255,255,255,0)_38%,rgba(37,99,235,0.08))] px-4 py-5 text-foreground sm:px-6 lg:py-8">
      <div className="mx-auto mb-6 flex max-w-6xl items-center justify-between">
        <Button variant="ghost" className="rounded-2xl font-bold" onClick={() => setLocation("/contribute")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 lg:min-h-[calc(100vh-116px)] lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <section className="relative overflow-hidden rounded-[2rem] border border-primary/10 bg-primary/95 p-6 text-primary-foreground shadow-2xl shadow-primary/10 sm:p-8 lg:p-10">
          <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-56 w-56 rounded-full bg-blue-200/20 blur-3xl" />
          <div className="relative">
            <div className="mb-8 flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-white p-2 shadow-lg">
                <img src={logoImage} alt="PakStudy Hub" className="h-full w-full object-contain" />
              </div>
              <div>
                <p className="text-2xl font-black leading-tight">PakStudy Hub</p>
                <p className="text-xs font-bold uppercase tracking-widest text-white/75">Contributor Portal</p>
              </div>
            </div>

            <h1 className="max-w-xl text-4xl font-black leading-tight tracking-normal sm:text-5xl">
              Join Pakistan's Student Resource Library
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-white/82 sm:text-lg">
              Share notes, past papers, slides, and study resources with students across Pakistan.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Feature icon={FileUp} label="Upload academic resources" />
              <Feature icon={BookOpenCheck} label="Track your contributions" />
              <Feature icon={Award} label="Earn contributor recognition" />
              <Feature icon={UserRound} label="Help students find quality material" />
            </div>

            <div className="mt-8 inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/12 px-4 py-3 text-sm font-semibold text-white">
              <ShieldCheck className="h-5 w-5" />
              All uploads are reviewed before publication.
            </div>
          </div>
        </section>

        <Card className="border-border/60 bg-background/95 shadow-2xl shadow-slate-900/5 backdrop-blur">
          <CardContent className="p-5 sm:p-7">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Secure access</p>
              <h2 className="mt-2 text-2xl font-black">Welcome to PakStudy Hub</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Sign in or create your contributor account to upload resources and track reviews.
              </p>
            </div>

            <Tabs value={mode} onValueChange={(value) => { setMode(value as AuthMode); setFormError(""); }} className="w-full">
              <TabsList className="mb-6 grid h-12 w-full grid-cols-2 rounded-2xl border border-border/60 bg-muted/40 p-1">
                <TabsTrigger value="login" className="rounded-xl font-bold">Login</TabsTrigger>
                <TabsTrigger value="register" className="rounded-xl font-bold">Register</TabsTrigger>
              </TabsList>

              {formError && (
                <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {formError}
                </div>
              )}

              <TabsContent value="login" className="mt-0">
                <form onSubmit={handleLogin} className="space-y-4">
                  <AuthField id="login-email" name="email" label="Email" icon={Mail} type="email" placeholder="student@example.com" />
                  <AuthField id="login-password" name="password" label="Password" icon={Lock} type="password" placeholder="Enter your password" />

                  <div className="flex justify-end">
                    <button type="button" className="text-sm font-bold text-primary hover:underline" onClick={handlePasswordReset}>
                      Forgot Password?
                    </button>
                  </div>

                  <Button type="submit" className="h-12 w-full rounded-2xl text-base font-bold shadow-lg shadow-primary/20" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isLoading ? "Signing in..." : "Login"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="mt-0">
                <form onSubmit={handleRegister} className="space-y-4">
                  <AuthField id="reg-name" name="name" label="Full Name" icon={UserRound} placeholder="Ali Khan" />
                  <AuthField id="reg-email" name="email" label="Email" icon={Mail} type="email" placeholder="student@example.com" />
                  <AuthField id="reg-password" name="password" label="Password" icon={Lock} type="password" placeholder="At least 6 characters" />

                  <Button type="submit" className="h-12 w-full rounded-2xl text-base font-bold shadow-lg shadow-primary/20" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 rounded-2xl border border-border/60 bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
              Use your academic email when possible. Your profile can be completed after signing in.
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function AuthField({ id, name, label, icon: Icon, type = "text", placeholder }: { id: string; name: string; label: string; icon: any; type?: string; placeholder: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      <div className="relative">
        <Icon className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
        <Input
          id={id}
          name={name}
          type={type}
          placeholder={placeholder}
          className="h-12 rounded-2xl border-border/70 bg-background pl-12 font-medium shadow-sm"
          required
        />
      </div>
    </div>
  );
}

function Feature({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-3 text-sm font-semibold text-white">
      <CheckCircle2 className="h-5 w-5 shrink-0" />
      <Icon className="h-5 w-5 shrink-0 text-white/75" />
      <span>{label}</span>
    </div>
  );
}

function readFormValue(form: HTMLFormElement, name: string) {
  return ((form.elements.namedItem(name) as HTMLInputElement | null)?.value || "").trim();
}

function toFriendlyAuthError(error: any) {
  const code = String(error?.code || "");
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) {
    return "The email or password is incorrect.";
  }
  if (code.includes("email-already-in-use")) return "An account already exists with this email.";
  if (code.includes("weak-password")) return "Use a password with at least 6 characters.";
  if (code.includes("invalid-email")) return "Enter a valid email address.";
  return error?.message || "Something went wrong. Please try again.";
}
