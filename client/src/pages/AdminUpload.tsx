import React, { useEffect, useState } from "react";
import { ArrowLeft, FileUp, Loader2, ShieldCheck, UploadCloud } from "lucide-react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { apiRequest } from "@/lib/queryClient";

const initialForm = {
  university: "",
  department: "",
  degree: "",
  semester: "",
  course: "",
  resourceType: "notes",
  title: "",
  year: new Date().getFullYear().toString(),
  tags: "",
  visibility: "draft",
  uploaderNameSource: "",
  permissionStatus: "pending",
};

type UploadForm = typeof initialForm;

export default function AdminUpload() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [form, setForm] = useState<UploadForm>(initialForm);
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [canAccess, setCanAccess] = useState(false);
  const [lastResource, setLastResource] = useState<any>(null);

  useEffect(() => {
    const verifyAccess = async () => {
      try {
        await apiRequest("GET", "/api/admin/stats");
        setCanAccess(true);
      } catch (error) {
        setCanAccess(false);
      } finally {
        setIsCheckingAccess(false);
      }
    };

    void verifyAccess();
  }, []);

  const updateField = (field: keyof UploadForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      toast({ title: "File required", description: "Attach the resource file before saving.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      payload.append("file", file);

      const response = await fetch("/api/admin/resources", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: payload,
        credentials: "include",
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.message || "Resource upload failed");
      }

      setLastResource(body);
      setForm(initialForm);
      setFile(null);
      event.currentTarget.reset();
      toast({
        title: "Resource saved",
        description: "The file is in Firebase Storage and metadata is in Firestore.",
      });
    } catch (error: any) {
      toast({ title: "Upload blocked", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-muted/10 relative overflow-hidden">
      <header className="px-6 py-4 bg-background sticky top-0 z-10 border-b flex items-center gap-4 shadow-sm">
        <Button variant="ghost" size="icon" className="-ml-2 hover:bg-muted/50" onClick={() => setLocation("/admin")}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold truncate">Content Upload</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Admin Resource Intake</p>
        </div>
        <Badge variant="outline" className="hidden sm:flex gap-1 font-semibold">
          <ShieldCheck className="w-3 h-3" />
          Admin only
        </Badge>
      </header>

      <div className="flex-1 overflow-y-auto p-6 pb-24">
        {isCheckingAccess ? (
          <div className="h-full min-h-80 flex items-center justify-center text-muted-foreground">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Checking permissions
          </div>
        ) : !canAccess ? (
          <div className="rounded-lg border bg-background p-6 text-center shadow-sm">
            <ShieldCheck className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <h2 className="font-bold">Admin access required</h2>
            <p className="text-sm text-muted-foreground mt-2">Only Admin and Moderator accounts can upload launch resources.</p>
            <Button className="mt-4" variant="outline" onClick={() => setLocation("/admin")}>Back to admin</Button>
          </div>
        ) : (
        <>
        <div className="mb-5 rounded-lg border bg-background p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base">Pre-launch academic library</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Upload verified university material with ownership, visibility, and source metadata before public release.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="University">
                  <Input value={form.university} onChange={(event) => updateField("university", event.target.value)} required />
                </Field>
                <Field label="Department">
                  <Input value={form.department} onChange={(event) => updateField("department", event.target.value)} required />
                </Field>
                <Field label="Degree">
                  <Input value={form.degree} onChange={(event) => updateField("degree", event.target.value)} required />
                </Field>
                <Field label="Semester">
                  <Input value={form.semester} onChange={(event) => updateField("semester", event.target.value)} required />
                </Field>
                <Field label="Course">
                  <Input value={form.course} onChange={(event) => updateField("course", event.target.value)} required />
                </Field>
                <Field label="Year">
                  <Input type="number" min="1990" max="2100" value={form.year} onChange={(event) => updateField("year", event.target.value)} required />
                </Field>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Resource Type">
                  <Select value={form.resourceType} onValueChange={(value) => updateField("resourceType", value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="notes">Notes</SelectItem>
                      <SelectItem value="past_paper">Past paper</SelectItem>
                      <SelectItem value="book">Book</SelectItem>
                      <SelectItem value="slides">Slides</SelectItem>
                      <SelectItem value="assignment">Assignment</SelectItem>
                      <SelectItem value="lab_manual">Lab manual</SelectItem>
                      <SelectItem value="solution">Solution</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="voice_note">Voice note</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Visibility">
                  <Select value={form.visibility} onValueChange={(value) => updateField("visibility", value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Permission Status">
                  <Select value={form.permissionStatus} onValueChange={(value) => updateField("permissionStatus", value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owned">Owned</SelectItem>
                      <SelectItem value="licensed">Licensed</SelectItem>
                      <SelectItem value="permission_granted">Permission granted</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Uploader Name / Source">
                  <Input value={form.uploaderNameSource} onChange={(event) => updateField("uploaderNameSource", event.target.value)} required />
                </Field>
              </div>

              <Field label="Title">
                <Input value={form.title} onChange={(event) => updateField("title", event.target.value)} required />
              </Field>

              <Field label="Tags">
                <Textarea
                  value={form.tags}
                  onChange={(event) => updateField("tags", event.target.value)}
                  placeholder="calculus, midterm, solved, FAST"
                  className="min-h-20 resize-none"
                />
              </Field>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-5 space-y-4">
              <Field label="Resource File">
                <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 px-4 py-5 text-center hover:bg-muted/40">
                  <FileUp className="mb-2 h-7 w-7 text-muted-foreground" />
                  <span className="text-sm font-semibold">{file ? file.name : "Choose PDF, image, or voice note"}</span>
                  <span className="mt-1 text-xs text-muted-foreground">Maximum 25 MB</span>
                  <Input
                    type="file"
                    className="sr-only"
                    accept=".pdf,image/jpeg,image/png,image/webp,audio/mpeg,audio/mp4,audio/webm,audio/wav"
                    onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                    required
                  />
                </label>
              </Field>

              <Button type="submit" disabled={isSubmitting} className="w-full font-semibold">
                {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UploadCloud className="w-4 h-4 mr-2" />}
                Save Resource
              </Button>
            </CardContent>
          </Card>
        </form>

        {lastResource && (
          <div className="mt-5 rounded-lg border bg-background p-4 shadow-sm">
            <p className="text-sm font-bold">Last upload</p>
            <p className="text-sm text-muted-foreground mt-1">{lastResource.title} saved as {lastResource.visibility}.</p>
          </div>
        )}
        </>
        )}
      </div>
    </div>
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
