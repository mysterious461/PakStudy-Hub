import React, { useState } from "react";
import { BookOpenCheck, CheckCircle2, Map, Rocket, Search, Send, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

function PageShell({ eyebrow, title, text, children }: { eyebrow: string; title: string; text: string; children: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-170px)] bg-muted/10">
      <section className="border-b bg-[linear-gradient(135deg,rgba(22,163,74,0.12),rgba(255,255,255,0)_55%)]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <p className="text-xs font-black uppercase tracking-widest text-primary">{eyebrow}</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-normal sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-muted-foreground">{text}</p>
        </div>
      </section>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}

export function AboutPakStudy() {
  return (
    <PageShell eyebrow="About PakStudy Hub" title="A student-powered academic resource library for Pakistan." text="PakStudy Hub helps students share, discover, and review high-quality academic resources across universities, departments, and courses.">
      <div className="grid gap-5 lg:grid-cols-3">
        <InfoCard icon={Rocket} title="Mission" text="Make reliable study resources easier to find for every Pakistani student." />
        <InfoCard icon={Map} title="Vision" text="A national academic knowledge graph organized by university, faculty, degree, semester, and course." />
        <InfoCard icon={Users} title="Who It Is For" text="University students, class representatives, contributors, and moderators who want better access to academic material." />
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/60 shadow-sm"><CardContent className="p-6"><h2 className="text-xl font-black">What Problem It Solves</h2><p className="mt-3 leading-8 text-muted-foreground">Students often depend on scattered WhatsApp groups, old drive links, or personal folders. PakStudy Hub brings notes, slides, past papers, lab manuals, and revision material into one reviewed, searchable structure.</p><p className="mt-3 leading-8 text-muted-foreground">The platform is independent and is not officially affiliated with universities unless explicitly stated.</p></CardContent></Card>
        <Card className="border-border/60 shadow-sm"><CardContent className="p-6"><h2 className="text-xl font-black">Platform Values</h2><ul className="mt-3 space-y-2 text-muted-foreground"><li>Accessibility for students across Pakistan</li><li>Academic collaboration without cheating</li><li>Quality through moderation</li><li>Responsible sharing and copyright respect</li></ul></CardContent></Card>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Future universities" value="100+" />
        <Stat label="Resource categories" value="9" />
        <Stat label="Review workflow" value="Human-led" />
      </div>
    </PageShell>
  );
}

export function ContributorGuidelines() {
  return (
    <PageShell eyebrow="Contributor Guidelines" title="Upload useful, legal, and well-described study resources." text="These rules keep PakStudy Hub trustworthy for students, contributors, and universities.">
      <div className="grid gap-5 lg:grid-cols-2">
        <InfoCard icon={CheckCircle2} title="What Contributors Can Upload" text="Notes, slides, past papers, assignments for reference, lab manuals, projects, formula sheets, tutorials, quizzes, voice notes, and lecture recordings when sharing is permitted." />
        <InfoCard icon={BookOpenCheck} title="Accepted File Types" text="PDF, Office documents, text, archives, images, MP3 voice notes, and MP4 lecture recordings are supported with category-specific size limits." />
        <InfoCard icon={ShieldCheck} title="Quality and Metadata" text="Use Course Code, Course Title, university, faculty, degree, semester, category, language, tags, and a helpful description so students can find the resource." />
        <InfoCard icon={Users} title="Review and Reputation" text="Uploads can be Pending, Approved, Rejected, or Needs Changes. Approved resources improve your contributor reputation and badge status." />
      </div>
      <Card className="mt-5 border-border/60 shadow-sm"><CardContent className="p-6"><h2 className="text-xl font-black">Copyright and Academic Integrity</h2><p className="mt-3 leading-8 text-muted-foreground">Do not upload paid books, private instructor material, restricted documents, or material you do not have permission to share. Do not use PakStudy Hub for cheating, impersonation, plagiarism, or submitting someone else's work as your own.</p></CardContent></Card>
    </PageShell>
  );
}

export function HelpCenter() {
  const [query, setQuery] = useState("");
  const faqs = ["Account and login", "Uploading resources", "Review process", "Rejected uploads", "Profile editing", "Reporting content", "Privacy and safety"];
  const filtered = faqs.filter((item) => item.toLowerCase().includes(query.toLowerCase()));
  return (
    <PageShell eyebrow="Help Center" title="Find answers and get contributor support." text="Search common questions or send a support request for upload and account issues.">
      <Card className="border-border/60 shadow-sm"><CardContent className="p-5"><div className="relative"><Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" /><Input className="h-12 rounded-2xl pl-12" placeholder="Search help articles..." value={query} onChange={(event) => setQuery(event.target.value)} /></div></CardContent></Card>
      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_420px]">
        <div className="space-y-3">{filtered.map((item) => <Card key={item} className="border-border/60 shadow-sm"><CardContent className="p-5"><h3 className="font-black">{item}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{faqText(item)}</p></CardContent></Card>)}</div>
        <SupportForm showName />
      </div>
    </PageShell>
  );
}

