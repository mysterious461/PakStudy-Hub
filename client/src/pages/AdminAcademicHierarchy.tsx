import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BookOpen, Building2, GraduationCap, Home, Layers, Loader2, Plus, School, Trash2 } from "lucide-react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type AcademicLevel = "university" | "faculty" | "department" | "degree" | "semester";

type AcademicOption = {
  id: string;
  level: AcademicLevel;
  value: string;
  active: boolean;
  parentUniversity?: string;
  parentFaculty?: string;
  parentDepartment?: string;
  parentDegree?: string;
};

const levelMeta: Record<AcademicLevel, { label: string; icon: any; placeholder: string }> = {
  university: { label: "Universities", icon: Building2, placeholder: "National University of Sciences and Technology" },
  faculty: { label: "Faculties / Schools", icon: School, placeholder: "School of Electrical Engineering and Computer Science" },
  department: { label: "Departments", icon: Layers, placeholder: "Department of Computer Science" },
  degree: { label: "Degree Programs", icon: GraduationCap, placeholder: "BS Computer Science" },
  semester: { label: "Semesters", icon: BookOpen, placeholder: "Semester 4" },
};

const levels = Object.keys(levelMeta) as AcademicLevel[];

export default function AdminAcademicHierarchy() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [options, setOptions] = useState<AcademicOption[]>([]);
  const [level, setLevel] = useState<AcademicLevel>("university");
  const [value, setValue] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [canAccess, setCanAccess] = useState(true);

  const grouped = useMemo(() => {
    return levels.reduce((acc, key) => {
      acc[key] = options.filter((option) => option.level === key && option.active !== false);
      return acc;
    }, {} as Record<AcademicLevel, AcademicOption[]>);
  }, [options]);

  const loadOptions = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("GET", "/api/admin/academic-options");
      setOptions(await response.json());
      setCanAccess(true);
    } catch {
      setCanAccess(false);
      setOptions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadOptions();
  }, []);

  const addOption = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleaned = value.trim();
    if (cleaned.length < 2) {
      toast({ title: "Name required", description: "Enter at least two characters.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const response = await apiRequest("POST", "/api/admin/academic-options", { level, value: cleaned });
      const saved = await response.json();
      setOptions((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
      setValue("");
      toast({ title: "Academic option saved", description: `${cleaned} is now available in upload dropdowns.` });
    } catch (error) {
      toast({ title: "Could not save option", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const removeOption = async (option: AcademicOption) => {
    try {
      const response = await apiRequest("DELETE", `/api/admin/academic-options/${option.id}`);
      const updated = await response.json();
      setOptions((current) => current.map((item) => item.id === updated.id ? updated : item));
      toast({ title: "Option hidden", description: `${option.value} will no longer appear as a managed dropdown option.` });
    } catch (error) {
      toast({ title: "Could not hide option", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-[calc(100vh-170px)] bg-muted/10">
      <div className="border-b bg-background shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-2xl" onClick={() => setLocation("/admin")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-black">Academic Hierarchy</h1>
              <p className="mt-1 text-sm text-muted-foreground">Manage dropdown values for universities, schools, departments, degree programs, and semesters.</p>
            </div>
          </div>
          <Button variant="outline" className="rounded-2xl font-bold" onClick={() => setLocation("/contribute")}>
            <Home className="mr-2 h-4 w-4" />
            Back to Portal Home
          </Button>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[360px_1fr]">
        <Card className="border-border/60 shadow-sm lg:sticky lg:top-24 lg:self-start">
          <CardContent className="space-y-4 p-5">
            <div>
              <h2 className="text-lg font-black">Add Managed Value</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">Courses are intentionally not managed here yet. Course titles are learned from uploads.</p>
            </div>
            <form onSubmit={addOption} className="space-y-4">
              <div className="space-y-2">
                <Label>Hierarchy Level</Label>
                <Select value={level} onValueChange={(next) => setLevel(next as AcademicLevel)}>
                  <SelectTrigger className="h-12 rounded-2xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {levels.map((item) => <SelectItem key={item} value={item}>{levelMeta[item].label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input className="h-12 rounded-2xl" value={value} onChange={(event) => setValue(event.target.value)} placeholder={levelMeta[level].placeholder} />
              </div>
              <Button type="submit" disabled={isSaving} className="h-12 w-full rounded-2xl font-bold">
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Save Option
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {isLoading ? (
            <State icon={Loader2} title="Loading hierarchy" text="Checking managed academic options." spin />
          ) : !canAccess ? (
            <State icon={School} title="Admin access required" text="Only Admin users can manage academic hierarchy options." />
          ) : (
            levels.map((item) => {
              const Icon = levelMeta[item].icon;
              return (
                <Card key={item} className="border-border/60 shadow-sm">
                  <CardContent className="p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
                        <div>
                          <h2 className="font-black">{levelMeta[item].label}</h2>
                          <p className="text-xs text-muted-foreground">{grouped[item].length} active option{grouped[item].length === 1 ? "" : "s"}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="rounded-full">Managed</Badge>
                    </div>
                    {grouped[item].length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">No managed values yet.</div>
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                        {grouped[item].map((option) => (
                          <div key={option.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background p-3">
                            <span className="truncate text-sm font-semibold">{option.value}</span>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-xl text-red-700" onClick={() => removeOption(option)} title="Hide option">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
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
        <h2 className="text-lg font-black">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{text}</p>
      </CardContent>
    </Card>
  );
}
