import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle, Download, Globe, Home, Loader2, ShieldCheck, UploadCloud, XCircle } from "lucide-react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type ImportItem = {
  id: string;
  value: string;
  detectedType: string;
  sourceUrl?: string;
  extractedTextSnippet?: string;
  confidence?: number;
  status?: string;
  importStatus?: string;
  importedAt?: string;
};

const csvTemplate = "name,shortName,sector,province,city,officialWebsite,hecRecognized,sourceUrl\nNational University of Sciences and Technology,NUST,Public,Islamabad,Islamabad,https://nust.edu.pk,true,https://nust.edu.pk";
const jsonTemplate = JSON.stringify([{ name: "National University of Sciences and Technology", shortName: "NUST", sector: "Public", province: "Islamabad", city: "Islamabad", officialWebsite: "https://nust.edu.pk", hecRecognized: true, sourceUrl: "https://nust.edu.pk" }], null, 2);

export default function AdminAcademicImport() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [items, setItems] = useState<ImportItem[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [duplicateGroups, setDuplicateGroups] = useState<ImportItem[][]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const [content, setContent] = useState(csvTemplate);
  const [sourceUrl, setSourceUrl] = useState("https://");
  const [websiteUrl, setWebsiteUrl] = useState("https://");
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);

  const pendingItems = useMemo(() => items.filter((item) => (item.status || item.importStatus) === "pending_review"), [items]);

  const loadImports = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("GET", "/api/admin/academic/imports");
      const payload = await response.json();
      setItems(payload.items || []);
      setRequests(payload.requests || []);
      setDuplicateGroups(payload.duplicateGroups || []);
    } catch (error) {
      toast({ title: "Could not load imports", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadImports();
  }, []);

  const importFile = async () => {
    setIsImporting(true);
    try {
      const response = await apiRequest("POST", "/api/admin/academic/imports/file", { format, content, sourceUrl });
      const payload = await response.json();
      toast({ title: "Import saved for review", description: `${payload.count} item${payload.count === 1 ? "" : "s"} added as pending suggestions.` });
      await loadImports();
    } catch (error) {
      toast({ title: "Import failed", description: error instanceof Error ? error.message : "Check the CSV/JSON format.", variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  };

  const importWebsite = async () => {
    setIsImporting(true);
    try {
      const response = await apiRequest("POST", "/api/admin/academic/imports/website", { sourceUrl: websiteUrl });
      const payload = await response.json();
      toast({ title: "Website extraction complete", description: `${payload.count} suggestion${payload.count === 1 ? "" : "s"} saved for review.` });
      await loadImports();
    } catch (error) {
      toast({ title: "Extraction failed", description: error instanceof Error ? error.message : "Use an official public university page URL.", variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  };

  const reviewItem = async (item: ImportItem, action: "approved" | "rejected" | "needs_cleanup") => {
    try {
      const response = await apiRequest("PATCH", `/api/admin/academic/imports/${item.id}`, { action, value: item.value, detectedType: item.detectedType });
      const updated = await response.json();
      setItems((current) => current.map((entry) => entry.id === updated.id ? updated : entry));
      setSelected((current) => current.filter((id) => id !== item.id));
      toast({ title: "Review saved", description: `${item.value} marked ${action.replace("_", " ")}.` });
    } catch (error) {
      toast({ title: "Review failed", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    }
  };

  const bulkReview = async (action: "approved" | "rejected") => {
    if (!selected.length) return;
    try {
      const response = await apiRequest("POST", "/api/admin/academic/imports/bulk-review", { ids: selected, action });
      const payload = await response.json();
      toast({ title: "Bulk review complete", description: `${payload.reviewed} item${payload.reviewed === 1 ? "" : "s"} updated.` });
      setSelected([]);
      await loadImports();
    } catch (error) {
      toast({ title: "Bulk review failed", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    }
  };

  const markTrusted = async (url: string) => {
    try {
      await apiRequest("POST", "/api/admin/academic/sources/trusted", { sourceUrl: url });
      toast({ title: "Source trusted", description: "This official source has been marked trusted for future review context." });
    } catch (error) {
      toast({ title: "Could not trust source", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-[calc(100vh-170px)] bg-muted/10">
      <div className="border-b bg-background shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-2xl" onClick={() => setLocation("/admin/academic")}><ArrowLeft className="h-5 w-5" /></Button>
            <div>
              <h1 className="text-2xl font-black">Academic Import Center</h1>
              <p className="mt-1 text-sm text-muted-foreground">Import official academic hierarchy data as pending suggestions. Nothing becomes active until review.</p>
            </div>
          </div>
          <Button variant="outline" className="rounded-2xl font-bold" onClick={() => setLocation("/contribute")}><Home className="mr-2 h-4 w-4" />Back to Portal Home</Button>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 xl:grid-cols-[420px_1fr]">
        <div className="space-y-5">
          <Card className="border-border/60 shadow-sm">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center gap-3"><UploadCloud className="h-5 w-5 text-primary" /><h2 className="font-black">CSV / JSON University Import</h2></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Select value={format} onValueChange={(value) => setFormat(value as "csv" | "json")}><SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="csv">CSV</SelectItem><SelectItem value="json">JSON</SelectItem></SelectContent></Select>
                <Input value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="Source URL" className="rounded-2xl" />
              </div>
              <Textarea value={content} onChange={(event) => setContent(event.target.value)} className="min-h-56 resize-y rounded-2xl font-mono text-xs" />
              <div className="flex flex-wrap gap-2">
                <TemplateButton label="CSV template" fileName="pakstudy-university-template.csv" content={csvTemplate} />
                <TemplateButton label="JSON template" fileName="pakstudy-university-template.json" content={jsonTemplate} />
                <Button disabled={isImporting} onClick={importFile} className="rounded-2xl font-bold">{isImporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Import for Review</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center gap-3"><Globe className="h-5 w-5 text-primary" /><h2 className="font-black">Official Website Extractor</h2></div>
              <p className="text-sm leading-6 text-muted-foreground">Enter one public university academics, departments, or programs page. The extractor respects robots.txt and saves suggestions as pending review only.</p>
              <Input value={websiteUrl} onChange={(event) => setWebsiteUrl(event.target.value)} placeholder="https://university.edu.pk/academics" className="rounded-2xl" />
              <div className="flex flex-wrap gap-2">
                <Button disabled={isImporting} onClick={importWebsite} className="rounded-2xl font-bold">Extract Suggestions</Button>
                <Button variant="outline" onClick={() => markTrusted(websiteUrl)} className="rounded-2xl font-bold"><ShieldCheck className="mr-2 h-4 w-4" />Mark Source Trusted</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardContent className="space-y-3 p-5">
              <h2 className="font-black">Duplicate Review</h2>
              {duplicateGroups.length === 0 ? <p className="text-sm text-muted-foreground">No duplicate groups detected.</p> : duplicateGroups.slice(0, 6).map((group, index) => <div key={index} className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{group.map((item) => item.value).join(" / ")}</div>)}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="border-border/60 shadow-sm">
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div><h2 className="font-black">Imported Suggestions</h2><p className="text-sm text-muted-foreground">{pendingItems.length} pending review</p></div>
              <div className="flex gap-2"><Button variant="outline" disabled={!selected.length} onClick={() => bulkReview("rejected")} className="rounded-2xl font-bold">Bulk Reject</Button><Button disabled={!selected.length} onClick={() => bulkReview("approved")} className="rounded-2xl font-bold">Bulk Approve</Button></div>
            </CardContent>
          </Card>

          {isLoading ? <State /> : items.length === 0 ? <Empty /> : items.map((item) => (
            <Card key={item.id} className="border-border/60 shadow-sm">
              <CardContent className="grid gap-4 p-5 lg:grid-cols-[auto_1fr_180px] lg:items-start">
                <Checkbox checked={selected.includes(item.id)} onCheckedChange={(checked) => setSelected((current) => checked ? [...current, item.id] : current.filter((id) => id !== item.id))} />
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2"><Badge variant="outline" className="rounded-full">{item.detectedType}</Badge><Badge variant="outline" className="rounded-full">{item.status || item.importStatus}</Badge><Badge variant="outline" className="rounded-full">{Math.round(Number(item.confidence || 0) * 100)}% confidence</Badge></div>
                  <Input value={item.value} onChange={(event) => setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, value: event.target.value } : entry))} className="mb-2 h-11 rounded-2xl font-bold" />
                  <p className="text-xs leading-5 text-muted-foreground">{item.extractedTextSnippet || "No snippet saved."}</p>
                  <p className="mt-2 truncate text-xs text-primary">{item.sourceUrl}</p>
                </div>
                <div className="grid gap-2">
                  <Button size="sm" className="rounded-xl font-bold" onClick={() => reviewItem(item, "approved")}><CheckCircle className="mr-2 h-4 w-4" />Approve</Button>
                  <Button size="sm" variant="outline" className="rounded-xl font-bold" onClick={() => reviewItem(item, "needs_cleanup")}>Needs Cleanup</Button>
                  <Button size="sm" variant="outline" className="rounded-xl font-bold text-red-700" onClick={() => reviewItem(item, "rejected")}><XCircle className="mr-2 h-4 w-4" />Reject</Button>
                </div>
              </CardContent>
            </Card>
          ))}

          <Card className="border-border/60 shadow-sm">
            <CardContent className="space-y-3 p-5">
              <h2 className="font-black">Missing Academic Requests</h2>
              {requests.length === 0 ? <p className="text-sm text-muted-foreground">No requests yet.</p> : requests.map((request) => <div key={request.id} className="rounded-2xl border border-border/60 p-3 text-sm"><p className="font-bold">{request.type}</p><p className="mt-1 text-muted-foreground">{request.message}</p></div>)}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function TemplateButton({ label, fileName, content }: { label: string; fileName: string; content: string }) {
  const href = `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`;
  return <a href={href} download={fileName}><Button type="button" variant="outline" className="rounded-2xl font-bold"><Download className="mr-2 h-4 w-4" />{label}</Button></a>;
}

function State() {
  return <Card className="border-border/60 shadow-sm"><CardContent className="flex min-h-80 items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading imports</CardContent></Card>;
}

function Empty() {
  return <Card className="border-border/60 shadow-sm"><CardContent className="flex min-h-80 flex-col items-center justify-center text-center"><UploadCloud className="mb-3 h-10 w-10 text-muted-foreground" /><h2 className="font-black">No imported data yet</h2><p className="mt-2 text-sm text-muted-foreground">Import CSV/JSON data or extract one official university page to begin.</p></CardContent></Card>;
}
