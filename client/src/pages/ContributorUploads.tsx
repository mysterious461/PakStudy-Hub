import React, { useEffect, useState } from "react";
import { ExternalLink, FileText, Home, Loader2, UploadCloud } from "lucide-react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { auth } from "@/lib/firebase";
import { apiRequest } from "@/lib/queryClient";

const statusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  approved: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  changes_requested: "bg-blue-100 text-blue-700 border-blue-200",
};

export default function ContributorUploads() {
  const [, setLocation] = useLocation();
  const [uploads, setUploads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) {
      setLocation("/auth?returnTo=/contributors/uploads");
      return;
    }

    const loadUploads = async () => {
      try {
        const response = await apiRequest("GET", "/api/contributor/resources");
        setUploads(await response.json());
      } catch {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    void loadUploads();
  }, [setLocation]);

  return (
    <div className="min-h-[calc(100vh-170px)] flex flex-col bg-muted/10 overflow-hidden">
      <div className="border-b bg-background shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-5 sm:px-6">
        <Button variant="outline" className="rounded-2xl font-bold" onClick={() => setLocation("/contribute")}>
          <Home className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold truncate">My Uploads</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Submission history</p>
        </div>
        <Button size="sm" onClick={() => setLocation("/contributors/upload")}>
          <UploadCloud className="w-4 h-4 mr-2" />
          Add
        </Button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">
        {isLoading ? (
          <State icon={Loader2} title="Loading uploads" text="Checking your submitted resources." spin />
        ) : hasError ? (
          <State icon={FileText} title="Could not load uploads" text="Please try again in a moment." />
        ) : uploads.length === 0 ? (
          <State icon={UploadCloud} title="No uploads yet" text="Start by submitting your first academic resource." action={() => setLocation("/contributors/upload")} />
        ) : (
          <div className="space-y-4">
            {uploads.map((resource) => (
              <Card key={resource.id} className="border-border/50 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <h2 className="font-bold text-base leading-snug">{resource.title}</h2>
                      <p className="text-xs text-muted-foreground mt-1">{resource.course} / {resource.university}</p>
                    </div>
                    <Badge variant="outline" className={statusStyles[resource.status] || statusStyles.pending}>
                      {labelStatus(resource.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{resource.description || "No description provided."}</p>
                  <div className="mb-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                    <span><strong className="text-foreground">Type:</strong> {labelType(resource.resourceType)}</span>
                    <span><strong className="text-foreground">Uploaded:</strong> {formatDate(resource.createdAt)}</span>
                    <span><strong className="text-foreground">Course:</strong> {resource.course}</span>
                  </div>
                  {(resource.status === "rejected" || resource.status === "changes_requested") && resource.rejectionReason && (
                    <div className="rounded-xl bg-red-500/5 border border-red-500/10 p-3 mb-4">
                      <p className="text-xs font-bold text-red-700 uppercase tracking-widest mb-1">Review note</p>
                      <p className="text-sm text-red-700/80">{resource.rejectionReason}</p>
                    </div>
                  )}
                  <Button variant="outline" className="w-full rounded-xl" onClick={() => window.open(resource.fileUrl || resource.file?.url, "_blank")}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View File
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function labelStatus(status: string) {
  if (status === "changes_requested") return "Changes requested";
  return status ? status.charAt(0).toUpperCase() + status.slice(1) : "Pending";
}

function labelType(type: string) {
  return type ? type.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) : "Resource";
}

function formatDate(value: unknown) {
  const date = value ? new Date(value as string) : null;
  if (!date || Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function State({ icon: Icon, title, text, action, spin }: { icon: any; title: string; text: string; action?: () => void; spin?: boolean }) {
  return (
    <div className="min-h-80 flex flex-col items-center justify-center text-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
        <Icon className={`w-7 h-7 ${spin ? "animate-spin" : ""}`} />
      </div>
      <h2 className="font-bold text-lg">{title}</h2>
      <p className="text-sm text-muted-foreground mt-2 mb-5">{text}</p>
      {action && <Button onClick={action}>Upload Resource</Button>}
    </div>
  );
}
