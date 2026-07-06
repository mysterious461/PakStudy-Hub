import React, { useEffect, useMemo, useState } from "react";
import { Award, Download, Eye, FileArchive, FileText, Filter, GraduationCap, Image, Loader2, Music, Search, Star, Video } from "lucide-react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

const emptyFilters = {
  university: "",
  faculty: "",
  degree: "",
  semester: "",
  courseCode: "",
  courseTitle: "",
  resourceType: "",
  year: "",
  language: "",
  status: "all",
};

export default function ResourceSearch() {
  const [, setLocation] = useLocation();
  const [resources, setResources] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(emptyFilters);
  const [role, setRole] = useState("Student");
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const isAdmin = role === "Admin" || role === "Moderator";

  useEffect(() => {
    let cancelled = false;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setRole("Student");
        return;
      }
      void (async () => {
      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/user/profile", { headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok) return;
        const profile = await response.json();
        if (!cancelled) setRole(profile.role || "Student");
      } catch {
        if (!cancelled) setRole("Student");
      }
      })();
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadResources();
    }, 220);
    return () => window.clearTimeout(timeout);
  }, [search, filters, role]);

  const loadResources = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      Object.entries(filters).forEach(([key, value]) => {
        if (!value || value === "all") return;
        if (key === "status" && !isAdmin) return;
        params.set(key, value);
      });
      const user = auth.currentUser;
      const token = user ? await user.getIdToken().catch(() => "") : "";
      const endpoint = isAdmin ? "/api/admin/resources" : "/api/resources/public";
      const response = await fetch(`${endpoint}?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!response.ok) throw new Error("Could not load resources");
      const payload = await response.json();
      setResources(isAdmin ? filterResourcesLocally(payload, search, filters) : payload);
    } catch {
      setHasError(true);
      setResources([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterOptions = useMemo(() => ({
    universities: unique(resources.map((resource) => resource.university)),
    faculties: unique(resources.map((resource) => resource.faculty || resource.department)),
    degrees: unique(resources.map((resource) => resource.degree)),
    semesters: unique(resources.map((resource) => resource.semester)),
    languages: unique(resources.map((resource) => resource.language)),
  }), [resources]);

  return (
    <div className="min-h-[calc(100vh-170px)] bg-muted/10">
      <section className="border-b bg-[linear-gradient(135deg,rgba(22,163,74,0.12),rgba(255,255,255,0)_55%)]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <p className="text-xs font-black uppercase tracking-widest text-primary">Resource Library</p>
          <h1 className="mt-3 text-4xl font-black tracking-normal sm:text-5xl">Find reviewed study resources</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-muted-foreground">Search notes, slides, past papers, assignments, lab manuals, tutorials, and more by academic hierarchy.</p>
          <Card className="mt-6 border-border/60 shadow-sm">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                <Input className="h-12 rounded-2xl pl-12" placeholder="Search by course code, title, university, tags, or contributor..." value={search} onChange={(event) => setSearch(event.target.value)} />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[300px_1fr]">
        <aside>
          <Card className="border-border/60 shadow-sm lg:sticky lg:top-24">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                <h2 className="font-black">Filters</h2>
              </div>
              <FilterInput label="University" value={filters.university} onChange={(value) => setFilters({ ...filters, university: value })} options={filterOptions.universities} />
              <FilterInput label="Department / Faculty" value={filters.faculty} onChange={(value) => setFilters({ ...filters, faculty: value })} options={filterOptions.faculties} />
              <FilterInput label="Degree Program" value={filters.degree} onChange={(value) => setFilters({ ...filters, degree: value })} options={filterOptions.degrees} />
              <FilterInput label="Semester" value={filters.semester} onChange={(value) => setFilters({ ...filters, semester: value })} options={filterOptions.semesters} />
              <FilterInput label="Course Code" value={filters.courseCode} onChange={(value) => setFilters({ ...filters, courseCode: value })} />
              <FilterInput label="Course Title" value={filters.courseTitle} onChange={(value) => setFilters({ ...filters, courseTitle: value })} />
              <SelectFilter label="Resource Type" value={filters.resourceType} onChange={(value) => setFilters({ ...filters, resourceType: value })} options={["notes", "slides", "past_papers", "assignments", "lab_manuals", "projects", "formula_sheets", "tutorials", "quizzes"]} />
              <FilterInput label="Academic Year / Session" value={filters.year} onChange={(value) => setFilters({ ...filters, year: value })} />
              <FilterInput label="Language" value={filters.language} onChange={(value) => setFilters({ ...filters, language: value })} options={filterOptions.languages} />
              {isAdmin && <SelectFilter label="Admin Status" value={filters.status} onChange={(value) => setFilters({ ...filters, status: value })} options={["approved", "pending", "rejected", "changes_requested"]} />}
              <Button variant="outline" className="w-full rounded-2xl font-bold" onClick={() => { setFilters(emptyFilters); setSearch(""); }}>Reset</Button>
            </CardContent>
          </Card>
        </aside>

        <main className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-muted-foreground">{isLoading ? "Searching..." : `${resources.length} resources found`}</p>
          </div>
          {isLoading ? (
            <div className="grid gap-4 xl:grid-cols-2">{Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={index} />)}</div>
          ) : hasError ? (
            <State title="Could not load resources" text="Please refresh and try again." />
          ) : resources.length === 0 ? (
            <State title="No resources found" text="Try a different course code, university, category, or tag." />
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {resources.map((resource) => <ResourceCard key={resource.id} resource={resource} onView={() => setLocation(`/resources/${resource.id}`)} />)}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function ResourceCard({ resource, onView }: { resource: any; onView: () => void }) {
  const Icon = iconFor(resource);
  return (
    <Card className="border-border/60 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
      <CardContent className="p-5">
        <div className="mb-4 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-6 w-6" /></div>
          <div className="min-w-0 flex-1">
            <h2 className="line-clamp-2 font-black leading-snug">{resource.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{displayCourse(resource)}</p>
          </div>
          <Badge variant="outline" className="rounded-full">{labelType(resource.resourceCategory || resource.resourceType)}</Badge>
        </div>
        <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <span>{resource.university}</span>
          <span>{resource.degree}</span>
          <span>{resource.semester}</span>
          <span>{resource.uploadedByName || "Contributor"}</span>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{resource.views || 0}</span>
          <span className="inline-flex items-center gap-1"><Download className="h-3.5 w-3.5" />{resource.downloads || 0}</span>
          <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5" />Rating soon</span>
          <span>{formatDate(resource.createdAt)}</span>
        </div>
        <Button className="mt-5 w-full rounded-2xl font-bold" onClick={onView}>View Details</Button>
      </CardContent>
    </Card>
  );
}

function FilterInput({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options?: string[] }) {
  return <div className="space-y-2"><p className="text-xs font-black uppercase tracking-wide text-muted-foreground">{label}</p><Input list={`${label}-options`} value={value} onChange={(event) => onChange(event.target.value)} placeholder={label} />{options?.length ? <datalist id={`${label}-options`}>{options.map((option) => <option key={option} value={option} />)}</datalist> : null}</div>;
}

function SelectFilter({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return <div className="space-y-2"><p className="text-xs font-black uppercase tracking-wide text-muted-foreground">{label}</p><Select value={value || "all"} onValueChange={(next) => onChange(next === "all" ? "" : next)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{options.map((option) => <SelectItem key={option} value={option}>{labelType(option)}</SelectItem>)}</SelectContent></Select></div>;
}

function SkeletonCard() {
  return <Card className="border-border/60 shadow-sm"><CardContent className="space-y-4 p-5"><div className="h-5 w-2/3 animate-pulse rounded bg-muted" /><div className="h-4 w-1/2 animate-pulse rounded bg-muted" /><div className="grid gap-2 sm:grid-cols-2"><div className="h-4 animate-pulse rounded bg-muted" /><div className="h-4 animate-pulse rounded bg-muted" /></div></CardContent></Card>;
}

function State({ title, text }: { title: string; text: string }) {
  return <Card className="border-border/60 shadow-sm"><CardContent className="flex min-h-80 flex-col items-center justify-center p-8 text-center"><GraduationCap className="mb-4 h-12 w-12 text-primary" /><h2 className="text-xl font-black">{title}</h2><p className="mt-2 text-sm text-muted-foreground">{text}</p></CardContent></Card>;
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort();
}

function filterResourcesLocally(resources: any[], search: string, filters: typeof emptyFilters) {
  const query = search.trim().toLowerCase();
  return resources.filter((resource) => {
    const status = filters.status === "needs_changes" ? "changes_requested" : filters.status;
    if (status && status !== "all" && resource.status !== status) return false;
    const pairs = [
      [filters.university, resource.university],
      [filters.faculty, resource.faculty || resource.department],
      [filters.degree, resource.degree],
      [filters.semester, resource.semester],
      [filters.courseCode, resource.courseCode],
      [filters.courseTitle, resource.courseTitle],
      [filters.resourceType, resource.resourceCategory || resource.resourceType],
      [filters.year, String(resource.year || "")],
      [filters.language, resource.language],
    ];
    if (pairs.some(([expected, actual]) => expected && !String(actual || "").toLowerCase().includes(String(expected).toLowerCase()))) return false;
    if (!query) return true;
    const haystack = [
      resource.title,
      resource.courseCode,
      resource.courseTitle,
      resource.course,
      resource.subject,
      resource.university,
      resource.faculty,
      resource.department,
      resource.degree,
      resource.semester,
      resource.resourceCategory,
      resource.resourceType,
      resource.year,
      resource.language,
      resource.uploadedByName,
      ...(resource.tags || []),
    ].join(" ").toLowerCase();
    return query.split(/\s+/).every((term) => haystack.includes(term));
  });
}

function displayCourse(resource: any) {
  const title = resource.courseTitle || resource.course || resource.subject || "Course";
  return resource.courseCode ? `${resource.courseCode} / ${title}` : title;
}

function labelType(type: string) {
  return type ? type.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()) : "Resource";
}

function iconFor(resource: any) {
  const category = resource.fileCategory || resource.fileType || "";
  if (String(category).includes("image")) return Image;
  if (String(category).includes("audio")) return Music;
  if (String(category).includes("video")) return Video;
  if (String(category).includes("archive") || ["zip", "rar", "7z"].includes(resource.fileExtension)) return FileArchive;
  return FileText;
}

function formatDate(value: unknown) {
  const date = value ? new Date(value as string) : null;
  if (!date || Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
