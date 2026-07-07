import React, { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle, ExternalLink, FileText, Home, Loader2, MessageSquareWarning, Trash2, XCircle } from "lucide-react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { apiRequest } from "@/lib/queryClient";

type ReviewAction = "approved" | "rejected" | "changes_requested";
const SELF_REVIEW_MESSAGE = "You cannot review your own upload. Please ask another admin or moderator to review this resource.";

export default function AdminResourceReview() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [resources, setResources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [canAccess, setCanAccess] = useState(false);
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
    try {
      const [, profileResponse] = await Promise.all([
        apiRequest("GET", "/api/admin/stats"),
        apiRequest("GET", "/api/user/profile").catch(() => null),
      ]);
      if (profileResponse) {
        const profile = await profileResponse.json();
        setCurrentRole(profile.role || "Student");
      }
      setCurrentUserId(auth.currentUser?.uid || "");
      setCanAccess(true);
      const response = await apiRequest("GET", "/api/admin/resources/pending");
      setResources(await response.json());
    } catch {
      setCanAccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadResources();
  }, []);

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
      setResources((current) => current.filter((item) => item.id !== updated.id));
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
    setReviewNote("");
  };

  const openDeleteDialog = (resource: any) => {
    setDeleteTarget(resource);
    setDeleteConfirm("");
  };

  const hideResource = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await apiRequest("POST", `/api/admin/resources/${deleteTarget.id}/hide`);
      setResources((current) => current.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast({ title: "Resource hidden", description: "This resource was removed from the review queue and public library." });
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
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-5 sm:px-6">
        <Button variant="ghost" size="icon" className="-ml-2 hover:bg-muted/50" onClick={() => setLocation("/admin")}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold">Resource Review</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Admin queue</p>
        </div>
        <Button variant="outline" className="rounded-2xl font-bold" onClick={() => setLocation("/contribute")}>
          <Home className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl p-4 pb-24 sm:p-6">
        {isLoading ? (
          <State icon={Loader2} title="Loading review queue" text="Checking pending resources." spin />
        ) : !canAccess ? (
          <State icon={MessageSquareWarning} title="Admin access required" text="Only Admin and Moderator users can review resources." />
        ) : resources.length === 0 ? (
          <State icon={CheckCircle} title="Nothing pending" text="All submitted resources have been reviewed." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {resources.map((resource) => (
              <Card key={resource.id} className="border-border/50 shadow-sm">
                <CardContent className="p-5">
                  {isOwnUpload(resource, currentUserId) && (
                    <Badge variant="outline" className="mb-3 rounded-full border-blue-200 bg-blue-50 text-blue-700">Own upload — review disabled</Badge>
                  )}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <h2 className="font-bold text-base leading-snug">{resource.title}</h2>
                      <p className="text-xs text-muted-foreground mt-1">{resource.uploaderEmail || resource.uploadedByName}</p>
                    </div>
                    <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">Pending</Badge>
                  </div>
                  <div className="rounded-2xl bg-muted/30 p-4 text-sm space-y-2 mb-4">
                    <Meta label="University" value={resource.university} />
                    <Meta label="Faculty" value={resource.faculty || resource.department} />
                    <Meta label="Degree Program" value={resource.degree} />
                    <Meta label="Semester" value={resource.semester} />
                    <Meta label="Course" value={displayCourse(resource)} />
                    <Meta label="Category" value={labelType(resource.resourceCategory || resource.resourceType)} />
                    <Meta label="File" value={`${resource.fileName || "Resource"} / ${formatSize(resource.fileSize || 0)}`} />
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{resource.description}</p>
                  <div className="grid grid-cols-1 gap-2">
                    <Button variant="outline" className="rounded-xl" onClick={() => setLocation(`/resources/${resource.id}`)}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                      <Button className="rounded-xl" disabled={isOwnUpload(resource, currentUserId)} onClick={() => submitReview(resource, "approved")}>
                        <CheckCircle className="mr-2 w-4 h-4" />
                        Approve
                      </Button>
                      <Button variant="outline" className="rounded-xl text-blue-700" disabled={isOwnUpload(resource, currentUserId)} onClick={() => openNoteDialog(resource, "changes_requested")}>
                        <MessageSquareWarning className="mr-2 w-4 h-4" />
                        Changes
                      </Button>
                      <Button variant="outline" className="rounded-xl text-red-700" disabled={isOwnUpload(resource, currentUserId)} onClick={() => openNoteDialog(resource, "rejected")}>
                        <XCircle className="mr-2 w-4 h-4" />
                        Reject
                      </Button>
                      <Button variant="outline" className="rounded-xl text-red-700" onClick={() => openDeleteDialog(resource)}>
                        <Trash2 className="mr-2 w-4 h-4" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={Boolean(reviewTarget)} onOpenChange={(open) => !open && setReviewTarget(null)}>
        <DialogContent className="w-[90vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle>{labelStatus(reviewAction)}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={reviewNote}
            onChange={(event) => setReviewNote(event.target.value)}
            placeholder="Add a clear reason or change request for the contributor."
            className="min-h-28 resize-none"
          />
          <DialogFooter>
            <Button
              disabled={isReviewing || !reviewNote.trim()}
              onClick={() => reviewTarget && submitReview(reviewTarget, reviewAction, reviewNote)}
              className="w-full"
            >
              {isReviewing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
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
              Hide keeps the file in storage but removes it from public and review views. Permanent delete removes the Firestore record and attempts to delete the Storage file.
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

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-right">{value}</span>
    </div>
  );
}

function State({ icon: Icon, title, text, spin }: { icon: any; title: string; text: string; spin?: boolean }) {
  return (
    <div className="min-h-80 flex flex-col items-center justify-center text-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
        <Icon className={`w-7 h-7 ${spin ? "animate-spin" : ""}`} />
      </div>
      <h2 className="font-bold text-lg">{title}</h2>
      <p className="text-sm text-muted-foreground mt-2">{text}</p>
    </div>
  );
}

function labelStatus(status: string) {
  if (status === "changes_requested") return "Request Changes";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function labelType(type: string) {
  return type.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function displayCourse(resource: any) {
  const title = resource.courseTitle || resource.course || resource.subject || "Course";
  return resource.courseCode ? `${resource.courseCode} / ${title}` : title;
}

function formatSize(size: number) {
  if (!size) return "Unknown size";
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function isOwnUpload(resource: any, currentUserId: string) {
  return Boolean(currentUserId && (resource.uploaderId === currentUserId || resource.uploadedBy === currentUserId));
}

function isSelfReviewError(error: unknown) {
  return error instanceof Error && error.message.includes("own upload");
}

