import React, { useEffect, useMemo, useState } from "react";
import { Award, Bell, BookOpenCheck, CheckCircle, Clock, Download, Edit3, Eye, FileText, Home, Loader2, TrendingUp, UploadCloud, Users, XCircle } from "lucide-react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { auth } from "@/lib/firebase";
import { apiRequest } from "@/lib/queryClient";

const emptyStats = {
  totalUploads: 0,
  approvedUploads: 0,
  pendingUploads: 0,
  rejectedUploads: 0,
  reputationPoints: 0,
  badgeStatus: "Not started",
};

const statusStyles: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  approved: "border-green-200 bg-green-50 text-green-700",
  rejected: "border-red-200 bg-red-50 text-red-700",
  changes_requested: "border-blue-200 bg-blue-50 text-blue-700",
};

export default function ContributorDashboard() {
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState(emptyStats);
  const [uploads, setUploads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      setLocation("/auth?returnTo=/contributors/dashboard");
      return;
    }

    const loadDashboard = async () => {
      try {
        const [statsResponse, uploadsResponse] = await Promise.all([
          apiRequest("GET", "/api/contributor/stats"),
          apiRequest("GET", "/api/contributor/resources"),
        ]);
        setStats(await statsResponse.json());
        setUploads(await uploadsResponse.json());
      } catch {
        setStats(emptyStats);
        setUploads([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadDashboard();
  }, [user, setLocation]);

  const recentUploads = uploads.slice(0, 4);
  const totalDownloads = useMemo(() => uploads.reduce((sum, resource) => sum + Number(resource.downloads || 0), 0), [uploads]);
  const totalViews = useMemo(() => uploads.reduce((sum, resource) => sum + Number(resource.views || 0), 0), [uploads]);
  const percentile = Math.min(98, Math.max(10, stats.approvedUploads * 7 + Math.floor(stats.reputationPoints / 20)));

  return (
    <div className="min-h-[calc(100vh-170px)] bg-muted/10">
      <div className="border-b bg-background shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" className="rounded-2xl font-bold" onClick={() => setLocation("/contribute")}>
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
              <Badge variant="outline" className="rounded-full border-primary/20 bg-primary/10 px-3 py-1 font-bold text-primary">
                {stats.badgeStatus}
              </Badge>
            </div>
            <h1 className="truncate text-3xl font-black tracking-normal">Welcome back, {user?.displayName || "Contributor"}</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Your academic resources are helping students discover better study material.</p>
          </div>
          <Button className="h-12 rounded-2xl px-6 font-bold shadow-lg shadow-primary/15" onClick={() => setLocation("/contributors/upload")}>
            <UploadCloud className="mr-2 h-4 w-4" />
            Upload Resource
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        {isLoading ? (
          <div className="flex min-h-80 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading dashboard
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <MetricCard icon={FileText} label="Total Uploads" value={stats.totalUploads} description="Submitted resources" accent="bg-blue-500" tone="bg-blue-50 text-blue-700" />
              <MetricCard icon={CheckCircle} label="Approved" value={stats.approvedUploads} description="Published resources" accent="bg-green-500" tone="bg-green-50 text-green-700" />
              <MetricCard icon={Clock} label="Pending Review" value={stats.pendingUploads} description="Waiting for moderation" accent="bg-amber-500" tone="bg-amber-50 text-amber-700" />
              <MetricCard icon={XCircle} label="Rejected" value={stats.rejectedUploads} description="Needs replacement" accent="bg-red-500" tone="bg-red-50 text-red-700" />
              <MetricCard icon={Award} label="Reputation Points" value={stats.reputationPoints} description="Contributor score" accent="bg-primary" tone="bg-primary/10 text-primary" />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr_340px]">
              <section className="space-y-4">
                <SectionTitle title="Recent Uploads" text="Latest resources from your contributor queue." />
                {recentUploads.length === 0 ? (
                  <EmptyPanel onUpload={() => setLocation("/contributors/upload")} />
                ) : (
                  <div className="space-y-3">
                    {recentUploads.map((resource) => (
                      <UploadPreviewCard key={resource.id} resource={resource} onView={() => window.open(resource.fileUrl || resource.file?.url, "_blank")} />
                    ))}
                  </div>
                )}
              </section>

              <section className="space-y-4">
                <SectionTitle title="Contribution Impact" text="You're helping students succeed." />
                <Card className="border-border/60 shadow-sm">
                  <CardContent className="p-5">
                    <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
                      <ImpactCard icon={Download} label="Downloads" value={totalDownloads} />
                      <ImpactCard icon={Users} label="Students helped" value={Math.max(totalDownloads, totalViews)} />
                      <ImpactCard icon={TrendingUp} label="Contributor percentile" value={`${percentile}%`} />
                    </div>
                    <div className="mt-5 rounded-3xl border border-border/60 bg-muted/20 p-4">
                      <div className="mb-4 flex items-center justify-between">
                        <p className="text-sm font-black">Download Activity</p>
                        <Badge variant="outline" className="rounded-full">Analytics soon</Badge>
                      </div>
                      <div className="flex h-36 items-end gap-2">
                        {[35, 58, 42, 72, 54, 83, 68, 92].map((height, index) => (
                          <div key={index} className="flex flex-1 items-end rounded-t-2xl bg-primary/10">
                            <div className="w-full rounded-t-2xl bg-primary/70 transition-all hover:bg-primary" style={{ height: `${height}%` }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              <aside className="space-y-4">
                <SectionTitle title="Quick Actions" text="Move through the contributor workflow." />
                <Card className="border-border/60 shadow-sm">
                  <CardContent className="space-y-3 p-4">
                    <QuickAction icon={UploadCloud} label="Upload Resource" onClick={() => setLocation("/contributors/upload")} primary />
                    <QuickAction icon={FileText} label="My Uploads" onClick={() => setLocation("/contributors/uploads")} />
                    <QuickAction icon={Edit3} label="Edit Profile" onClick={() => setLocation("/profile")} />
                    <QuickAction icon={BookOpenCheck} label="Contributor Guidelines" onClick={() => setLocation("/contribute#how-it-works")} />
                  </CardContent>
                </Card>

                <Card className="border-border/60 shadow-sm">
                  <CardContent className="p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <Bell className="h-5 w-5 text-primary" />
                      <h2 className="font-black">Recent Notifications</h2>
                    </div>
                    <div className="space-y-3">
                      <Notification text={`${stats.pendingUploads} resources are waiting for review.`} />
                      <Notification text={`${stats.approvedUploads} resources have been approved.`} />
                      <Notification text="Keep metadata complete to speed up moderation." />
                    </div>
                  </CardContent>
                </Card>
              </aside>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, description, accent, tone }: { icon: any; label: string; value: number; description: string; accent: string; tone: string }) {
  return (
    <Card className="group overflow-hidden border-border/60 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
      <div className={`h-1.5 ${accent}`} />
      <CardContent className="p-5">
        <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-3xl font-black">{value}</p>
        <p className="mt-1 text-sm font-bold">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function UploadPreviewCard({ resource, onView }: { resource: any; onView: () => void }) {
  return (
    <Card className="border-border/60 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <FileText className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="truncate font-black">{resource.title}</h3>
            <Badge variant="outline" className={statusStyles[resource.status] || statusStyles.pending}>{labelStatus(resource.status)}</Badge>
          </div>
          <div className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
            <span>{resource.course}</span>
            <span>{resource.university}</span>
            <span>{resource.semester}</span>
            <span>{formatDate(resource.createdAt)}</span>
          </div>
        </div>
        <Button variant="outline" className="rounded-2xl font-bold" onClick={onView}>
          <Eye className="mr-2 h-4 w-4" />
          Quick View
        </Button>
      </CardContent>
    </Card>
  );
}

function ImpactCard({ icon: Icon, label, value }: { icon: any; label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background p-4">
      <Icon className="mb-3 h-5 w-5 text-primary" />
      <p className="text-2xl font-black">{value}</p>
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
    </div>
  );
}

function QuickAction({ icon: Icon, label, onClick, primary }: { icon: any; label: string; onClick: () => void; primary?: boolean }) {
  return (
    <Button variant={primary ? "default" : "outline"} className="h-12 w-full justify-start rounded-2xl font-bold" onClick={onClick}>
      <Icon className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}

function SectionTitle({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h2 className="text-lg font-black">{title}</h2>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function Notification({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/20 p-3 text-sm leading-6 text-muted-foreground">
      {text}
    </div>
  );
}

function EmptyPanel({ onUpload }: { onUpload: () => void }) {
  return (
    <Card className="border-dashed border-border/70 shadow-sm">
      <CardContent className="p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
          <UploadCloud className="h-8 w-8" />
        </div>
        <h3 className="font-black">Upload your first study resource</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Start with notes, slides, papers, or voice notes that can help other students.</p>
        <Button className="mt-5 rounded-2xl font-bold" onClick={onUpload}>Upload Resource</Button>
      </CardContent>
    </Card>
  );
}

function labelStatus(status: string) {
  if (status === "changes_requested") return "Needs Changes";
  return status ? status.charAt(0).toUpperCase() + status.slice(1) : "Pending";
}

function formatDate(value: unknown) {
  const date = value ? new Date(value as string) : null;
  if (!date || Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
