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
import { ImagePlus, X, FileText, Plus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { EDUCATION_HIERARCHY } from "@/lib/educationData";
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
    sellNotes: false,
    notesPrice: ""
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
  const availableCourses = (formData.level && formData.degree) ? EDUCATION_HIERARCHY[formData.level as keyof typeof EDUCATION_HIERARCHY][formData.degree as keyof typeof EDUCATION_HIERARCHY[any]] : [];

  const handleAddCourse = async () => {
    if (!courseData.courseNo || !courseData.degreeName || !courseData.university || !courseData.semesterNo) {
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
        userId: auth.currentUser?.uid,
        userName: auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0],
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
      <div className="absolute inset-0 z-0">
        <img src="/src/assets/images/post-bg.jpg" alt="Background" className="w-full h-full object-cover opacity-10" />
        <div className="absolute inset-0 bg-background/95 backdrop-blur-[1px]" />
      </div>

      <header className="px-6 py-4 sticky top-0 z-10 border-b border-border/50 flex items-center justify-between relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="/src/assets/images/header-bg.jpg" alt="Background" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />
        </div>
        <div className="relative z-10 flex items-center gap-2">
           <Button variant="ghost" size="icon" className="-ml-2" onClick={() => setLocation("/home")}>
             <X className="w-6 h-6" />
           </Button>
           <h1 className="text-lg font-bold">Create Post</h1>
        </div>
        <Button 
          size="sm" 
          className="rounded-full px-6 relative z-10" 
          onClick={handlePost}
          disabled={isLoading}
        >
          {isLoading ? "Posting..." : "Post"}
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 relative z-10 pb-24">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">1. Choose Education Level</Label>
            <Select onValueChange={(v) => setFormData({...formData, level: v, degree: "", course: ""})}>
              <SelectTrigger className="bg-background/80 backdrop-blur-sm border-border/50 h-12 rounded-xl">
                <SelectValue placeholder="Select Level" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(EDUCATION_HIERARCHY).map(level => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.level && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">2. Choose Degree / Program</Label>
              <Select onValueChange={(v) => setFormData({...formData, degree: v, course: ""})}>
                <SelectTrigger className="bg-background/80 backdrop-blur-sm border-border/50 h-12 rounded-xl">
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
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">3. Select Course</Label>
                <Dialog open={isCourseDialogOpen} onOpenChange={setIsCourseDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-primary">
                      <Plus className="w-3 h-3 mr-1" /> Missing Course? Add it
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] rounded-2xl w-[90vw]">
                    <DialogHeader>
                      <DialogTitle>Add New Course</DialogTitle>
                      <DialogDescription>
                        Submit a new course for manager approval.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="courseNo" className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Course No / Code</Label>
                        <Input 
                          id="courseNo" 
                          placeholder="e.g. CS-101" 
                          className="bg-muted/50 border-none h-11 rounded-xl focus-visible:ring-1 ring-primary/20"
                          value={courseData.courseNo}
                          onChange={(e) => setCourseData({...courseData, courseNo: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="degreeName" className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Degree Name</Label>
                        <Input 
                          id="degreeName" 
                          placeholder="e.g. BS Computer Science" 
                          className="bg-muted/50 border-none h-11 rounded-xl focus-visible:ring-1 ring-primary/20"
                          value={courseData.degreeName}
                          onChange={(e) => setCourseData({...courseData, degreeName: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="university" className="text-xs uppercase tracking-wider text-muted-foreground font-bold">University</Label>
                        <Input 
                          id="university" 
                          placeholder="e.g. NUST" 
                          className="bg-muted/50 border-none h-11 rounded-xl focus-visible:ring-1 ring-primary/20"
                          value={courseData.university}
                          onChange={(e) => setCourseData({...courseData, university: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="semesterNo" className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Semester No</Label>
                        <Input 
                          id="semesterNo" 
                          placeholder="e.g. 3rd Semester" 
                          className="bg-muted/50 border-none h-11 rounded-xl focus-visible:ring-1 ring-primary/20"
                          value={courseData.semesterNo}
                          onChange={(e) => setCourseData({...courseData, semesterNo: e.target.value})}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAddCourse} disabled={isSubmittingCourse} className="w-full h-11 rounded-xl">
                        {isSubmittingCourse ? "Submitting..." : "Submit for Approval"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <Select onValueChange={(v) => setFormData({...formData, course: v})}>
                <SelectTrigger className="bg-background/80 backdrop-blur-sm border-border/50 h-12 rounded-xl">
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

          {formData.course && (
            <div className="space-y-6 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input 
                  placeholder="What's your question or post about?" 
                  className="font-medium text-lg border-none px-4 h-14 bg-background/80 backdrop-blur-sm rounded-xl focus-visible:ring-1 ring-primary/20 placeholder:text-muted-foreground/50" 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Textarea 
                  placeholder="Describe your question or notes in detail..." 
                  className="min-h-[200px] border-none p-4 bg-background/80 backdrop-blur-sm rounded-xl focus-visible:ring-1 ring-primary/20 resize-none text-base" 
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                />
              </div>

              <div className="pt-4 border-t border-border/50 space-y-4">
                <div className="flex items-center justify-between bg-background/80 backdrop-blur-sm p-4 rounded-xl border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 text-primary rounded-lg">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Sell Notes</h3>
                      <p className="text-xs text-muted-foreground">Attach study materials for sale</p>
                    </div>
                  </div>
                  <Switch 
                    checked={formData.sellNotes} 
                    onCheckedChange={(c) => setFormData({...formData, sellNotes: c})} 
                  />
                </div>

                {formData.sellNotes && (
                  <div className="space-y-3 p-4 bg-muted/30 rounded-xl border border-border/50 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-2">
                      <Label>Price (Rs.)</Label>
                      <Input 
                        type="number" 
                        placeholder="e.g. 500" 
                        className="bg-background"
                        value={formData.notesPrice}
                        onChange={(e) => setFormData({...formData, notesPrice: e.target.value})}
                      />
                      {formData.notesPrice && (
                        <p className="text-[10px] text-muted-foreground font-medium">
                          You will receive Rs. {Math.round(parseInt(formData.notesPrice) * 0.9)} (10% platform fee applied)
                        </p>
                      )}
                    </div>
                    <Button variant="outline" className="w-full justify-start gap-2 text-muted-foreground border-dashed bg-background">
                      <ImagePlus className="w-4 h-4" />
                      Upload PDF / Document
                    </Button>
                  </div>
                )}

                <Button variant="outline" className="w-full justify-start gap-2 h-12 text-muted-foreground border-dashed bg-background/50">
                  <ImagePlus className="w-5 h-5" />
                  Add photos or screenshots
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}
