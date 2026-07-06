import React, { useEffect, useMemo, useState } from "react";
import { Archive, CheckCircle, FileText, Home, Image, Info, Loader2, Music, Presentation, Table, UploadCloud, Video, X } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";

const currentYear = new Date().getFullYear();

const initialForm = {
  university: "",
  department: "",
  degree: "",
  semester: "",
  course: "",
  subject: "",
  resourceType: "notes",
  language: "English",
  title: "",
  description: "",
  tags: "",
  teacherName: "",
  year: String(currentYear),
  examSession: "",
  edition: "",
  publisher: "",
  hasPermission: false,
};

type UploadForm = typeof initialForm;

const requiredFields: Array<{ key: keyof UploadForm; label: string; minLength?: number }> = [
  { key: "university", label: "University", minLength: 2 },
  { key: "department", label: "Department", minLength: 2 },
  { key: "degree", label: "Degree", minLength: 2 },
  { key: "semester", label: "Semester" },
  { key: "course", label: "Course", minLength: 2 },
  { key: "subject", label: "Subject", minLength: 2 },
  { key: "language", label: "Language", minLength: 2 },
  { key: "title", label: "Title", minLength: 3 },
  { key: "description", label: "Description" },
];

const acceptedExtensions = ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.zip,.rar,.7z,.png,.jpg,.jpeg,.webp,.gif,.mp3,.mp4";

type FileRule = {
  category: "pdf" | "word" | "powerpoint" | "excel" | "text" | "archive" | "image" | "audio" | "video";
  icon: any;
  maxSize: number;
  label: string;
};

const fileRules: Record<string, FileRule> = {
  pdf: { category: "pdf", icon: FileText, maxSize: 25, label: "PDF" },
  doc: { category: "word", icon: FileText, maxSize: 50, label: "Word" },
  docx: { category: "word", icon: FileText, maxSize: 50, label: "Word" },
  ppt: { category: "powerpoint", icon: Presentation, maxSize: 50, label: "PowerPoint" },
  pptx: { category: "powerpoint", icon: Presentation, maxSize: 50, label: "PowerPoint" },
  xls: { category: "excel", icon: Table, maxSize: 50, label: "Excel" },
  xlsx: { category: "excel", icon: Table, maxSize: 50, label: "Excel" },
  txt: { category: "text", icon: FileText, maxSize: 50, label: "Text" },
  csv: { category: "text", icon: Table, maxSize: 50, label: "CSV" },
  zip: { category: "archive", icon: Archive, maxSize: 100, label: "ZIP" },
  rar: { category: "archive", icon: Archive, maxSize: 100, label: "RAR" },
  "7z": { category: "archive", icon: Archive, maxSize: 100, label: "7Z" },
  png: { category: "image", icon: Image, maxSize: 10, label: "Image" },
  jpg: { category: "image", icon: Image, maxSize: 10, label: "Image" },
  jpeg: { category: "image", icon: Image, maxSize: 10, label: "Image" },
  webp: { category: "image", icon: Image, maxSize: 10, label: "Image" },
  gif: { category: "image", icon: Image, maxSize: 10, label: "Image" },
  mp3: { category: "audio", icon: Music, maxSize: 50, label: "Audio" },
  mp4: { category: "video", icon: Video, maxSize: 100, label: "Video" },
};

async function readUploadError(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const payload = await response.json().catch(() => null);
    const fieldErrors = Array.isArray(payload?.errors)
      ? payload.errors.map((error: any) => `${error.path || "Field"}: ${error.message}`).join("; ")
      : "";
    return fieldErrors || payload?.message || "Upload failed. Please check your fields and try again.";
  }
  return "The upload service is not responding correctly. Please try again in a moment.";
}

