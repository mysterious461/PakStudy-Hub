import React, { useEffect, useState } from "react";
import { BookOpen, CheckCircle, FileCheck2, Home, Mail, ShieldAlert, Trash2, UploadCloud, Users, XCircle } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Admin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [reports, setReports] = useState<any[]>([]);
  const [stats, setStats] = useState({
    users: 0,
    pendingResources: 0,
    approvedResources: 0,
    rejectedResources: 0,
    pendingReports: 0,
  });

  useEffect(() => {
    const loadAdmin = async () => {
      try {
        const [reportsRes, statsRes] = await Promise.all([
          apiRequest("GET", "/api/admin/reports"),
          apiRequest("GET", "/api/admin/stats"),
        ]);
        if (reportsRes.ok) setReports(await reportsRes.json());
        if (statsRes.ok) setStats(await statsRes.json());
      } catch (error) {
        console.error(error);
      }
    };

    void loadAdmin();
  }, []);

  const handleAction = async (id: string, action: string) => {
    try {
      const res = await apiRequest("PATCH", `/api/admin/reports/${id}`, { action });
      const updated = await res.json();
      setReports(reports.map(r => r.id === id ? updated : r));
      toast({
        title: "Action taken",
        description: `Report has been ${action}.`,
      });
    } catch (error: any) {
      toast({ title: "Action failed", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-[calc(100vh-170px)] bg-muted/10">
      <div className="border-b bg-background shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-5 sm:px-6">
          <Button variant="outline" className="rounded-2xl font-bold" onClick={() => setLocation("/contribute")}>
            <Home className="mr-2 h-4 w-4" />
            Back to Portal Home
          </Button>
          <div>
            <h1 className="text-lg font-bold truncate">Admin Dashboard</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Moderator operations</p>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl space-y-6 p-4 pb-24 sm:p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <AdminStatCard icon={Users} label="Total Users" value={stats.users} color="text-blue-600 bg-blue-100" />
          <AdminStatCard icon={ShieldAlert} label="Pending Resources" value={stats.pendingResources} color="text-amber-600 bg-amber-100" />
          <AdminStatCard icon={CheckCircle} label="Approved Resources" value={stats.approvedResources} color="text-green-600 bg-green-100" />
          <AdminStatCard icon={XCircle} label="Rejected Resources" value={stats.rejectedResources} color="text-red-600 bg-red-100" />
          <AdminStatCard icon={ShieldAlert} label="Pending Reports" value={stats.pendingReports || reports.filter(r => r.status === "pending").length} color="text-orange-600 bg-orange-100" />
        </div>

        <div className="grid gap-4 lg:grid-cols-6">
          <ActionCard icon={FileCheck2} title="Manage All Resources" text="Browse every approved, pending, rejected, and needs-changes resource." button="Manage Resources" onClick={() => setLocation("/admin/resources")} />
          <ActionCard icon={FileCheck2} title="Review Resources" text="Approve, reject, or request changes for student uploads." button="Review Resources" onClick={() => setLocation("/admin/resources/review")} />
          <ActionCard icon={Users} title="Manage Users" text="Inspect user reports and moderation status." button="Manage Users" onClick={() => setLocation("/admin")} />
          <ActionCard icon={UploadCloud} title="Curated Uploads" text="Add academic files manually before public launch." button="Open Upload" onClick={() => setLocation("/admin-upload")} />
          <ActionCard icon={Mail} title="Contact Messages" text="Review support, copyright, partnership, and technical requests." button="Open Inbox" onClick={() => setLocation("/admin/contact-messages")} />
          <ActionCard icon={BookOpen} title="Academic Hierarchy" text="Manage universities, schools, departments, degree programs, and semesters." button="Manage Hierarchy" onClick={() => setLocation("/admin/academic")} />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="reports" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="reports" className="rounded-lg font-semibold">Reports</TabsTrigger>
            <TabsTrigger value="users" className="rounded-lg font-semibold">Users</TabsTrigger>
          </TabsList>
          
          <TabsContent value="reports" className="mt-6 space-y-4">
            {reports.map((report) => (
              <Card key={report.id} className={`border-border/50 shadow-sm ${report.status === 'resolved' ? 'opacity-60 bg-muted/30' : 'bg-background'}`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant={report.status === 'resolved' ? "secondary" : "destructive"} className="text-[10px] uppercase font-bold">
                      {report.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-medium">{new Date(report.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm font-medium mb-1">Reported User: <span className="text-primary">{report.reportedUserId || "Unknown"}</span></p>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4 p-2 bg-muted/30 rounded-lg italic">
                    "{report.reason}"
                  </p>
                  
                  {report.status === "pending" ? (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleAction(report.id, "deleted")}>
                        <Trash2 className="w-4 h-4 mr-2" /> Delete Content
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => handleAction(report.id, "dismissed")}>
                        <CheckCircle className="w-4 h-4 mr-2" /> Dismiss
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-center font-bold text-muted-foreground uppercase tracking-widest">Resolved</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          
          <TabsContent value="users" className="mt-6">
            <div className="bg-muted/10 border border-dashed border-border rounded-2xl p-8 text-center flex flex-col items-center justify-center">
              <Users className="w-8 h-8 text-muted-foreground/50 mb-2" />
              <h3 className="font-bold text-sm mb-1">User Management</h3>
              <p className="text-xs text-muted-foreground max-w-[200px]">Search and manage user accounts, ban functionality coming soon.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function AdminStatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="p-4">
        <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-2xl font-black">{value}</p>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function ActionCard({ icon: Icon, title, text, button, onClick }: { icon: any; title: string; text: string; button: string; onClick: () => void }) {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="flex h-full flex-col gap-4 p-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="font-bold">{title}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p>
        </div>
        <Button className="rounded-2xl font-bold" variant={button === "Review Resources" ? "default" : "outline"} onClick={onClick}>
          {button}
        </Button>
      </CardContent>
    </Card>
  );
}


