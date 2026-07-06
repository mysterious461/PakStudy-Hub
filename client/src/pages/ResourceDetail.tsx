import React, { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, Download, Eye, FileArchive, FileText, Flag, Image, Loader2, Music, ShieldCheck, Star, Tag, Video } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { onAuthStateChanged } from "firebase/auth";

export default function ResourceDetail() {
  const [, params] = useRoute("/resources/:resourceId");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [resource, setResource] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState("");
  const [reportReason, setReportReason] = useState("");

  const resourceId = params?.resourceId;

  useEffect(() => {
    if (!resourceId) return;
    let cancelled = false;
    const load = async (token = "") => {
      setIsLoading(true);
      setAccessDenied("");
      try {
        const response = await fetch(`/api/resources/${resourceId}`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
        if (response.status === 403) {
          setAccessDenied("This resource is not publicly available yet.");
          return;
        }
        if (!response.ok) throw new Error("Resource not found");
        const payload = await response.json();
        if (cancelled) return;
        setResource(payload);
        void fetch(`/api/resources/${resourceId}/view`, { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : undefined });
        const relatedResponse = await fetch(`/api/resources/public?courseCode=${encodeURIComponent(payload.courseCode || "")}&resourceType=${encodeURIComponent(payload.resourceCategory || payload.resourceType || "")}`);
        if (relatedResponse.ok) {
          const relatedPayload = await relatedResponse.json();
          if (!cancelled) setRelated(relatedPayload.filter((item: any) => item.id !== payload.id).slice(0, 3));
        }
      } catch {
        if (!cancelled) setAccessDenied("We could not load this resource.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      void user?.getIdToken().catch(() => "").then((token) => load(token || ""));
      if (!user) void load("");
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [resourceId]);

  const handleDownload = async () => {
    if (!resource) return;
    const token = await auth.currentUser?.getIdToken().catch(() => "");
    const response = await fetch(`/api/resources/${resource.id}/download`, { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : undefined });
    if (!response.ok) {
      toast({ title: "Download blocked", description: "You do not have access to download this resource.", variant: "destructive" });
      return;
    }
    const payload = await response.json();
    window.open(payload.fileUrl || resource.fileUrl || resource.file?.url, "_blank");
    setResource({ ...resource, downloads: Number(resource.downloads || 0) + 1 });
  };

  const handleReport = async () => {
    if (!resource) return;
    const token = await auth.currentUser?.getIdToken().catch(() => "");
    const response = await fetch(`/api/resources/${resource.id}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ reason: reportReason || "Resource reported from detail page" }),
    });
    if (response.ok) {
      toast({ title: "Report submitted", description: "Thanks. A moderator will review this resource." });
      setReportReason("");
    }
  };

  if (isLoading) {
    return <div className="flex min-h-[calc(100vh-170px)] items-center justify-center bg-muted/10 text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading resource</div>;
  }

  if (accessDenied || !resource) {
    return (
      <div className="flex min-h-[calc(100vh-170px)] items-center justify-center bg-muted/10 px-4">
        <Card className="max-w-lg border-border/60 shadow-sm">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-amber-600" />
            <h1 className="text-2xl font-black">Access unavailable</h1>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{accessDenied || "This resource could not be found."}</p>
            <Button className="mt-6 rounded-2xl font-bold" onClick={() => setLocation("/resources")}>Browse Resources</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const Icon = iconFor(resource);
  return (
    <div className="min-h-[calc(100vh-170px)] bg-muted/10">
      <div className="border-b bg-background shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <Button variant="outline" className="mb-5 rounded-2xl font-bold" onClick={() => setLocation("/resources")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Resources
          </Button>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="rounded-full">{labelType(resource.resourceCategory || resource.resourceType)}</Badge>
                <Badge variant="outline" className={resource.status === "approved" ? "border-green-200 bg-green-50 text-green-700" : "border-amber-200 bg-amber-50 text-amber-700"}>{labelType(resource.status)}</Badge>
              </div>
              <h1 className="max-w-4xl text-4xl font-black tracking-normal">{resource.title}</h1>
              <p className="mt-3 text-base text-muted-foreground">{displayCourse(resource)}</p>
            </div>
            <Button className="h-12 rounded-2xl px-6 font-bold shadow-lg shadow-primary/15" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_360px]">
        <main className="space-y-5">
          <PreviewPanel resource={resource} />

          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-5 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/10 text-primary"><Icon className="h-7 w-7" /></div>
                <div>
                  <p className="font-black">File Details</p>
                  <p className="text-sm text-muted-foreground">{resource.fileName || resource.file?.originalName}</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Meta label="University" value={resource.university} />
                <Meta label="Department / Faculty" value={resource.faculty || resource.department} />
                <Meta label="Degree Program" value={resource.degree} />
                <Meta label="Semester" value={resource.semester} />
                <Meta label="Academic Year / Session" value={String(resource.year || "")} />
                <Meta label="Language" value={resource.language} />
                <Meta label="Contributor" value={resource.uploadedByName || "Contributor"} />
                <Meta label="Upload Date" value={formatDate(resource.createdAt)} />
                <Meta label="File Type" value={resource.fileExtension || resource.fileType || "File"} />
                <Meta label="File Size" value={formatSize(resource.fileSize || resource.file?.size || 0)} />
                <Meta label="Views" value={String(resource.views || 0)} />
                <Meta label="Downloads" value={String(resource.downloads || 0)} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-xl font-black">Description</h2>
              <p className="mt-3 leading-8 text-muted-foreground">{resource.description || "No description provided."}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {(resource.tags || []).map((tag: string) => <Badge key={tag} variant="outline" className="rounded-full"><Tag className="mr-1 h-3 w-3" />{tag}</Badge>)}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-xl font-black">Related Resources</h2>
              {related.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">No closely related approved resources yet.</p>
              ) : (
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {related.map((item) => (
                    <button key={item.id} className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-left transition hover:border-primary/30 hover:bg-primary/5" onClick={() => setLocation(`/resources/${item.id}`)}>
                      <p className="line-clamp-2 font-black">{item.title}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{displayCourse(item)}</p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>

        <aside className="space-y-5">
          <Card className="border-border/60 shadow-sm">
            <CardContent className="space-y-4 p-5">
              <div className="grid grid-cols-3 gap-3">
                <MiniMetric icon={Eye} label="Views" value={resource.views || 0} />
                <MiniMetric icon={Download} label="Downloads" value={resource.downloads || 0} />
                <MiniMetric icon={Star} label="Rating" value="Soon" />
              </div>
              <Button className="w-full rounded-2xl font-bold" onClick={handleDownload}><Download className="mr-2 h-4 w-4" />Download Resource</Button>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <h2 className="font-black">Report Resource</h2>
              </div>
              <p className="mb-3 text-sm leading-6 text-muted-foreground">Report copyright, quality, academic-integrity, or safety concerns.</p>
              <Textarea className="min-h-24 resize-none" value={reportReason} onChange={(event) => setReportReason(event.target.value)} placeholder="Briefly explain the issue." />
              <Button variant="outline" className="mt-3 w-full rounded-2xl font-bold" onClick={handleReport}><Flag className="mr-2 h-4 w-4" />Submit Report</Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-border/60 bg-muted/20 p-4"><p className="text-xs font-black uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 font-bold">{value || "Not added"}</p></div>;
}

function MiniMetric({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return <div className="rounded-2xl border border-border/60 bg-muted/20 p-3 text-center"><Icon className="mx-auto mb-2 h-4 w-4 text-primary" /><p className="font-black">{value}</p><p className="text-[10px] font-bold uppercase text-muted-foreground">{label}</p></div>;
}

function PreviewPanel({ resource }: { resource: any }) {
  const fileUrl = resource.fileUrl || resource.file?.url;
  const fileType = String(resource.fileType || resource.file?.contentType || "").toLowerCase();
  const extension = String(resource.fileExtension || "").toLowerCase();
  const Icon = iconFor(resource);

  return (
    <Card className="overflow-hidden border-border/60 shadow-sm">
      <CardContent className="p-0">
        <div className="border-b px-6 py-4">
          <h2 className="text-xl font-black">Preview</h2>
          <p className="mt-1 text-sm text-muted-foreground">Preview is shown when the file type is safe for browser viewing. Download remains a separate tracked action.</p>
        </div>
        {fileUrl && fileType.includes("pdf") ? (
          <iframe title={resource.title} src={fileUrl} className="h-[560px] w-full bg-muted/20" />
        ) : fileUrl && fileType.includes("image") ? (
          <div className="flex min-h-96 items-center justify-center bg-muted/20 p-4">
            <img src={fileUrl} alt={resource.title} className="max-h-[620px] max-w-full rounded-2xl object-contain shadow-sm" />
          </div>
        ) : fileUrl && fileType.includes("audio") ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-4 bg-muted/20 p-8">
            <Icon className="h-14 w-14 text-primary" />
            <audio controls className="w-full max-w-xl" src={fileUrl} />
          </div>
        ) : fileUrl && fileType.includes("video") ? (
          <div className="bg-black p-2">
            <video controls className="mx-auto max-h-[620px] w-full rounded-xl" src={fileUrl} />
          </div>
        ) : (
          <div className="flex min-h-72 flex-col items-center justify-center bg-muted/20 p-8 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-primary/10 text-primary">
              <Icon className="h-10 w-10" />
            </div>
            <h3 className="text-lg font-black">{labelType(extension || resource.fileType || "File")} preview is not available</h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">Office documents, archives, and some media files should be downloaded to view in the appropriate app.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function displayCourse(resource: any) {
  const title = resource.courseTitle || resource.course || resource.subject || "Course";
  return resource.courseCode ? `${resource.courseCode} / ${title}` : title;
}

function labelType(type: string) {
  return type ? type.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) : "Resource";
}

function iconFor(resource: any) {
  const category = resource.fileCategory || resource.fileType || "";
  if (String(category).includes("image")) return Image;
  if (String(category).includes("audio")) return Music;
  if (String(category).includes("video")) return Video;
  if (String(category).includes("archive") || ["zip", "rar", "7z"].includes(resource.fileExtension)) return FileArchive;
  return FileText;
}

function formatDate(value: unknown) {
  const date = value ? new Date(value as string) : null;
  if (!date || Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}

function formatSize(size: number) {
  if (!size) return "Unknown";
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
