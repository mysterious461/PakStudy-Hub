import React, { useEffect, useMemo, useState } from "react";
import { Archive, Copy, Download, Edit3, ExternalLink, FileText, Filter, Home, Loader2, MoreHorizontal, Search, Trash2, UploadCloud } from "lucide-react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { apiRequest } from "@/lib/queryClient";

const statusStyles: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  changes_requested: "bg-blue-50 text-blue-700 border-blue-200",
};

export default function ContributorUploads() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [uploads, setUploads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    if (!auth.currentUser) {
      setLocation("/auth?returnTo=/contributors/uploads");
      return;
    }

    const loadUploads = async () => {
      try {
        const response = await apiRequest("GET", "/api/resources/mine");
        setUploads(await response.json());
      } catch {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    void loadUploads();
  }, [setLocation]);

  const handleDownload = async (resource: any) => {
    try {
      const response = await apiRequest("POST", `/api/resources/${resource.id}/download`);
      const payload = await response.json();
      setUploads((current) => current.map((item) => item.id === resource.id ? { ...item, downloads: Number(item.downloads || 0) + 1 } : item));
      window.open(payload.fileUrl || resource.fileUrl || resource.file?.url, "_blank");
    } catch {
      toast({ title: "Download blocked", description: "Could not verify access to this resource.", variant: "destructive" });
    }
  };

  const filteredUploads = useMemo(() => {
    const query = search.trim().toLowerCase();
    return uploads.filter((resource) => {
      const matchesSearch = !query || `${resource.title} ${displayCourse(resource)} ${resource.courseCode || ""} ${resource.courseTitle || ""} ${resource.university} ${resource.faculty || resource.department} ${resource.degree} ${resource.resourceCategory || resource.resourceType} ${resource.tags?.join(" ")}`.toLowerCase().includes(query);
      const matchesStatus = status === "all" || resource.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [uploads, search, status]);

  const totalDownloads = uploads.reduce((sum, resource) => sum + Number(resource.downloads || 0), 0);
  const storageUsed = uploads.reduce((sum, resource) => sum + Number(resource.fileSize || resource.file?.size || 0), 0);
  const approved = uploads.filter((resource) => resource.status === "approved").length;
  const reputationProgress = Math.min(100, approved * 12 + uploads.length * 3);

  return (
    <div className="min-h-[calc(100vh-170px)] bg-muted/10">
      <div className="border-b bg-background shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <Button variant="outline" size="sm" className="mb-3 rounded-2xl font-bold" onClick={() => setLocation("/contribute")}>
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
            <h1 className="text-3xl font-black tracking-normal">My Uploads</h1>
            <p className="mt-2 text-sm text-muted-foreground">Manage submitted resources, review status, and contribution progress.</p>
          </div>
          <Button className="h-12 rounded-2xl px-6 font-bold shadow-lg shadow-primary/15" onClick={() => setLocation("/contributors/upload")}>
            <UploadCloud className="mr-2 h-4 w-4" />
            Upload Resource
          </Button>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 xl:grid-cols-[1fr_320px]">
        <main className="space-y-5">
          <Card className="border-border/60 shadow-sm">
            <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_220px_auto]">
              <div className="relative">
                <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                <Input className="h-12 rounded-2xl pl-12" placeholder="Search title, course code, course title, university, tags..." value={search} onChange={(event) => setSearch(event.target.value)} />
              </div>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-12 rounded-2xl">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="changes_requested">Needs Changes</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="h-12 rounded-2xl font-bold" onClick={() => setLocation("/contributors/upload")}>
                <UploadCloud className="mr-2 h-4 w-4" />
                Add
              </Button>
            </CardContent>
          </Card>

          {isLoading ? (
            <State icon={Loader2} title="Loading uploads" text="Checking your submitted resources." spin />
          ) : hasError ? (
            <State icon={FileText} title="Could not load uploads" text="Please try again in a moment." />
          ) : uploads.length === 0 ? (
            <EmptyUploads onUpload={() => setLocation("/contributors/upload")} />
          ) : filteredUploads.length === 0 ? (
            <State icon={Search} title="No resources match your filters" text="Try another search term or status filter." />
          ) : (
            <Card className="overflow-hidden border-border/60 shadow-sm">
              <div className="hidden grid-cols-[1.6fr_1fr_1fr_0.8fr_0.8fr_0.8fr_0.7fr_0.7fr_112px] gap-3 border-b bg-muted/30 px-4 py-3 text-xs font-black uppercase tracking-wide text-muted-foreground lg:grid">
                <span>Resource</span>
                <span>Course</span>
                <span>Hierarchy</span>
                <span>Semester</span>
                <span>Category</span>
                <span>Status</span>
                <span>Date</span>
                <span>Stats</span>
                <span>Actions</span>
              </div>
              <div className="divide-y divide-border/60">
                {filteredUploads.map((resource) => (
                  <ResourceRow key={resource.id} resource={resource} onView={() => setLocation(`/resources/${resource.id}`)} onDownload={() => handleDownload(resource)} />
                ))}
              </div>
            </Card>
          )}
        </main>

        <aside className="space-y-4">
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-5">
              <h2 className="font-black">Contributor Tips</h2>
              <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                <p>Use clear titles with course codes and semester details.</p>
                <p>Add tags like midterm, solved, lab, formula sheet, or lecture.</p>
                <p>Keep files original or share only with permission.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-5">
              <h2 className="font-black">Guidelines</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">Resources with complete metadata are reviewed faster and are easier for students to discover.</p>
              <Button variant="outline" className="mt-4 w-full rounded-2xl font-bold" onClick={() => setLocation("/contribute#how-it-works")}>View Guidelines</Button>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardContent className="space-y-5 p-5">
              <SideMetric label="Storage used" value={formatSize(storageUsed)} />
              <SideMetric label="Total downloads" value={totalDownloads} />
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-bold">Reputation progress</span>
                  <span className="font-black text-primary">{reputationProgress}%</span>
                </div>
                <Progress value={reputationProgress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function ResourceRow({ resource, onView, onDownload }: { resource: any; onView: () => void; onDownload: () => void }) {
  return (
    <div className="grid gap-3 p-4 lg:grid-cols-[1.6fr_1fr_1fr_0.8fr_0.8fr_0.8fr_0.7fr_0.7fr_112px] lg:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <FileText className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 className="truncate font-black">{resource.title}</h3>
          <p className="truncate text-xs text-muted-foreground">{resource.fileName || resource.file?.originalName || "Resource file"}</p>
        </div>
      </div>
      <DataCell label="Course" value={displayCourse(resource)} />
      <DataCell label="Hierarchy" value={`${resource.university || "University"} / ${resource.faculty || resource.department || "Faculty"} / ${resource.degree || "Degree"}`} />
      <DataCell label="Semester" value={resource.semester} />
      <DataCell label="Category" value={labelType(resource.resourceCategory || resource.resourceType)} />
      <div>
        <span className="mb-1 block text-xs font-bold text-muted-foreground lg:hidden">Status</span>
        <Badge variant="outline" className={statusStyles[resource.status] || statusStyles.pending}>{labelStatus(resource.status)}</Badge>
      </div>
      <DataCell label="Upload Date" value={formatDate(resource.createdAt)} />
      <div className="text-sm text-muted-foreground">
        <span className="mb-1 block text-xs font-bold text-muted-foreground lg:hidden">Stats</span>
        <div>{Number(resource.downloads || 0)} downloads</div>
        <div>{Number(resource.views || 0)} views</div>
      </div>
      <div className="flex flex-wrap gap-2 lg:justify-end">
        <Button variant="outline" size="icon" className="rounded-xl" onClick={onView} title="View Details">
          <ExternalLink className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="rounded-xl" onClick={onDownload} title="Download">
          <Download className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-xl">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem disabled><Edit3 className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
            <DropdownMenuItem disabled><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
            <DropdownMenuItem disabled><Copy className="mr-2 h-4 w-4" /> Duplicate</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {(resource.status === "rejected" || resource.status === "changes_requested") && resource.rejectionReason && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 lg:col-span-9">
          <strong>Review note:</strong> {resource.rejectionReason}
        </div>
      )}
    </div>
  );
}

function DataCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 text-sm">
      <span className="mb-1 block text-xs font-bold text-muted-foreground lg:hidden">{label}</span>
      <span className="truncate text-muted-foreground lg:block">{value || "Not added"}</span>
    </div>
  );
}

function SideMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function EmptyUploads({ onUpload }: { onUpload: () => void }) {
  return (
    <Card className="border-dashed border-border/70 shadow-sm">
      <CardContent className="p-10 text-center">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-primary/10 text-primary">
          <Archive className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-black">Upload your first study resource</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">Share notes, slides, papers, voice notes, or lecture recordings and help build Pakistan's student resource library.</p>
        <Button className="mt-6 rounded-2xl px-6 font-bold" onClick={onUpload}>
          <UploadCloud className="mr-2 h-4 w-4" />
          Upload Resource
        </Button>
      </CardContent>
    </Card>
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
  if (status === "changes_requested") return "Needs Changes";
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

function formatSize(size: number) {
  if (!size) return "0 MB";
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
