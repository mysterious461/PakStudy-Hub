import React, { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle, FileUp, Loader2, UploadCloud } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ContributorPortalShell } from "@/components/contributor/ContributorPortalShell";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";

const initialForm = {
  university: "",
  department: "",
  degree: "",
  semester: "",
  course: "",
  resourceType: "notes",
  title: "",
  description: "",
  tags: "",
  hasPermission: false,
};

type UploadForm = typeof initialForm;

export default function ContributorUpload() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [form, setForm] = useState<UploadForm>(initialForm);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) setLocation("/auth?returnTo=/contributors/upload");
  }, [setLocation]);

  const updateField = (field: keyof UploadForm, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const setSelectedFile = (selected: File | null) => {
    if (!selected) {
      setFile(null);
      return;
    }

    const isPdf = selected.type === "application/pdf";
    const isImage = ["image/png", "image/jpeg"].includes(selected.type);
    const maxSize = isPdf ? 10 * 1024 * 1024 : 3 * 1024 * 1024;
    if (!isPdf && !isImage) {
      toast({ title: "Unsupported file", description: "Upload a PDF, PNG, or JPG file.", variant: "destructive" });
      return;
    }
    if (selected.size > maxSize) {
      toast({ title: "File too large", description: isPdf ? "PDF files must be 10 MB or smaller." : "Images must be 3 MB or smaller.", variant: "destructive" });
      return;
    }
    setFile(selected);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      toast({ title: "File required", description: "Attach a PDF, PNG, or JPG resource.", variant: "destructive" });
      return;
    }
    if (!form.hasPermission) {
      toast({ title: "Permission required", description: "Please confirm you can share this material.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, String(value)));
      payload.append("file", file);

      const response = await fetch("/api/contributor/resources", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: payload,
        credentials: "include",
      });

      if (!response.ok) throw new Error("Upload failed");
      setForm(initialForm);
      setFile(null);
      event.currentTarget.reset();
      toast({ title: "Submitted for review", description: "Your resource is now pending admin approval." });
      setLocation("/contributors/uploads");
    } catch {
      toast({ title: "Could not submit", description: "Please check your fields and try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ContributorPortalShell>
    <div className="min-h-[calc(100vh-170px)] flex flex-col bg-muted/10 overflow-hidden">
      <header className="px-4 sm:px-6 py-5 bg-background border-b flex items-center gap-4 shadow-sm">
        <Button variant="ghost" size="icon" className="-ml-2 hover:bg-muted/50" onClick={() => setLocation("/contributors/dashboard")}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div>
          <h1 className="text-lg font-bold">Upload Resource</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Pending review by default</p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="University"><Input value={form.university} onChange={(event) => updateField("university", event.target.value)} required /></Field>
              <Field label="Department"><Input value={form.department} onChange={(event) => updateField("department", event.target.value)} required /></Field>
              <Field label="Degree"><Input value={form.degree} onChange={(event) => updateField("degree", event.target.value)} required /></Field>
              <Field label="Semester"><Input value={form.semester} onChange={(event) => updateField("semester", event.target.value)} required /></Field>
              <Field label="Course"><Input value={form.course} onChange={(event) => updateField("course", event.target.value)} required /></Field>
              <Field label="Resource Type">
                <Select value={form.resourceType} onValueChange={(value) => updateField("resourceType", value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="notes">Notes</SelectItem>
                    <SelectItem value="past_papers">Past Papers</SelectItem>
                    <SelectItem value="slides">Slides</SelectItem>
                    <SelectItem value="lab_manual">Lab Manual</SelectItem>
                    <SelectItem value="assignment_solution">Assignment Solution</SelectItem>
                    <SelectItem value="formula_sheet">Formula Sheet</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-5 space-y-4">
              <Field label="Title"><Input value={form.title} onChange={(event) => updateField("title", event.target.value)} required /></Field>
              <Field label="Description">
                <Textarea className="min-h-28 resize-none" value={form.description} onChange={(event) => updateField("description", event.target.value)} required />
              </Field>
              <Field label="Tags">
                <Input value={form.tags} onChange={(event) => updateField("tags", event.target.value)} placeholder="calculus, midterm, solved" />
              </Field>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-5 space-y-4">
              <Field label="File Upload">
                <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 px-4 py-5 text-center hover:bg-muted/40">
                  <FileUp className="mb-2 h-7 w-7 text-muted-foreground" />
                  <span className="text-sm font-semibold">{file ? file.name : "Choose PDF, PNG, or JPG"}</span>
                  <span className="mt-1 text-xs text-muted-foreground">PDF max 10 MB. Images max 3 MB.</span>
                  <Input type="file" className="sr-only" accept=".pdf,image/png,image/jpeg" onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} required />
                </label>
              </Field>

              <label className="flex gap-3 rounded-2xl bg-primary/5 border border-primary/10 p-4 cursor-pointer">
                <Checkbox checked={form.hasPermission} onCheckedChange={(checked) => updateField("hasPermission", Boolean(checked))} />
                <span className="text-sm text-foreground/80 leading-relaxed">
                  I confirm I own this material or have permission to share it.
                </span>
              </label>

              <Button type="submit" disabled={isSubmitting} className="w-full h-12 rounded-2xl font-bold">
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UploadCloud className="w-4 h-4 mr-2" />}
                Submit Resource
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
    </ContributorPortalShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
