import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Archive, ArrowLeft, CheckCircle, Download, Eye, FileArchive, FileSpreadsheet, FileText, FileType, Flag, Image, Loader2, MessageSquareWarning, Music, ShieldCheck, Star, Tag, Video, XCircle } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { useLocation, useRoute } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

type ReviewAction = "approved" | "rejected" | "changes_requested";
const SELF_REVIEW_MESSAGE = "You cannot review your own upload. Please ask another admin or moderator to review this resource.";

const reportReasons = ["Incorrect content", "Copyright concern", "Offensive content", "Broken file", "Other"];

export default function ResourceDetail() {
  const [, params] = useRoute("/resources/:resourceId");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [resource, setResource] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [role, setRole] = useState("Student");
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [accessDenied, setAccessDenied] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState(reportReasons[0]);
  const [reportMessage, setReportMessage] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<ReviewAction>("changes_requested");
  const [reviewNote, setReviewNote] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(auth.currentUser?.uid || "");

  const resourceId = params?.resourceId;
  const isAdmin = role === "Admin" || role === "Moderator";
  const isOwnUpload = Boolean(currentUserId && resource && (resource.uploaderId === currentUserId || resource.uploadedBy === currentUserId));

  useEffect(() => {
    if (!resourceId) return;
    let cancelled = false;
    const load = async (token = "") => {
      setIsLoading(true);
      setAccessDenied("");
      try {
        if (token) {
          const profileResponse = await fetch("/api/user/profile", { headers: { Authorization: `Bearer ${token}` } }).catch(() => null);
          if (profileResponse?.ok) {
            const profile = await profileResponse.json();
            if (!cancelled) setRole(profile.role || "Student");
          }
        } else {
          setRole("Student");
        }

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

        const relatedResponse = await fetch(`/api/resources/public?search=${encodeURIComponent(payload.courseCode || payload.courseTitle || payload.university || "")}`);
        if (relatedResponse.ok) {
          const relatedPayload = await relatedResponse.json();
          if (!cancelled) setRelated(findRelatedResources(payload, relatedPayload));
        }
      } catch {
        if (!cancelled) setAccessDenied("We could not load this resource.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUserId(user?.uid || "");
      void user?.getIdToken().catch(() => "").then((token) => load(token || ""));
      if (!user) void load("");
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [resourceId]);

  const fileInfo = useMemo(() => getFileInfo(resource || {}), [resource]);

  const handleDownload = async () => {
    if (!resource) return;
    setIsDownloading(true);
    try {
      const token = await auth.currentUser?.getIdToken().catch(() => "");
      const response = await fetch(`/api/resources/${resource.id}/download`, { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : undefined });
      if (!response.ok) {
        toast({ title: "Download blocked", description: "You do not have access to download this resource.", variant: "destructive" });
        return;
      }
      const payload = await response.json();
      window.open(payload.fileUrl || resource.fileUrl || resource.file?.url, "_blank");
      setResource({ ...resource, downloads: Number(resource.downloads || 0) + 1 });
    } finally {
      setIsDownloading(false);
    }
  };

  const submitReport = async () => {
    if (!resource) return;
    const token = await auth.currentUser?.getIdToken().catch(() => "");
    const response = await fetch(`/api/resources/${resource.id}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ reason: reportReason, message: reportMessage }),
    });
    if (response.ok) {
      toast({ title: "Report submitted", description: "Thanks. A moderator will review this resource." });
      setReportOpen(false);
      setReportMessage("");
      setReportReason(reportReasons[0]);
    } else {
      toast({ title: "Report not submitted", description: "Please try again in a moment.", variant: "destructive" });
    }
  };

  const submitReview = async (action: ReviewAction, note = "") => {
    if (!resource) return;
    if (isOwnUpload) {
      toast({ title: "Review disabled", description: SELF_REVIEW_MESSAGE, variant: "destructive" });
      return;
    }
    setIsReviewing(true);
    try {
      const token = await auth.currentUser?.getIdToken().catch(() => "");
      const response = await fetch(`/api/admin/resources/${resource.id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ action, rejectionReason: note }),
      });
      if (!response.ok) throw new Error("Review failed");
      const updated = await response.json();
      setResource(updated);
      setReviewOpen(false);
      setReviewNote("");
      toast({ title: "Admin action saved", description: `Resource marked as ${labelStatus(action)}.` });
    } catch (error) {
      toast({ title: "Admin action failed", description: isSelfReviewError(error) ? SELF_REVIEW_MESSAGE : "Please check permissions and try again.", variant: "destructive" });
    } finally {
      setIsReviewing(false);
    }
  };

  const openReviewDialog = (action: ReviewAction) => {
    setReviewAction(action);
    setReviewNote(resource?.rejectionReason || "");
    setReviewOpen(true);
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

  return (
    <div className="min-h-[calc(100vh-170px)] bg-muted/10">
      <div className="border-b bg-background shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <Button variant="outline" className="mb-5 rounded-2xl font-bold" onClick={() => setLocation("/resources")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Resources
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="rounded-full">{labelType(resource.resourceCategory || resource.resourceType)}</Badge>
            {resource.isAdminCurated && <Badge variant="outline" className="rounded-full border-blue-200 bg-blue-50 text-blue-700">Admin Curated</Badge>}
            <StatusBadge status={resource.status} />
            {resource.status === "approved" && <Badge variant="outline" className="rounded-full border-green-200 bg-green-50 text-green-700"><ShieldCheck className="mr-1 h-3 w-3" />Reviewed resource</Badge>}
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <main className="space-y-5">
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-6">
              <h1 className="max-w-4xl text-3xl font-black tracking-normal sm:text-4xl">{resource.title}</h1>
              <p className="mt-3 text-lg font-semibold text-primary">{displayCourse(resource)}</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Meta label="University" value={resource.university} />
                <Meta label="Degree Program" value={resource.degree} />
                <Meta label="Semester" value={resource.semester} />
                <Meta label="Language" value={resource.language} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-xl font-black">Description</h2>
              <p className="mt-3 leading-8 text-muted-foreground">{resource.description || "No description provided."}</p>
              {resource.isAdminCurated && resource.sourceNote && (
                <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-800">
                  <strong>Source note:</strong> {resource.sourceNote}
                </div>
              )}
              <div className="mt-5 flex flex-wrap gap-2">
                {(resource.tags || []).length ? (resource.tags || []).map((tag: string) => <Badge key={tag} variant="outline" className="rounded-full"><Tag className="mr-1 h-3 w-3" />{tag}</Badge>) : <span className="text-sm text-muted-foreground">No tags added yet.</span>}
              </div>
            </CardContent>
          </Card>

          <PreviewPanel resource={resource} fileInfo={fileInfo} />

          <Card className="border-border/60 bg-amber-50/50 shadow-sm">
            <CardContent className="flex gap-3 p-5 text-sm leading-6 text-amber-800">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
              <p>Resources are uploaded by contributors and reviewed before publication. Always verify with your course instructor.</p>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-6">
              <h2 className="text-xl font-black">Related Resources</h2>
              {related.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">More related resources will appear as the library grows.</p>
              ) : (
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {related.map((item) => (
                    <button key={item.id} className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-left transition hover:border-primary/30 hover:bg-primary/5" onClick={() => setLocation(`/resources/${item.id}`)}>
                      <p className="line-clamp-2 font-black">{item.title}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{displayCourse(item)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.university}</p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <Card className="border-border/60 shadow-sm">
            <CardContent className="space-y-5 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <fileInfo.icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-black">File Info</h2>
                  <p className="truncate text-xs text-muted-foreground">{resource.fileName || resource.file?.originalName || "Resource file"}</p>
                </div>
              </div>
              <div className="space-y-3">
                <InfoRow label="Resource type" value={labelType(resource.resourceCategory || resource.resourceType)} />
                <InfoRow label="File type" value={fileInfo.label} />
                <InfoRow label="File size" value={formatSize(resource.fileSize || resource.file?.size || 0)} />
                <InfoRow label="Upload date" value={formatDate(resource.createdAt)} />
                <InfoRow label={resource.isAdminCurated ? "Source" : "Contributor"} value={resource.isAdminCurated ? resource.sourceLabel || "PakStudy Hub Team" : resource.uploadedByName || "Contributor"} />
                <InfoRow label="Status" value={labelStatus(resource.status)} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <MiniMetric icon={Eye} label="Views" value={resource.views || 0} />
                <MiniMetric icon={Download} label="Downloads" value={resource.downloads || 0} />
                <MiniMetric icon={Star} label="Rating" value="Soon" />
              </div>
              <Button className="h-12 w-full rounded-2xl font-bold" disabled={isDownloading} onClick={handleDownload}>
                {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Download Resource
              </Button>
              <Button variant="outline" className="w-full rounded-2xl font-bold" onClick={() => setReportOpen(true)}>
                <Flag className="mr-2 h-4 w-4" />
                Report Resource
              </Button>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card className="border-border/60 shadow-sm">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <h2 className="font-black">Admin Controls</h2>
                </div>
                {isOwnUpload && <Badge variant="outline" className="w-full justify-center rounded-full border-blue-200 bg-blue-50 text-blue-700">Own upload — review disabled</Badge>}
                <Button className="w-full rounded-2xl font-bold" disabled={resource.status === "approved" || isOwnUpload} onClick={() => submitReview("approved")}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </Button>
                <Button variant="outline" className="w-full rounded-2xl font-bold text-blue-700" disabled={isOwnUpload} onClick={() => openReviewDialog("changes_requested")}>
                  <MessageSquareWarning className="mr-2 h-4 w-4" />
                  Request Changes
                </Button>
                <Button variant="outline" className="w-full rounded-2xl font-bold text-red-700" disabled={isOwnUpload} onClick={() => openReviewDialog("rejected")}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button variant="outline" className="w-full rounded-2xl font-bold" disabled>
                  <Archive className="mr-2 h-4 w-4" />
                  Hide / Delete
                </Button>
                <div className="rounded-2xl bg-muted/30 p-3 text-xs leading-5 text-muted-foreground">
                  <strong>Uploader:</strong> {resource.uploaderEmail || resource.uploaderId || "Not available"}
                </div>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="w-[92vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Report Resource</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={reportReason} onValueChange={setReportReason}>
              <SelectTrigger className="rounded-2xl">
                <SelectValue placeholder="Reason" />
              </SelectTrigger>
              <SelectContent>
                {reportReasons.map((reason) => <SelectItem key={reason} value={reason}>{reason}</SelectItem>)}
              </SelectContent>
            </Select>
            <Textarea className="min-h-28 resize-none rounded-2xl" value={reportMessage} onChange={(event) => setReportMessage(event.target.value)} placeholder="Add details for the moderation team." />
          </div>
          <DialogFooter>
            <Button className="w-full rounded-2xl font-bold" onClick={submitReport}>Submit Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="w-[92vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle>{labelStatus(reviewAction)}</DialogTitle>
          </DialogHeader>
          <Textarea className="min-h-28 resize-none rounded-2xl" value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="Add a reason or requested changes for the contributor." />
          <DialogFooter>
            <Button disabled={isReviewing || !reviewNote.trim()} className="w-full rounded-2xl font-bold" onClick={() => submitReview(reviewAction, reviewNote)}>
              {isReviewing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Admin Action
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PreviewPanel({ resource, fileInfo }: { resource: any; fileInfo: ReturnType<typeof getFileInfo> }) {
  const fileUrl = resource.fileUrl || resource.file?.url;
  return (
    <Card className="overflow-hidden border-border/60 shadow-sm">
      <CardContent className="p-0">
        <div className="border-b px-6 py-4">
          <h2 className="text-xl font-black">Preview</h2>
          <p className="mt-1 text-sm text-muted-foreground">View Details keeps you on this metadata page. Only the Download button opens the source file.</p>
        </div>
        {fileInfo.kind === "pdf" && fileUrl ? (
          <iframe title={resource.title} src={fileUrl} className="h-[620px] w-full bg-muted/20" />
        ) : fileInfo.kind === "image" && fileUrl ? (
          <div className="flex min-h-96 items-center justify-center bg-muted/20 p-4">
            <img src={fileUrl} alt={resource.title} className="max-h-[640px] max-w-full rounded-2xl object-contain shadow-sm" />
          </div>
        ) : fileInfo.kind === "audio" && fileUrl ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-4 bg-muted/20 p-8">
            <fileInfo.icon className="h-14 w-14 text-primary" />
            <audio controls className="w-full max-w-xl" src={fileUrl} />
          </div>
        ) : fileInfo.kind === "video" && fileUrl ? (
          <div className="bg-black p-2">
            <video controls className="mx-auto max-h-[640px] w-full rounded-xl" src={fileUrl} />
          </div>
        ) : (
          <FilePreviewCard fileInfo={fileInfo} />
        )}
      </CardContent>
    </Card>
  );
}

function FilePreviewCard({ fileInfo }: { fileInfo: ReturnType<typeof getFileInfo> }) {
  const isArchive = fileInfo.kind === "archive";
  return (
    <div className="flex min-h-80 flex-col items-center justify-center bg-muted/20 p-8 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-primary/10 text-primary">
        <fileInfo.icon className="h-10 w-10" />
      </div>
      <h3 className="text-lg font-black">{fileInfo.label}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {isArchive ? "This archive may contain multiple files. Download only if you trust the source and scan before opening." : "Preview not available yet. Download to view this file."}
      </p>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-border/60 bg-muted/20 p-4"><p className="text-xs font-black uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 font-bold">{value || "Not added"}</p></div>;
}

function MiniMetric({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return <div className="rounded-2xl border border-border/60 bg-muted/20 p-3 text-center"><Icon className="mx-auto mb-2 h-4 w-4 text-primary" /><p className="font-black">{value}</p><p className="text-[10px] font-bold uppercase text-muted-foreground">{label}</p></div>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4 text-sm"><span className="text-muted-foreground">{label}</span><span className="text-right font-bold">{value || "Not added"}</span></div>;
}

function StatusBadge({ status }: { status: string }) {
  const className = status === "approved"
    ? "border-green-200 bg-green-50 text-green-700"
    : status === "rejected"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-amber-200 bg-amber-50 text-amber-700";
  return <Badge variant="outline" className={`rounded-full ${className}`}>{labelStatus(status)}</Badge>;
}

function getFileInfo(resource: any) {
  const mime = String(resource.fileType || resource.file?.contentType || "").toLowerCase();
  const extension = String(resource.fileExtension || resource.fileName?.split(".").pop() || resource.file?.originalName?.split(".").pop() || "").toLowerCase();
  if (mime.includes("pdf") || extension === "pdf") return { kind: "pdf", label: "PDF document", icon: FileText };
  if (mime.includes("image") || ["png", "jpg", "jpeg", "webp", "gif"].includes(extension)) return { kind: "image", label: "Image file", icon: Image };
  if (mime.includes("audio") || ["mp3", "wav", "m4a", "ogg"].includes(extension)) return { kind: "audio", label: "Audio file", icon: Music };
  if (mime.includes("video") || ["mp4", "mov", "webm"].includes(extension)) return { kind: "video", label: "Video file", icon: Video };
  if (["doc", "docx"].includes(extension)) return { kind: "office", label: "Word document", icon: FileType };
  if (["ppt", "pptx"].includes(extension)) return { kind: "office", label: "PowerPoint presentation", icon: FileText };
  if (["xls", "xlsx", "csv"].includes(extension)) return { kind: "office", label: "Spreadsheet file", icon: FileSpreadsheet };
  if (["zip", "rar", "7z"].includes(extension) || mime.includes("zip") || mime.includes("archive")) return { kind: "archive", label: "Archive file", icon: FileArchive };
  return { kind: "unsupported", label: extension ? `${extension.toUpperCase()} file` : "File preview unavailable", icon: FileText };
}

function findRelatedResources(resource: any, candidates: any[]) {
  return candidates
    .filter((item) => item.id !== resource.id)
    .map((item) => {
      const score = [
        item.university && item.university === resource.university,
        item.courseCode && item.courseCode === resource.courseCode,
        item.courseTitle && item.courseTitle === resource.courseTitle,
        item.degree && item.degree === resource.degree,
        item.semester && item.semester === resource.semester,
      ].filter(Boolean).length;
      return { item, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item)
    .slice(0, 3);
}

function displayCourse(resource: any) {
  const title = resource.courseTitle || resource.course || resource.subject || "Course";
  return resource.courseCode ? `${resource.courseCode} / ${title}` : title;
}

function labelStatus(status: string) {
  if (status === "changes_requested" || status === "needs_changes") return "Needs Changes";
  return status ? status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) : "Pending";
}

function labelType(type: string) {
  return type ? type.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) : "Resource";
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

function isSelfReviewError(error: unknown) {
  return error instanceof Error && error.message.includes("own upload");
}
