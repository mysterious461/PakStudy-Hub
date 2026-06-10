import React, { useState } from "react";
import { useLocation } from "wouter";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { ImagePlus, X, FileText, Plus, EyeOff, Mic } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { EDUCATION_HIERARCHY, UNIVERSITIES } from "@/lib/educationData";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Post() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    level: "",
    degree: "",
    course: "",
    university: "",
    sellNotes: false,
    notesPrice: "",
    isAnonymous: false
  });

  const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false);
  const [isSubmittingCourse, setIsSubmittingCourse] = useState(false);
  const [courseData, setCourseData] = useState({
    courseNo: "",
    degreeName: "",
    university: "",
    semesterNo: ""
  });

  const availableDegrees = formData.level ? Object.keys(EDUCATION_HIERARCHY[formData.level as keyof typeof EDUCATION_HIERARCHY]) : [];
  const availableCourses = (formData.level && formData.degree) ? (EDUCATION_HIERARCHY[formData.level as keyof typeof EDUCATION_HIERARCHY] as Record<string, string[]>)[formData.degree] || [] : [];

  const handleAddCourse = async () => {
    // If university is not selected, fallback to the one selected in the main form if it exists
    const finalUniversity = courseData.university || formData.university;
    
    if (!courseData.courseNo || !courseData.degreeName || !finalUniversity || !courseData.semesterNo) {
      toast({
        title: "Missing fields",
        description: "Please fill in all the details.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmittingCourse(true);
    try {
      if (auth.currentUser) {
        await addDoc(collection(db, "pending_courses"), {
          ...courseData,
          university: finalUniversity,
          userId: auth.currentUser.uid,
          status: "pending",
          createdAt: serverTimestamp()
        });
      }
      
      toast({
        title: "Course Submitted",
        description: "Your course has been submitted for manager approval.",
      });
      setIsCourseDialogOpen(false);
      setCourseData({ courseNo: "", degreeName: "", university: "", semesterNo: "" });
    } catch (error: any) {
      toast({
        title: "Error submitting course",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmittingCourse(false);
    }
  };

  const handlePost = async () => {
    if (!auth.currentUser) {
      toast({
        title: "Guest Mode",
        description: "Please log in to post questions.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title || !formData.content || !formData.course) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all fields before posting.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await addDoc(collection(db, "questions"), {
        ...formData,
        subject: formData.course,
        university: formData.university || null,
        userId: formData.isAnonymous ? "anonymous" : auth.currentUser?.uid,
        userName: formData.isAnonymous ? "Anonymous Student" : (auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0]),
        createdAt: serverTimestamp(),
        upvotes: 0,
        commentsCount: 0
      });

      toast({
        title: "Question Posted",
        description: "Your question has been shared with the community.",
      });
      setLocation("/home");
    } catch (error: any) {
      toast({
        title: "Post Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-muted/10 relative overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3" />
        <img src="/src/assets/images/post-bg.jpg" alt="Background" className="w-full h-full object-cover opacity-5 mix-blend-overlay" />
        <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px]" />
      </div>

      <header className="px-6 py-4 pt-6 sticky top-0 z-20 border-b border-border/40 flex items-center justify-between relative overflow-hidden shadow-[0_4px_30px_rgb(0,0,0,0.03)] bg-background/60 backdrop-blur-xl">
        <div className="relative z-10 flex items-center gap-2">
           <Button variant="ghost" size="icon" className="-ml-2 hover:bg-muted/50 rounded-full transition-colors" onClick={() => setLocation("/home")}>
             <X className="w-6 h-6" />
           </Button>
           <h1 className="text-xl font-extrabold tracking-tight">Create Post</h1>
        </div>
        <Button 
          size="sm" 
          className="rounded-full px-6 relative z-10 font-bold shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5" 
          onClick={handlePost}
          disabled={isLoading}
        >
          {isLoading ? "Posting..." : "Post"}
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 relative z-10 pb-32">
        <div className="space-y-6">
          <div className="bg-background/60 backdrop-blur-sm border border-border/40 rounded-3xl p-5 shadow-sm">
            <div className="space-y-2 mb-4">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold ml-1">1. Choose Education Level</Label>
              <Select onValueChange={(v) => setFormData({...formData, level: v, degree: "", course: "", university: ""})}>
                <SelectTrigger className="bg-muted/40 border-none h-14 rounded-2xl focus:ring-2 ring-primary/20 transition-all font-medium px-4 text-base">
                  <SelectValue placeholder="Select Level" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(EDUCATION_HIERARCHY).map(level => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(formData.level === "Bachelors (BS)" || formData.level === "Masters (MS/MPhil)") && (
              <div className="space-y-2 mb-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold ml-1">University</Label>
                <Select onValueChange={(v) => setFormData({...formData, university: v})}>
                  <SelectTrigger className="bg-muted/40 border-none h-14 rounded-2xl focus:ring-2 ring-primary/20 transition-all font-medium px-4 text-base">
                    <SelectValue placeholder="Select University" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIVERSITIES.map(uni => (
                      <SelectItem key={uni} value={uni}>{uni}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.level && (
              <div className="space-y-2 mb-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold ml-1">2. Choose Degree / Program</Label>
                <Select onValueChange={(v) => setFormData({...formData, degree: v, course: ""})}>
                  <SelectTrigger className="bg-muted/40 border-none h-14 rounded-2xl focus:ring-2 ring-primary/20 transition-all font-medium px-4 text-base">
                    <SelectValue placeholder="Select Degree" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDegrees.map(degree => (
                      <SelectItem key={degree} value={degree}>{degree}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.level && formData.degree && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center justify-between mb-1 px-1">
                  <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">3. Select Course</Label>
                  <Dialog open={isCourseDialogOpen} onOpenChange={setIsCourseDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] text-primary hover:bg-primary/10 rounded-full font-bold uppercase tracking-wider">
                        <Plus className="w-3 h-3 mr-1" /> Add Missing Course
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] rounded-3xl w-[90vw] p-6">
                      <DialogHeader className="mb-4">
                        <DialogTitle className="text-xl font-extrabold">Add New Course</DialogTitle>
                        <DialogDescription className="font-medium">
                          Submit a new course for manager approval.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-2">
                        <div className="space-y-2">
                          <Label htmlFor="courseNo" className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold ml-1">Course No / Code</Label>
                          <Input 
                            id="courseNo" 
                            placeholder="e.g. CS-101" 
                            className="bg-muted/40 border-none h-12 rounded-xl focus-visible:ring-2 ring-primary/20 px-4 font-medium"
                            value={courseData.courseNo}
                            onChange={(e) => setCourseData({...courseData, courseNo: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="degreeName" className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold ml-1">Degree Name</Label>
                          <Input 
                            id="degreeName" 
                            placeholder="e.g. BS Computer Science" 
                            className="bg-muted/40 border-none h-12 rounded-xl focus-visible:ring-2 ring-primary/20 px-4 font-medium"
                            value={courseData.degreeName}
                            onChange={(e) => setCourseData({...courseData, degreeName: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="university" className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold ml-1">University</Label>
                          <Select value={courseData.university} onValueChange={(v) => setCourseData({...courseData, university: v})}>
                            <SelectTrigger className="bg-muted/40 border-none h-12 rounded-xl focus-visible:ring-2 ring-primary/20 px-4 font-medium">
                              <SelectValue placeholder="Select University" />
                            </SelectTrigger>
                            <SelectContent>
                              {UNIVERSITIES.map(uni => (
                                <SelectItem key={uni} value={uni}>{uni}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="semesterNo" className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold ml-1">Semester No</Label>
                          <Input 
                            id="semesterNo" 
                            placeholder="e.g. 3rd Semester" 
                            className="bg-muted/40 border-none h-12 rounded-xl focus-visible:ring-2 ring-primary/20 px-4 font-medium"
                            value={courseData.semesterNo}
                            onChange={(e) => setCourseData({...courseData, semesterNo: e.target.value})}
                          />
                        </div>
                      </div>
                      <DialogFooter className="mt-6">
                        <Button onClick={handleAddCourse} disabled={isSubmittingCourse} className="w-full h-12 rounded-xl font-bold shadow-md shadow-primary/20">
                          {isSubmittingCourse ? "Submitting..." : "Submit for Approval"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <Select onValueChange={(v) => setFormData({...formData, course: v})}>
                  <SelectTrigger className="bg-muted/40 border-none h-14 rounded-2xl focus:ring-2 ring-primary/20 transition-all font-medium px-4 text-base">
                    <SelectValue placeholder="Select Course" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCourses.map((c: string) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {formData.course && (
            <div className="space-y-6 pt-2 animate-in fade-in slide-in-from-bottom-8 duration-500">
              <div className="space-y-3">
                <Input 
                  placeholder="What's your question or post about?" 
                  className="font-extrabold text-xl border-none px-5 h-16 bg-background/80 backdrop-blur-xl rounded-3xl focus-visible:ring-2 ring-primary/30 placeholder:text-muted-foreground/40 shadow-sm transition-all" 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="space-y-3">
                <Textarea 
                  placeholder="Describe your question or notes in detail..." 
                  className="min-h-[220px] border-none p-5 bg-background/80 backdrop-blur-xl rounded-3xl focus-visible:ring-2 ring-primary/30 resize-none text-base font-medium shadow-sm transition-all leading-relaxed" 
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                />
              </div>

              <div className="pt-2 space-y-4">
                <div className="flex items-center justify-between bg-background/80 backdrop-blur-xl p-5 rounded-3xl border border-border/40 shadow-sm transition-all hover:shadow-md">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-indigo-500/10 text-indigo-500 rounded-xl">
                      <EyeOff className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[15px]">Ask Anonymously</h3>
                      <p className="text-xs text-muted-foreground font-medium">Hide your identity</p>
                    </div>
                  </div>
                  <Switch 
                    checked={formData.isAnonymous} 
                    onCheckedChange={(c) => setFormData({...formData, isAnonymous: c})} 
                  />
                </div>

                <div className="flex items-center justify-between bg-background/80 backdrop-blur-xl p-5 rounded-3xl border border-border/40 shadow-sm transition-all hover:shadow-md">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[15px]">Sell Notes</h3>
                      <p className="text-xs text-muted-foreground font-medium">Attach study materials for sale</p>
                    </div>
                  </div>
                  <Switch 
                    checked={formData.sellNotes} 
                    onCheckedChange={(c) => setFormData({...formData, sellNotes: c})} 
                  />
                </div>

                {formData.sellNotes && (
                  <div className="space-y-4 p-5 bg-primary/5 rounded-3xl border border-primary/10 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="space-y-2">
                      <Label className="text-[11px] uppercase tracking-wider font-bold text-primary/80 ml-1">Price (Rs.)</Label>
                      <Input 
                        type="number" 
                        placeholder="e.g. 500" 
                        className="bg-background h-14 rounded-2xl border-none focus-visible:ring-2 ring-primary/30 text-lg font-bold px-4 shadow-sm"
                        value={formData.notesPrice}
                        onChange={(e) => setFormData({...formData, notesPrice: e.target.value})}
                      />
                      {formData.notesPrice && (
                        <p className="text-[11px] text-muted-foreground font-semibold ml-1">
                          You will receive <span className="text-primary font-bold">Rs. {Math.round(parseInt(formData.notesPrice) * 0.9)}</span> (10% platform fee applied)
                        </p>
                      )}
                    </div>
                    <Button variant="outline" className="w-full justify-start gap-3 h-14 rounded-2xl text-primary border-primary/20 bg-background/50 hover:bg-primary/5 font-semibold transition-all">
                      <ImagePlus className="w-5 h-5" />
                      Upload PDF / Document
                    </Button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="w-full justify-center gap-2 h-14 rounded-2xl text-muted-foreground border-border/50 bg-background/60 backdrop-blur-sm font-semibold hover:bg-muted/50 transition-all hover:text-foreground">
                    <ImagePlus className="w-5 h-5 shrink-0" />
                    <span className="truncate">Add Photo</span>
                  </Button>
                  <Button variant="outline" className="w-full justify-center gap-2 h-14 rounded-2xl text-muted-foreground border-border/50 bg-background/60 backdrop-blur-sm font-semibold hover:bg-muted/50 transition-all hover:text-foreground">
                    <Mic className="w-5 h-5 shrink-0" />
                    <span className="truncate">Voice Note</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}
