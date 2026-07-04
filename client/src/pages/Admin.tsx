import React, { useEffect, useState } from "react";
import { ArrowLeft, ShieldAlert, Users, CheckCircle, Trash2, UploadCloud, FileCheck2 } from "lucide-react";
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
  const [stats, setStats] = useState({ users: 0, pendingReports: 0 });

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
    <div className="h-full flex flex-col bg-muted/10 relative overflow-hidden">
      <header className="px-6 py-4 bg-background sticky top-0 z-10 border-b flex items-center gap-4 shadow-sm">
        <Button variant="ghost" size="icon" className="-ml-2 hover:bg-muted/50" onClick={() => setLocation("/profile")}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div>
          <h1 className="text-lg font-bold truncate">Admin Dashboard</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Moderator View</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-24">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-4 flex flex-col gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.users}</p>
                <p className="text-xs text-muted-foreground font-medium">Total Users</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-4 flex flex-col gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingReports || reports.filter(r => r.status === "pending").length}</p>
                <p className="text-xs text-muted-foreground font-medium">Pending Reports</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm">Launch Resource Upload</p>
              <p className="text-xs text-muted-foreground">Add curated files to Firebase Storage and Firestore.</p>
            </div>
            <Button size="sm" className="font-semibold" onClick={() => setLocation("/admin-upload")}>
              Open
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 text-green-600 flex items-center justify-center shrink-0">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm">Contributor Review Queue</p>
              <p className="text-xs text-muted-foreground">Approve, reject, or request changes for student uploads.</p>
            </div>
            <Button size="sm" variant="outline" className="font-semibold" onClick={() => setLocation("/admin/resources/review")}>
              Review
            </Button>
          </CardContent>
        </Card>

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
