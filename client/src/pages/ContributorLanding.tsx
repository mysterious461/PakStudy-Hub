import React from "react";
import { Award, BookOpen, Clock, GraduationCap, ShieldCheck, UploadCloud, Users } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ContributorPortalShell } from "@/components/contributor/ContributorPortalShell";
import { auth } from "@/lib/firebase";

const benefits = [
  { icon: Award, title: "Founding Contributor badge", text: "Stand out as one of the first students helping seed the library." },
  { icon: GraduationCap, title: "Academic recognition", text: "Build reputation through approved, useful study material." },
  { icon: Users, title: "Help other students", text: "Make reliable notes and papers easier to find across Pakistan." },
  { icon: Clock, title: "Early access", text: "Get early access to contributor tools before the public launch." },
];

export default function ContributorLanding() {
  const [, setLocation] = useLocation();

  const goToPortal = () => {
    setLocation(auth.currentUser ? "/contributors/dashboard" : "/auth?returnTo=/contributors/dashboard");
  };

  return (
    <ContributorPortalShell>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
        <section className="rounded-3xl bg-background border border-border/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 sm:p-10 overflow-hidden relative">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl translate-x-12 -translate-y-12" />
          <div className="relative max-w-3xl">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5">
              <BookOpen className="h-6 w-6" />
            </div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-primary mb-3">PakStudy Hub Contributors</p>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight mb-4">Help Build Pakistan's Student Resource Library</h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6">
              Upload notes, past papers, slides, lab manuals, formula sheets, and study material so students can find useful academic resources before the Android app launches.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button className="h-12 rounded-2xl font-bold" onClick={goToPortal}>
                <ShieldCheck className="w-4 h-4 mr-2" />
                Become a Contributor
              </Button>
              <Button variant="outline" className="h-12 rounded-2xl font-bold bg-background/70" onClick={() => setLocation(auth.currentUser ? "/contributors/upload" : "/auth?returnTo=/contributors/upload")}>
                <UploadCloud className="w-4 h-4 mr-2" />
                Upload Resources
              </Button>
              <Button variant="outline" className="h-12 rounded-2xl font-bold bg-background/70" onClick={() => setLocation(auth.currentUser ? "/profile" : "/auth?returnTo=/contributors/dashboard")}>
                Sign In / Sign Up
              </Button>
            </div>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {benefits.map((benefit) => (
            <Card key={benefit.title} className="border-border/50 shadow-sm">
              <CardContent className="p-5">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-4">
                  <benefit.icon className="w-5 h-5" />
                </div>
                <h2 className="font-bold text-sm mb-2">{benefit.title}</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">{benefit.text}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </ContributorPortalShell>
  );
}