export function ContactPage() {
  return (
    <PageShell eyebrow="Contact" title="Talk to the PakStudy Hub team." text="Reach out for partnerships, contributor support, university onboarding, or product feedback.">
      <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
        <SupportForm />
        <Card className="border-border/60 shadow-sm"><CardContent className="space-y-4 p-6"><ContactRow label="Email" value="support@pakstudyhub.com" /><ContactRow label="GitHub" value="github.com/mysterious461/PakStudy-Hub" /><ContactRow label="LinkedIn" value="PakStudy Hub" /><ContactRow label="Facebook" value="@PakStudyHub" /><ContactRow label="Instagram" value="@PakStudyHub" /><ContactRow label="YouTube" value="@PakStudyHub" /></CardContent></Card>
      </div>
    </PageShell>
  );
}

export function PrivacyPolicy() {
  return (
    <PageShell eyebrow="Privacy Policy" title="Privacy Policy for PakStudy Hub." text="A production-ready privacy baseline for Firebase Auth, Firestore, Firebase Storage, contributor uploads, and Google Play distribution.">
      <Card className="border-border/60 shadow-sm"><CardContent className="space-y-6 p-6 leading-8 text-muted-foreground">
        <Policy title="Information We Collect" text="We collect account information such as name and email through Firebase Auth, contributor profile details, academic resource metadata, uploaded files, moderation status, and basic usage data needed to operate the service." />
        <Policy title="How We Use Information" text="We use data to authenticate users, store and review uploads, organize resources by academic hierarchy, prevent abuse, improve discovery, support contributors, and prepare app services for Google Play." />
        <Policy title="Firebase and Google Services" text="PakStudy Hub uses Firebase Auth, Firestore, and Firebase Storage. Your data may be processed by Google Cloud infrastructure according to Google Firebase terms and security practices." />
        <Policy title="Contributor Uploads" text="Uploaded resources may include documents, images, audio, video, and archives. Approved resources can become publicly visible. Pending, rejected, and private moderation data remains restricted to authorized users and admins." />
        <Policy title="Data Sharing" text="We do not sell personal information. We may share data when required by law, to enforce safety and copyright rules, or with trusted service providers needed to operate the platform." />
        <Policy title="Your Choices" text="You may update your profile, request deletion or correction of personal data, and contact support for account or upload privacy concerns." />
        <Policy title="Children and Students" text="PakStudy Hub is intended for students old enough to manage an academic account under applicable law and platform rules. Google Play disclosures will be maintained before Android launch." />
        <Policy title="Security" text="We use Firebase security features, role-based access, admin review workflows, and storage restrictions. No system can be guaranteed perfectly secure, but we continuously improve protections." />
        <Policy title="Contact" text="For privacy questions, contact support@pakstudyhub.com." />
      </CardContent></Card>
    </PageShell>
  );
}

export function TermsOfService() {
  return <PolicyPage eyebrow="Terms of Service" title="Terms for using PakStudy Hub" sections={[
    ["Acceptable Use", "Use PakStudy Hub for learning support, revision, resource sharing, and academic collaboration. Do not abuse, disrupt, scrape, or attempt unauthorized access."],
    ["User-Generated Content", "You are responsible for resources, profile information, and messages you submit. By uploading, you confirm you have the rights or permission to share that material."],
    ["Prohibited Uploads", "Do not upload copyrighted books without permission, exam leaks, private instructor files, malicious archives, personal data, hateful content, or cheating services."],
    ["Academic Integrity", "Resources are for reference and learning. Users must not plagiarize, impersonate, or submit another person's work as their own."],
    ["Moderation Rights", "PakStudy Hub may approve, reject, remove, hide, or request changes to resources and may suspend accounts that violate platform rules."],
    ["No University Affiliation", "PakStudy Hub is independent and not officially affiliated with universities unless explicitly stated."],
    ["Limitation of Liability", "The platform is provided as-is. We work to improve quality but cannot guarantee every resource is complete, accurate, or suitable for every course."],
  ]} />;
}

export function CopyrightPolicy() {
  return <PolicyPage eyebrow="Copyright Policy" title="Responsible sharing and takedown requests" sections={[
    ["Contributor Responsibility", "Only upload material you created, own, or have permission to share."],
    ["Takedown Requests", "Use the Contact page and choose Copyright concern. Include your name, contact email, resource URL/title, ownership basis, and a statement that the claim is accurate."],
    ["Review", "PakStudy Hub may remove or restrict access to reported material while reviewing a complaint."],
    ["Repeat Infringers", "Accounts repeatedly uploading infringing material may lose contributor access or be suspended."],
  ]} />;
}

