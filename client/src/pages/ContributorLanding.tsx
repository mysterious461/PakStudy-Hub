import React from "react";
import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  FileText,
  FlaskConical,
  GraduationCap,
  Landmark,
  LibraryBig,
  PenLine,
  Presentation,
  Sigma,
  UploadCloud,
  Users,
} from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ContributorPortalShell } from "@/components/contributor/ContributorPortalShell";
import { auth } from "@/lib/firebase";

const stats = [
  { label: "Resources", value: "500+", icon: LibraryBig },
  { label: "Universities", value: "40+", icon: Landmark },
  { label: "Contributors", value: "250+", icon: Users },
  { label: "Students Helped", value: "10k+", icon: GraduationCap },
];

const categories = [
  { title: "Notes", text: "Lecture notes, summaries, and revision packs.", icon: FileText },
  { title: "Past Papers", text: "Quizzes, mids, finals, and solved references.", icon: ClipboardCheck },
  { title: "Slides", text: "Class decks and instructor-approved slides.", icon: Presentation },
  { title: "Lab Manuals", text: "Lab sheets, readings, and practical guides.", icon: FlaskConical },
  { title: "Assignments", text: "Helpful assignment references and solutions.", icon: PenLine },
  { title: "Formula Sheets", text: "Compact formulas for fast exam revision.", icon: Sigma },
];

const steps = [
  "Create Account",
  "Upload Resource",
  "Get Reviewed",
  "Help Students",
];

export default function ContributorLanding() {
  const [, setLocation] = useLocation();

  const uploadTarget = auth.currentUser ? "/contributors/upload" : "/auth?returnTo=/contributors/upload";

  return (
    <ContributorPortalShell>
      <div className="bg-[linear-gradient(180deg,rgba(22,163,74,0.08),rgba(255,255,255,0)_38%)]">
        <section className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:py-20">
          <div>
            <div className="mb-5 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary">
              Student-powered academic library
            </div>
            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight text-foreground sm:text-6xl">
              Share Knowledge. Empower Students.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
              PakStudy Hub is a student-driven platform for useful notes, past papers, slides, lab manuals, and study resources from universities across Pakistan.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button className="h-12 rounded-2xl px-6 font-bold" onClick={() => setLocation(uploadTarget)}>
                <UploadCloud className="mr-2 h-4 w-4" />
                Upload Resource
              </Button>
              <Button variant="outline" className="h-12 rounded-2xl bg-background px-6 font-bold" onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}>
                Learn More
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          <Card className="overflow-hidden border-border/60 bg-background shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
            <CardContent className="p-6">
              <div className="rounded-3xl bg-primary/10 p-5">
                <BookOpen className="h-10 w-10 text-primary" />
                <h2 className="mt-5 text-2xl font-black">Built before launch by students like you.</h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  Every approved upload becomes part of a moderated resource library that helps classmates find reliable material faster.
                </p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {stats.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-border/60 bg-background p-4">
                    <item.icon className="mb-3 h-5 w-5 text-primary" />
                    <p className="text-2xl font-black">{item.value}</p>
                    <p className="text-xs font-semibold text-muted-foreground">{item.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Resource categories</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Upload what students actually need</h2>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Card key={category.title} className="border-border/60 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="p-5">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <category.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-black">{category.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{category.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <Card className="border-border/60 bg-background shadow-sm">
            <CardContent className="p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">How it works</p>
              <div className="mt-6 grid gap-4 md:grid-cols-4">
                {steps.map((step, index) => (
                  <div key={step} className="rounded-2xl border border-border/60 bg-muted/20 p-5">
                    <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-black text-primary-foreground">
                      {index + 1}
                    </div>
                    <h3 className="font-black">{step}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {index === 0 && "Sign in with Firebase Auth and complete your contributor profile."}
                      {index === 1 && "Add course details, tags, and a PDF or image file."}
                      {index === 2 && "Moderators check quality, permission, and relevance."}
                      {index === 3 && "Approved resources become discoverable for students."}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </ContributorPortalShell>
  );
}