export default function ContributorUpload() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [form, setForm] = useState<UploadForm>(initialForm);
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeFileName, setActiveFileName] = useState("");

  useEffect(() => {
    if (!auth.currentUser) setLocation("/auth?returnTo=/contributors/upload");
  }, [setLocation]);

  useEffect(() => {
    const first = files[0];
    if (!first) {
      setPreviewUrl("");
      return;
    }
    const rule = getFileRule(first);
    if (!["image", "audio", "video", "pdf"].includes(rule?.category || "")) {
      setPreviewUrl("");
      return;
    }
    const nextUrl = URL.createObjectURL(first);
    setPreviewUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [files]);

  const selectedSize = useMemo(() => files.reduce((sum, file) => sum + file.size, 0), [files]);
  const estimatedSeconds = Math.max(1, Math.ceil(selectedSize / (1.5 * 1024 * 1024)));

  const updateField = (field: keyof UploadForm, value: string | boolean) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const addFiles = (selected: FileList | File[]) => {
    const nextFiles = Array.from(selected);
    const invalid = nextFiles.map(validateFile).find(Boolean);
    if (invalid) {
      toast({ title: "File not accepted", description: invalid, variant: "destructive" });
      return;
    }
    setFiles((current) => [...current, ...nextFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const missingField = requiredFields.find(({ key, minLength = 1 }) => String(form[key]).trim().length < minLength);
    if (missingField) {
      toast({ title: `${missingField.label} required`, description: `Please enter a valid ${missingField.label.toLowerCase()}.`, variant: "destructive" });
      return;
    }
    if (files.length === 0) {
      toast({ title: "File required", description: "Attach at least one supported resource file.", variant: "destructive" });
      return;
    }
    if (!form.hasPermission) {
      toast({ title: "Permission required", description: "Please confirm you can share this material.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    setProgress(0);
    try {
      const user = auth.currentUser;
      if (!user) {
        setLocation("/auth?returnTo=/contributors/upload");
        throw new Error("Please sign in before uploading resources.");
      }

      const token = await user.getIdToken();
      let completedBytes = 0;
      for (const file of files) {
        setActiveFileName(file.name);
        await uploadOneFile(file, form, token, selectedSize, completedBytes, (value) => setProgress(value));
        completedBytes += file.size;
      }

      setForm(initialForm);
      setFiles([]);
      formElement.reset();
      setIsSubmitted(true);
      toast({ title: "Submitted for review", description: `${files.length} resource${files.length === 1 ? "" : "s"} submitted for admin approval.` });
    } catch (error: any) {
      toast({ title: "Could not submit", description: error.message || "Please check your fields and try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
      setActiveFileName("");
    }
  };

  return (
    <div className="min-h-[calc(100vh-170px)] bg-muted/10">
      <div className="border-b bg-background shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Button variant="outline" size="sm" className="mb-3 rounded-2xl font-bold" onClick={() => setLocation("/contribute")}>
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
            <h1 className="text-3xl font-black tracking-normal">Upload Resource</h1>
            <p className="mt-2 text-sm text-muted-foreground">Add files, complete metadata, and submit for moderator review.</p>
          </div>
          <Button variant="outline" className="rounded-2xl font-bold" onClick={() => setLocation("/contributors/uploads")}>View My Uploads</Button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
        {isSubmitted ? (
          <Card className="mx-auto max-w-2xl border-border/60 shadow-sm">
            <CardContent className="p-8 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                <CheckCircle className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-black">Submitted for Review</h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">Your resource batch is now in the moderation queue. You can track status from My Uploads.</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Button className="h-12 rounded-2xl font-bold" onClick={() => setLocation("/contributors/uploads")}>Go to My Uploads</Button>
                <Button variant="outline" className="h-12 rounded-2xl font-bold" onClick={() => setIsSubmitted(false)}>Upload More</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-5 xl:grid-cols-[1fr_360px]">
            <div className="space-y-5">
              <Card className="border-border/60 shadow-sm">
                <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
                  <Field label="University"><Input placeholder="National University of Sciences and Technology" value={form.university} onChange={(event) => updateField("university", event.target.value)} required /></Field>
                  <Field label="Department"><Input placeholder="School of Electrical Engineering" value={form.department} onChange={(event) => updateField("department", event.target.value)} required /></Field>
                  <Field label="Degree"><Input placeholder="BS Computer Science" value={form.degree} onChange={(event) => updateField("degree", event.target.value)} required /></Field>
                  <Field label="Semester"><Input placeholder="4th semester" value={form.semester} onChange={(event) => updateField("semester", event.target.value)} required /></Field>
                  <Field label="Course"><Input placeholder="CS-201 Data Structures" value={form.course} onChange={(event) => updateField("course", event.target.value)} required /></Field>
                  <Field label="Subject"><Input placeholder="Algorithms, Calculus, Circuits" value={form.subject} onChange={(event) => updateField("subject", event.target.value)} required /></Field>
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
                        <SelectItem value="lecture_recording">Lecture Recording</SelectItem>
                        <SelectItem value="voice_note">Voice Note</SelectItem>
                        <SelectItem value="archive">Archive</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Language"><Input placeholder="English, Urdu" value={form.language} onChange={(event) => updateField("language", event.target.value)} required /></Field>
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-sm">
                <CardContent className="space-y-4 p-5">
                  <Field label="Title"><Input placeholder="Solved Midterm 2024 or Lecture 1 Notes" value={form.title} onChange={(event) => updateField("title", event.target.value)} required /></Field>
                  <Field label="Description">
                    <Textarea placeholder="Briefly describe what this resource contains and who it can help." className="min-h-28 resize-none" value={form.description} onChange={(event) => updateField("description", event.target.value)} required />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Tags"><Input value={form.tags} onChange={(event) => updateField("tags", event.target.value)} placeholder="calculus, midterm, solved" /></Field>
                    <Field label="Teacher Name"><Input value={form.teacherName} onChange={(event) => updateField("teacherName", event.target.value)} placeholder="Optional" /></Field>
                    <Field label="Year"><Input value={form.year} onChange={(event) => updateField("year", event.target.value)} placeholder="2026" /></Field>
                    <Field label="Exam Session"><Input value={form.examSession} onChange={(event) => updateField("examSession", event.target.value)} placeholder="Spring, Fall, Midterm" /></Field>
                    <Field label="Edition"><Input value={form.edition} onChange={(event) => updateField("edition", event.target.value)} placeholder="Optional" /></Field>
                    <Field label="Publisher"><Input value={form.publisher} onChange={(event) => updateField("publisher", event.target.value)} placeholder="Optional" /></Field>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60 shadow-sm">
                <CardContent className="space-y-4 p-5">
                  <Field label="File Upload">
                    <label
                      className={`flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed px-4 py-6 text-center transition-colors ${isDragging ? "border-primary bg-primary/10" : "border-border bg-muted/20 hover:bg-muted/40"}`}
                      onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(event) => {
                        event.preventDefault();
                        setIsDragging(false);
                        addFiles(event.dataTransfer.files);
                      }}
                    >
                      <UploadCloud className="mb-3 h-9 w-9 text-primary" />
                      <span className="text-base font-black">Drag files here or browse</span>
                      <span className="mt-2 max-w-xl text-xs leading-6 text-muted-foreground">PDF, Office, text, archives, images, MP3 voice notes, and MP4 lecture recordings. Multiple files are supported.</span>
                      <Input type="file" multiple className="sr-only" accept={acceptedExtensions} onChange={(event) => event.target.files && addFiles(event.target.files)} />
                    </label>
                  </Field>

                  {files.length > 0 && (
                    <div className="grid gap-3">
                      {files.map((file, index) => (
                        <SelectedFile key={`${file.name}-${file.size}-${index}`} file={file} onRemove={() => removeFile(index)} />
                      ))}
                    </div>
                  )}

                  <label className="flex cursor-pointer gap-3 rounded-2xl border border-primary/10 bg-primary/5 p-4">
                    <Checkbox checked={form.hasPermission} onCheckedChange={(checked) => updateField("hasPermission", Boolean(checked))} />
                    <span className="text-sm leading-relaxed text-foreground/80">I confirm I own this material or have permission to share it.</span>
                  </label>

                  {isSubmitting && (
                    <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-bold">{activeFileName || "Uploading resources"}</span>
                        <span className="font-black text-primary">{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <p className="mt-2 text-xs text-muted-foreground">Estimated time before upload: about {estimatedSeconds} seconds. Actual time depends on connection speed.</p>
                    </div>
                  )}

                  <Button type="submit" disabled={isSubmitting} className="h-12 w-full rounded-2xl font-bold">
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                    Submit Resource
                  </Button>
                </CardContent>
              </Card>
            </div>

            <aside className="space-y-4">
              <Card className="border-border/60 shadow-sm xl:sticky xl:top-24">
                <CardContent className="p-5">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Info className="h-5 w-5" />
                  </div>
                  <h2 className="font-black">Upload Guidelines</h2>
                  <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                    <li>Upload only your own notes or material you have permission to share.</li>
                    <li>PDF max 25 MB. Office, text, and audio max 50 MB.</li>
                    <li>Images max 10 MB. Video and archives max 100 MB.</li>
                    <li>All uploads are reviewed before publication.</li>
                    <li>Files are structured for future OCR, summaries, flashcards, quizzes, virus scanning, and duplicate detection.</li>
                  </ul>
                </CardContent>
              </Card>

              <PreviewPanel file={files[0]} previewUrl={previewUrl} />
            </aside>
          </form>
        )}
      </div>
    </div>
  );
}

function uploadOneFile(file: File, form: UploadForm, token: string, totalBytes: number, completedBytes: number, onProgress: (progress: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (typeof value === "boolean") {
        payload.append(key, String(value));
        return;
      }
      const trimmed = value.trim();
      if (trimmed || ["year", "language"].includes(key)) payload.append(key, trimmed);
    });
    payload.append("file", file);

    const request = new XMLHttpRequest();
    request.open("POST", "/api/contributor/resources");
    request.setRequestHeader("Authorization", `Bearer ${token}`);
    request.upload.onprogress = (event) => {
      if (!event.lengthComputable || !totalBytes) return;
      onProgress(Math.min(99, ((completedBytes + event.loaded) / totalBytes) * 100));
    };
    request.onload = async () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress(Math.min(100, ((completedBytes + file.size) / totalBytes) * 100));
        resolve();
        return;
      }
      const response = new Response(request.responseText, { status: request.status, headers: { "content-type": request.getResponseHeader("content-type") || "application/json" } });
      reject(new Error(await readUploadError(response)));
    };
    request.onerror = () => reject(new Error("Network error while uploading. Please try again."));
    request.send(payload);
  });
}

function validateFile(file: File) {
  const rule = getFileRule(file);
  if (!rule) return `${file.name} is not a supported file type.`;
  if (file.size > rule.maxSize * 1024 * 1024) return `${file.name} is too large. ${rule.label} files must be ${rule.maxSize} MB or smaller.`;
  return "";
}

function getFileRule(file: File) {
  const extension = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "";
  return fileRules[extension];
}

function SelectedFile({ file, onRemove }: { file: File; onRemove: () => void }) {
  const rule = getFileRule(file);
  const Icon = rule?.icon || FileText;
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background p-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black">{file.name}</p>
        <p className="text-xs text-muted-foreground">{rule?.label || "File"} / {formatSize(file.size)}</p>
      </div>
      <Button type="button" variant="ghost" size="icon" className="rounded-xl" onClick={onRemove}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

function PreviewPanel({ file, previewUrl }: { file?: File; previewUrl: string }) {
  const rule = file ? getFileRule(file) : undefined;
  const Icon = rule?.icon || FileText;
  return (
    <Card className="border-border/60 shadow-sm">
      <CardContent className="p-5">
        <h2 className="font-black">Preview</h2>
        {!file ? (
          <div className="mt-4 flex min-h-52 flex-col items-center justify-center rounded-3xl border border-dashed bg-muted/20 text-center text-sm text-muted-foreground">
            Select a file to preview it here.
          </div>
        ) : rule?.category === "image" && previewUrl ? (
          <img src={previewUrl} alt={file.name} className="mt-4 aspect-video w-full rounded-3xl border object-cover" />
        ) : rule?.category === "audio" && previewUrl ? (
          <audio controls src={previewUrl} className="mt-5 w-full" />
        ) : rule?.category === "video" && previewUrl ? (
          <video controls src={previewUrl} className="mt-4 aspect-video w-full rounded-3xl border object-cover" />
        ) : rule?.category === "pdf" && previewUrl ? (
          <iframe src={previewUrl} title={file.name} className="mt-4 h-80 w-full rounded-3xl border bg-white" />
        ) : (
          <div className="mt-4 flex min-h-52 flex-col items-center justify-center rounded-3xl border bg-muted/20 text-center">
            <Icon className="mb-3 h-12 w-12 text-primary" />
            <p className="font-black">{rule?.label || "File"} preview</p>
            <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">A full preview is not available in-browser for this file type yet.</p>
          </div>
        )}
      </CardContent>
    </Card>
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

function formatSize(size: number) {
  if (!size) return "0 MB";
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
