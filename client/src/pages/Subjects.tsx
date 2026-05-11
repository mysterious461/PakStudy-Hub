import React, { useState } from "react";
import { BottomNav } from "@/components/layout/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpen, Calculator, FlaskConical, Globe, Languages, Laptop, Plus } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const degreePrograms = [
  {
    degree: "Matriculation / O-Levels",
    courses: [
      { name: "Mathematics", icon: Calculator, color: "bg-blue-100 text-blue-600" },
      { name: "Physics", icon: FlaskConical, color: "bg-purple-100 text-purple-600" },
      { name: "Chemistry", icon: FlaskConical, color: "bg-green-100 text-green-600" },
      { name: "Computer Science", icon: Laptop, color: "bg-orange-100 text-orange-600" },
      { name: "English", icon: Languages, color: "bg-pink-100 text-pink-600" },
      { name: "Urdu", icon: Languages, color: "bg-emerald-100 text-emerald-600" },
      { name: "Pak Studies", icon: Globe, color: "bg-teal-100 text-teal-600" },
      { name: "Islamiyat", icon: BookOpen, color: "bg-indigo-100 text-indigo-600" },
    ]
  },
  {
    degree: "Intermediate / A-Levels (FSc/ICS)",
    courses: [
      { name: "Mathematics", icon: Calculator, color: "bg-blue-100 text-blue-600" },
      { name: "Physics", icon: FlaskConical, color: "bg-purple-100 text-purple-600" },
      { name: "Chemistry", icon: FlaskConical, color: "bg-green-100 text-green-600" },
      { name: "Computer Science", icon: Laptop, color: "bg-orange-100 text-orange-600" },
      { name: "Biology", icon: FlaskConical, color: "bg-rose-100 text-rose-600" },
      { name: "English", icon: Languages, color: "bg-pink-100 text-pink-600" },
    ]
  },
  {
    degree: "BS Computer Science / SE",
    courses: [
      { name: "Programming Fundamentals", icon: Laptop, color: "bg-orange-100 text-orange-600" },
      { name: "Object Oriented Programming", icon: Laptop, color: "bg-orange-100 text-orange-600" },
      { name: "Data Structures & Algorithms", icon: Laptop, color: "bg-blue-100 text-blue-600" },
      { name: "Database Systems", icon: Laptop, color: "bg-purple-100 text-purple-600" },
      { name: "Artificial Intelligence", icon: Laptop, color: "bg-green-100 text-green-600" },
      { name: "Operating Systems", icon: Laptop, color: "bg-pink-100 text-pink-600" },
      { name: "Computer Networks", icon: Laptop, color: "bg-teal-100 text-teal-600" },
    ]
  },
  {
    degree: "BS Electrical Engineering",
    courses: [
      { name: "Linear Circuit Analysis", icon: Calculator, color: "bg-blue-100 text-blue-600" },
      { name: "Digital Logic Design (DLD)", icon: Laptop, color: "bg-purple-100 text-purple-600" },
      { name: "Electronic Devices & Circuits", icon: FlaskConical, color: "bg-green-100 text-green-600" },
      { name: "Signals & Systems", icon: Calculator, color: "bg-orange-100 text-orange-600" },
      { name: "Microprocessor Systems", icon: Laptop, color: "bg-pink-100 text-pink-600" },
      { name: "Control Systems", icon: Calculator, color: "bg-teal-100 text-teal-600" },
    ]
  },
  {
    degree: "MBBS / BDS (Medical)",
    courses: [
      { name: "Anatomy", icon: FlaskConical, color: "bg-rose-100 text-rose-600" },
      { name: "Physiology", icon: FlaskConical, color: "bg-blue-100 text-blue-600" },
      { name: "Biochemistry", icon: FlaskConical, color: "bg-green-100 text-green-600" },
      { name: "Pharmacology", icon: FlaskConical, color: "bg-purple-100 text-purple-600" },
      { name: "Pathology", icon: FlaskConical, color: "bg-orange-100 text-orange-600" },
      { name: "Medicine", icon: FlaskConical, color: "bg-teal-100 text-teal-600" },
    ]
  }
];

export default function Subjects() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [courseData, setCourseData] = useState({
    courseNo: "",
    degreeName: "",
    university: "",
    semesterNo: ""
  });

  const handleAddCourse = async () => {
    if (!courseData.courseNo || !courseData.degreeName || !courseData.university || !courseData.semesterNo) {
      toast({
        title: "Missing fields",
        description: "Please fill in all the details.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
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
      setIsDialogOpen(false);
      setCourseData({ courseNo: "", degreeName: "", university: "", semesterNo: "" });
    } catch (error: any) {
      toast({
        title: "Error submitting course",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-muted/10 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src="/src/assets/images/subjects-bg.jpg" alt="Background" className="w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-background/90 backdrop-blur-[2px]" />
      </div>

      <header className="px-6 py-6 sticky top-0 z-10 border-b border-border/50 relative overflow-hidden flex items-center justify-between">
        <div className="absolute inset-0 z-0">
          <img src="/src/assets/images/header-bg.jpg" alt="Background" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />
        </div>
        <div className="relative z-10">
          <h1 className="text-2xl font-bold tracking-tight">Browse Subjects</h1>
          <p className="text-muted-foreground mt-1 text-sm">Select a subject to view resources</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="icon" className="relative z-10 rounded-full h-10 w-10 shadow-lg shadow-primary/20">
              <Plus className="w-5 h-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-2xl w-[90vw]">
            <DialogHeader>
              <DialogTitle>Add New Course</DialogTitle>
              <DialogDescription>
                Submit a new course for manager approval. It will appear here once approved.
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
              <Button onClick={handleAddCourse} disabled={isSubmitting} className="w-full h-11 rounded-xl">
                {isSubmitting ? "Submitting..." : "Submit for Approval"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="flex-1 overflow-y-auto p-6 relative z-10">
        <Accordion type="single" collapsible defaultValue={degreePrograms[0].degree} className="space-y-4">
          {degreePrograms.map((program) => (
            <AccordionItem key={program.degree} value={program.degree} className="border border-border/50 bg-background/60 backdrop-blur-sm rounded-2xl overflow-hidden shadow-sm">
              <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/30">
                <span className="font-semibold text-left">{program.degree}</span>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5">
                <div className="grid grid-cols-2 gap-4 mt-2">
                  {program.courses.map((course) => (
                    <Card key={course.name} className="hover:shadow-md transition-shadow cursor-pointer border-border/50">
                      <CardContent className="flex flex-col items-center justify-center p-4 text-center space-y-3">
                        <div className={`p-3 rounded-full ${course.color}`}>
                          <course.icon className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-medium text-sm line-clamp-2">{course.name}</h3>
                          <Badge variant="secondary" className="text-[9px]">120+ Resources</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <BottomNav />
    </div>
  );
}