export function AcademicIntegrityPolicy() {
  return <PolicyPage eyebrow="Academic Integrity" title="Learning support, not cheating" sections={[
    ["Purpose", "PakStudy Hub supports revision, resource discovery, and academic collaboration."],
    ["Not Allowed", "Do not use the platform for cheating, impersonation, plagiarism, exam leaks, or submitting another person's work as your own."],
    ["Assignment Solutions", "Assignment solutions, where allowed, must be educational/reference material and must not be marketed as cheating services."],
    ["Moderation", "Resources that encourage misconduct may be rejected or removed."],
  ]} />;
}

function SupportForm({ showName = false }: { showName?: boolean }) {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", category: "General inquiry", message: "" });
  const submit = async () => {
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/contact-messages", {
        name: form.name || "PakStudy Hub visitor",
        email: form.email,
        category: form.category,
        message: form.message,
      });
      setIsSubmitted(true);
      toast({ title: "Message submitted", description: "Thanks. Your message has been sent to PakStudy Hub support." });
    } catch (error: any) {
      toast({ title: "Message not sent", description: error.message || "Please check the form and try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  if (isSubmitted) return <Card className="border-border/60 shadow-sm"><CardContent className="p-6 text-center"><CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-primary" /><h2 className="text-xl font-black">Message sent</h2><p className="mt-2 text-sm text-muted-foreground">We received your request and will review it from the admin dashboard.</p></CardContent></Card>;
  return (
    <Card className="border-border/60 shadow-sm"><CardContent className="space-y-4 p-6"><h2 className="text-xl font-black">Support request</h2>{showName && <Field label="Name"><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Your name" /></Field>}<Field label="Email"><Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="support@pakstudyhub.com" /></Field><Field label="Category"><Select value={form.category} onValueChange={(category) => setForm({ ...form, category })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["General inquiry", "Upload problem", "Copyright concern", "Report content", "Partnership", "Technical issue"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></Field><Field label="Message"><Textarea className="min-h-32 resize-none" value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} placeholder="Tell us how we can help." /></Field><Button className="rounded-2xl font-bold" disabled={isLoading} onClick={submit}><Send className="mr-2 h-4 w-4" />{isLoading ? "Sending..." : "Send Request"}</Button></CardContent></Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">{label}</Label>{children}</div>;
}

function PolicyPage({ eyebrow, title, sections }: { eyebrow: string; title: string; sections: string[][] }) {
  return <PageShell eyebrow={eyebrow} title={title} text="These terms help keep PakStudy Hub useful, lawful, and safe for students and contributors."><Card className="border-border/60 shadow-sm"><CardContent className="space-y-6 p-6 leading-8 text-muted-foreground">{sections.map(([sectionTitle, text]) => <Policy key={sectionTitle} title={sectionTitle} text={text} />)}</CardContent></Card></PageShell>;
}

function faqText(topic: string) {
  const answers: Record<string, string> = {
    "Account and login": "Use Firebase email authentication to sign in. If you forget your password, use the password reset option on the auth page.",
    "Uploading resources": "Complete the hierarchy fields, Course Code, Course Title, tags, description, permission confirmation, and attach a supported file.",
    "Review process": "Uploads start Pending. Moderators can mark them Approved, Rejected, or Needs Changes.",
    "Rejected uploads": "Rejected uploads may have copyright, quality, metadata, or academic-integrity issues. Read the review note and upload a corrected resource.",
    "Profile editing": "Open Profile from the portal header to update contributor details such as university, degree program, study level, and bio.",
    "Reporting content": "Use Contact and choose Report content. Include the resource title or URL and explain the concern clearly.",
    "Privacy and safety": "PakStudy Hub stores account, profile, upload, and contact data in Firebase/Google Cloud services and restricts admin data to authorized roles.",
  };
  return answers[topic] || "Use the contact form if you need help with this topic.";
}

function InfoCard({ icon: Icon, title, text }: { icon: any; title: string; text: string }) {
  return <Card className="border-border/60 shadow-sm"><CardContent className="p-6"><Icon className="mb-4 h-7 w-7 text-primary" /><h2 className="text-xl font-black">{title}</h2><p className="mt-3 leading-7 text-muted-foreground">{text}</p></CardContent></Card>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return <Card className="border-border/60 shadow-sm"><CardContent className="p-5"><p className="text-3xl font-black text-primary">{value}</p><p className="text-sm font-semibold text-muted-foreground">{label}</p></CardContent></Card>;
}

function ContactRow({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-border/60 bg-muted/20 p-4"><p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{label}</p><p className="mt-1 font-bold">{value}</p></div>;
}

function Policy({ title, text }: { title: string; text: string }) {
  return <section><h2 className="text-xl font-black text-foreground">{title}</h2><p className="mt-2">{text}</p></section>;
}
