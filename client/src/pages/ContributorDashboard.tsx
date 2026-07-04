import React, { useEffect, useState } from "react";
import { ArrowLeft, Award, CheckCircle, Clock, FileText, Loader2, UploadCloud, XCircle } from "lucide-react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ContributorPortalShell } from "@/components/contributor/ContributorPortalShell";
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

export default function ContributorDashboard() {
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState(emptyStats);
  const [isLoading, setIsLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      setLocation("/auth?returnTo=/contributors/dashboard");
      return;
    }

    const loadStats = async () => {
      try {
        const response = await apiRequest("GET", "/api/contributor/stats");
        setStats(await response.json());
      } catch {
        setStats(emptyStats);
      } finally {
        setIsLoading(false);
      }
    };

    void loadStats();
  }, [user, setLocation]);

  return (
    <ContributorPortalShell>
    <div className="min-h-[calc(100vh-170px)] flex flex-col bg-muted/10 overflow-hidden">
      <header className="px-4 sm:px-6 py-5 bg-background border-b flex items-center gap-4 shadow-sm">
        <Button variant="ghost" size="icon" className="-ml-2 hover:bg-muted/50" onClick={() => setLocation("/contributors")}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-lg font-bold truncate">Contributor Portal</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Resource Library</p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6">
        {isLoading ? (
          <div className="min-h-80 flex items-center justify-center text-muted-foreground">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Loading dashboard
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="border-border/50 shadow-sm overflow-hidden">
              <CardContent className="p-5 bg-gradient-to-br from-primary/10 via-background to-blue-500/10">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-2">Signed in as</p>
                    <h2 className="text-xl font-black truncate">{user?.displayName || "Student Contributor"}</h2>
                    <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <Badge className="rounded-full bg-primary/10 text-primary border-primary/20" variant="outline">
                    {stats.badgeStatus}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <StatCard icon={FileText} label="Total uploads" value={stats.totalUploads} color="text-blue-600 bg-blue-100" />
              <StatCard icon={CheckCircle} label="Approved" value={stats.approvedUploads} color="text-green-600 bg-green-100" />
              <StatCard icon={Clock} label="Pending" value={stats.pendingUploads} color="text-amber-600 bg-amber-100" />
              <StatCard icon={XCircle} label="Rejected" value={stats.rejectedUploads} color="text-red-600 bg-red-100" />
            </div>

            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-black text-primary">{stats.reputationPoints}</p>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Reputation points</p>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-3">
              <Button className="h-12 rounded-2xl font-bold" onClick={() => setLocation("/contributors/upload")}>
                <UploadCloud className="w-4 h-4 mr-2" />
                Upload Resource
              </Button>
              <Button variant="outline" className="h-12 rounded-2xl font-bold" onClick={() => setLocation("/contributors/uploads")}>
                <FileText className="w-4 h-4 mr-2" />
                My Uploads
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
    </ContributorPortalShell>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="p-4">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <p className="text-2xl font-black">{value}</p>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
      </CardContent>
    </Card>
  );
}
