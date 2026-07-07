import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle, Eye, FileText, Home, Loader2, MessageSquareWarning, Search, ShieldAlert, Trash2, XCircle } from "lucide-react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { apiRequest } from "@/lib/queryClient";

type ReviewAction = "approved" | "rejected" | "changes_requested";
const SELF_REVIEW_MESSAGE = "You cannot review your own upload. Please ask another admin or moderator to review this resource.";

const statusStyles: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  approved: "border-green-200 bg-green-50 text-green-700",
  rejected: "border-red-200 bg-red-50 text-red-700",
  changes_requested: "border-blue-200 bg-blue-50 text-blue-700",
  hidden: "border-slate-200 bg-slate-50 text-slate-700",
};

export default function AdminResources() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [resources, setResources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [canAccess, setCanAccess] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [reviewTarget, setReviewTarget] = useState<any>(null);
  const [reviewAction, setReviewAction] = useState<ReviewAction>("rejected");
  const [reviewNote, setReviewNote] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(auth.currentUser?.uid || "");
  const [currentRole, setCurrentRole] = useState("Student");
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const loadResources = async () => {
    setIsLoading(true);
    try {
      const [response, profileResponse] = await Promise.all([
        apiRequest("GET", "/api/admin/resources"),
        apiRequest("GET", "/api/user/profile").catch(() => null),
      ]);
      setCurrentUserId(auth.currentUser?.uid || "");
      if (profileResponse) {
        const profile = await profileResponse.json();
        setCurrentRole(profile.role || "Student");
      }
      setResources(await response.json());
      setCanAccess(true);
    } catch {
      setCanAccess(false);
      setResources([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadResources();
  }, []);

  const filteredResources = useMemo(() => {
    const query = search.trim().toLowerCase();
    return resources.filter((resource) => {
      const resourceStatus = resource.status === "needs_changes" ? "changes_requested" : resource.status;
      if (status !== "all" && resourceStatus !== status) return false;
      if (sourceFilter === "admin_curated" && !resource.isAdminCurated) return false;
      if (sourceFilter === "contributor_submitted" && resource.isAdminCurated) return false;
      if (!query) return true;
      return [
        resource.title,
        resource.uploadedByName,
        resource.uploaderEmail,
        resource.university,
        resource.faculty,
        resource.department,
        resource.degree,
        resource.courseCode,
        resource.courseTitle,
        resource.course,
        resource.resourceCategory,
        resource.resourceType,
      ].join(" ").toLowerCase().includes(query);
    });
  }, [resources, search, status, sourceFilter]);

  const submitReview = async (resource: any, action: ReviewAction, note = "") => {
    if (isOwnUpload(resource, currentUserId)) {
      toast({ title: "Review disabled", description: SELF_REVIEW_MESSAGE, variant: "destructive" });
      return;
    }
    setIsReviewing(true);
    try {
      const response = await apiRequest("PATCH", `/api/admin/resources/${resource.id}/review`, {
        action,
        rejectionReason: note,
      });
      const updated = await response.json();
      setResources((current) => current.map((item) => item.id === updated.id ? updated : item));
      setReviewTarget(null);
      setReviewNote("");
      toast({ title: "Review saved", description: `Resource marked as ${labelStatus(action)}.` });
    } catch (error) {
      toast({ title: "Review not saved", description: isSelfReviewError(error) ? SELF_REVIEW_MESSAGE : "Please check permissions and try again.", variant: "destructive" });
    } finally {
      setIsReviewing(false);
    }
  };

  const openNoteDialog = (resource: any, action: ReviewAction) => {
    setReviewTarget(resource);
    setReviewAction(action);
    setReviewNote(resource.rejectionReason || "");
  };

  const openDeleteDialog = (resource: any) => {
    setDeleteTarget(resource);
    setDeleteConfirm("");
  };

  const hideResource = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const response = await apiRequest("POST", `/api/admin/resources/${deleteTarget.id}/hide`);
      const updated = await response.json();
      setResources((current) => current.map((item) => item.id === deleteTarget.id ? { ...item, ...updated, status: "hidden", reviewStatus: "hidden", visibility: "private" } : item));
      setDeleteTarget(null);
      toast({ title: "Resource hidden", description: "This resource is no longer visible in the public library." });
    } catch (error) {
      toast({ title: "Could not hide resource", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const permanentlyDeleteResource = async () => {
    if (!deleteTarget || deleteConfirm !== "DELETE") return;
    setIsDeleting(true);
    try {
      const response = await apiRequest("DELETE", `/api/admin/resources/${deleteTarget.id}`);
      const result = await response.json();
      setResources((current) => current.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast({ title: "Resource deleted", description: result.warning || "The metadata and uploaded file were removed." });
    } catch (error) {
      toast({ title: "Could not delete resource", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-170px)] bg-muted/10">
      <div className="border-b bg-background shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-2xl" onClick={() => setLocation("/admin")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-black">Manage All Resources</h1>
              <p className="mt-1 text-sm text-muted-foreground">Browse approved, pending, rejected, and needs-changes uploads.</p>
            </div>
          </div>
          <Button variant="outline" className="rounded-2xl font-bold" onClick={() => setLocation("/contribute")}>
            <Home className="mr-2 h-4 w-4" />
            Back to Portal Home
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_220px_220px]">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
              <Input className="h-12 rounded-2xl pl-12" placeholder="Search title, uploader, university, course..." value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-12 rounded-2xl">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="changes_requested">Needs Changes</SelectItem>
                <SelectItem value="hidden">Hidden</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="h-12 rounded-2xl">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                <SelectItem value="admin_curated">Admin Curated</SelectItem>
                <SelectItem value="contributor_submitted">Contributor Submitted</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {isLoading ? (
          <State icon={Loader2} title="Loading resources" text="Checking the full resource library." spin />
        ) : !canAccess ? (
          <State icon={ShieldAlert} title="Admin access required" text="Only Admin and Moderator users can manage all resources." />
        ) : filteredResources.length === 0 ? (
          <State icon={FileText} title="No resources found" text="Try another search term or status filter." />
        ) : (
          <Card className="overflow-hidden border-border/60 shadow-sm">
            <div className="hidden grid-cols-[1.5fr_1fr_1fr_0.8fr_0.8fr_0.8fr_220px] gap-3 border-b bg-muted/30 px-4 py-3 text-xs font-black uppercase tracking-wide text-muted-foreground lg:grid">
              <span>Title</span>
              <span>Uploader</span>
              <span>University</span>
              <span>Course</span>
              <span>Status</span>
              <span>Type</span>
              <span>Actions</span>
            </div>
            <div className="divide-y divide-border/60">
              {filteredResources.map((resource) => (
                <div key={resource.id} className="grid gap-3 p-4 lg:grid-cols-[1.5fr_1fr_1fr_0.8fr_0.8fr_0.8fr_220px] lg:items-center">
                  <DataCell label="Title" value={resource.title} strong helper={formatDate(resource.createdAt)} />
                  <div>
                    <DataCell label="Uploader" value={resource.uploadedByName || resource.uploaderEmail || "Contributor"} />
                    {resource.isAdminCurated && <Badge variant="outline" className="mt-2 rounded-full border-blue-200 bg-blue-50 text-blue-700">Admin Curated</Badge>}
                    {isOwnUpload(resource, currentUserId) && <Badge variant="outline" className="mt-2 rounded-full border-blue-200 bg-blue-50 text-blue-700">Own upload — review disabled</Badge>}
                  </div>
                  <DataCell label="University" value={resource.university} />
                  <DataCell label="Course" value={displayCourse(resource)} />
                  <div>
                    <span className="mb-1 block text-xs font-bold text-muted-foreground lg:hidden">Status</span>
                    <Badge variant="outline" className={statusStyles[resource.status] || statusStyles.pending}>{labelStatus(resource.status)}</Badge>
                  </div>
                  <DataCell label="Type" value={labelType(resource.resourceCategory || resource.resourceType)} />
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <Button variant="outline" size="sm" className="rounded-xl font-bold" onClick={() => setLocation(`/resources/${resource.id}`)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Detail
                    </Button>
                    {resource.status !== "approved" && (
                      <Button size="sm" className="rounded-xl font-bold" disabled={isOwnUpload(resource, currentUserId)} onClick={() => submitReview(resource, "approved")}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                    )}
                    <Button variant="outline" size="icon" className="rounded-xl text-blue-700" disabled={isOwnUpload(resource, currentUserId)} onClick={() => openNoteDialog(resource, "changes_requested")} title="Request changes">
                      <MessageSquareWarning className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="rounded-xl text-red-700" disabled={isOwnUpload(resource, currentUserId)} onClick={() => openNoteDialog(resource, "rejected")} title="Reject">
                      <XCircle className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="rounded-xl text-red-700" onClick={() => openDeleteDialog(resource)} title="Hide or delete">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <Dialog open={Boolean(reviewTarget)} onOpenChange={(open) => !open && setReviewTarget(null)}>
        <DialogContent className="w-[90vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle>{labelStatus(reviewAction)}</DialogTitle>
          </DialogHeader>
          <Textarea value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="Add a clear reason or change request for the contributor." className="min-h-28 resize-none" />
          <DialogFooter>
            <Button disabled={isReviewing || !reviewNote.trim()} onClick={() => reviewTarget && submitReview(reviewTarget, reviewAction, reviewNote)} className="w-full">
              {isReviewing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="w-[92vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Remove Resource</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm leading-6 text-muted-foreground">
            <p className="font-semibold text-foreground">{deleteTarget?.title}</p>
            <p>Are you sure you want to delete this resource? This will remove the database record and the uploaded file from storage. This action cannot be undone.</p>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-amber-800">
              Hide keeps the file in storage but removes it from the public library. Permanent delete removes the Firestore record and attempts to delete the Storage file.
            </div>
            {currentRole === "Admin" ? (
              <Input value={deleteConfirm} onChange={(event) => setDeleteConfirm(event.target.value)} placeholder="Type DELETE to permanently delete" className="rounded-2xl" />
            ) : (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-3 text-blue-800">Moderators can hide resources, but only Admin users can permanently delete files.</div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" disabled={isDeleting} onClick={hideResource} className="rounded-2xl font-bold">Hide resource</Button>
            <Button variant="destructive" disabled={isDeleting || currentRole !== "Admin" || deleteConfirm !== "DELETE"} onClick={permanentlyDeleteResource} className="rounded-2xl font-bold">
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Permanently delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DataCell({ label, value, strong, helper }: { label: string; value: string; strong?: boolean; helper?: string }) {
  return (
    <div className="min-w-0 text-sm">
      <span className="mb-1 block text-xs font-bold text-muted-foreground lg:hidden">{label}</span>
      <span className={`truncate lg:block ${strong ? "font-black" : "text-muted-foreground"}`}>{value || "Not added"}</span>
      {helper ? <span className="mt-1 block text-xs text-muted-foreground">{helper}</span> : null}
    </div>
  );
}

function State({ icon: Icon, title, text, spin }: { icon: any; title: string; text: string; spin?: boolean }) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardContent className="flex min-h-80 flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className={`h-7 w-7 ${spin ? "animate-spin" : ""}`} />
        </div>
        <h2 className="font-black">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{text}</p>
      </CardContent>
    </Card>
  );
}

function labelStatus(status: string) {
  if (status === "changes_requested" || status === "needs_changes") return "Needs Changes";
  return status ? status.charAt(0).toUpperCase() + status.slice(1) : "Pending";
}

function labelType(type: string) {
  return type ? type.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) : "Resource";
}

function displayCourse(resource: any) {
  const title = resource.courseTitle || resource.course || resource.subject || "Course";
  return resource.courseCode ? `${resource.courseCode} / ${title}` : title;
}

function formatDate(value: unknown) {
  const date = value ? new Date(value as string) : null;
  if (!date || Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function isOwnUpload(resource: any, currentUserId: string) {
  return Boolean(currentUserId && (resource.uploaderId === currentUserId || resource.uploadedBy === currentUserId));
}

function isSelfReviewError(error: unknown) {
  return error instanceof Error && error.message.includes("own upload");
}


