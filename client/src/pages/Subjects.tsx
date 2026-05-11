import React, { useState } from "react";
import { BottomNav } from "@/components/layout/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Calculator, FlaskConical, Globe, Languages, Laptop, Plus, ChevronRight, FileText, Download, Banknote, CreditCard, Landmark, ArrowLeft } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const EDUCATION_HIERARCHY = {
  "Matriculation / O-Levels": {
    "Science Group": ["Mathematics", "Physics", "Chemistry", "Biology", "Computer Science"],
    "Arts Group": ["General Math", "General Science", "Education", "Islamic Studies"]
  },
  "Intermediate / A-Levels": {
    "Pre-Engineering": ["Mathematics", "Physics", "Chemistry"],
    "Pre-Medical": ["Biology", "Physics", "Chemistry"],
    "ICS": ["Mathematics", "Physics", "Computer Science"],
    "I.Com": ["Accounting", "Economics", "Business Math"],
    "FA": ["Civics", "Education", "Islamic Studies"]
  },
  "Bachelors (BS)": {
    "Computer Science (CS)": ["Programming Fundamentals", "Data Structures", "Database Systems", "Operating Systems", "Artificial Intelligence", "Computer Networks"],
    "Software Engineering (SE)": ["Software Requirement Engineering", "Software Design", "Web Engineering"],
    "Artificial Intelligence (AI)": ["Machine Learning", "Deep Learning", "Computer Vision"],
    "Electrical Engineering (EE)": ["Linear Circuit Analysis", "Digital Logic Design (DLD)", "Signals & Systems", "Control Systems"],
    "Mechanical Engineering (ME)": ["Thermodynamics", "Fluid Mechanics", "Engineering Mechanics"],
    "BBA": ["Principles of Management", "Financial Accounting", "Marketing Management"],
    "MBBS": ["Anatomy", "Physiology", "Biochemistry", "Pathology", "Pharmacology", "Medicine"],
    "BDS": ["Oral Biology", "Oral Pathology", "Dental Materials"]
  },
  "Masters (MS/MPhil)": {
    "Computer Science": ["Advanced Algorithms", "Advanced Operating Systems", "Research Methodology"],
    "Electrical Engineering": ["Advanced Control Systems", "Stochastic Processes"],
    "MBA": ["Strategic Management", "Corporate Finance"]
  },
  "Doctorate (PhD)": {
    "Computer Science": ["PhD Seminar", "Independent Research"],
    "Management": ["Advanced Research Methods", "Organizational Theory"]
  }
};

export default function Subjects() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Cascading Selection State
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [selectedDegree, setSelectedDegree] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");

  // Payment/Sell Notes Dialogs
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isSellOpen, setIsSellOpen] = useState(false);
  const [sellData, setSellData] = useState({ title: "", price: "" });

  const [courseData, setCourseData] = useState({
    courseNo: "",
    degreeName: "",
    university: "",
    semesterNo: ""
  });

  const availableDegrees = selectedLevel ? Object.keys(EDUCATION_HIERARCHY[selectedLevel as keyof typeof EDUCATION_HIERARCHY]) : [];
  const availableCourses = (selectedLevel && selectedDegree) ? EDUCATION_HIERARCHY[selectedLevel as keyof typeof EDUCATION_HIERARCHY][selectedDegree as keyof typeof EDUCATION_HIERARCHY[any]] : [];

  const handleLevelChange = (val: string) => {
    setSelectedLevel(val);
    setSelectedDegree("");
    setSelectedCourse("");
  };

  const handleDegreeChange = (val: string) => {
    setSelectedDegree(val);
    setSelectedCourse("");
  };

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

  const handlePurchaseNotes = () => {
    toast({ title: "Payment Processing", description: "Redirecting to payment gateway..." });
    setTimeout(() => {
      toast({ title: "Purchase Successful", description: "Notes have been added to your study materials." });
      setIsPaymentOpen(false);
    }, 2000);
  };

  const handleSellNotes = () => {
    toast({ title: "Notes Uploaded", description: "Your notes have been listed for sale!" });
    setIsSellOpen(false);
    setSellData({ title: "", price: "" });
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
        <div className="relative z-10 flex items-center gap-3">
          {selectedCourse && (
             <Button variant="ghost" size="icon" className="-ml-2" onClick={() => setSelectedCourse("")}>
               <ArrowLeft className="w-6 h-6" />
             </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{selectedCourse ? selectedCourse : "Courses & Notes"}</h1>
            <p className="text-muted-foreground mt-1 text-sm">{selectedCourse ? "Resources & materials" : "Browse our course library"}</p>
          </div>
        </div>
        {!selectedCourse && (
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
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-6 relative z-10 pb-24">
        {!selectedCourse ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">1. Choose Education Level</Label>
              <Select value={selectedLevel} onValueChange={handleLevelChange}>
                <SelectTrigger className="w-full h-14 bg-background/80 backdrop-blur-sm border-border/50 rounded-2xl shadow-sm text-base">
                  <SelectValue placeholder="Select Level" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(EDUCATION_HIERARCHY).map(level => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedLevel && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">2. Choose Degree / Program</Label>
                <Select value={selectedDegree} onValueChange={handleDegreeChange}>
                  <SelectTrigger className="w-full h-14 bg-background/80 backdrop-blur-sm border-border/50 rounded-2xl shadow-sm text-base">
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

            {selectedLevel && selectedDegree && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">3. Select Course to View Notes</Label>
                <div className="grid grid-cols-1 gap-3">
                  {availableCourses.map((course: string) => (
                    <Button 
                      key={course} 
                      variant="outline" 
                      className="w-full justify-between h-14 bg-background/60 backdrop-blur-sm border-border/50 rounded-2xl hover:bg-primary/5 hover:border-primary/30 transition-all font-medium text-base shadow-sm"
                      onClick={() => setSelectedCourse(course)}
                    >
                      {course}
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Available Notes</h2>
              <Dialog open={isSellOpen} onOpenChange={setIsSellOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="rounded-xl px-4 shadow-sm">
                    <Plus className="w-4 h-4 mr-2" /> Sell Notes
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] rounded-2xl w-[90vw]">
                  <DialogHeader>
                    <DialogTitle>Sell Your Notes</DialogTitle>
                    <DialogDescription>
                      Upload your study materials and set a price. The platform charges a 10% fee on all sales.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4 space-y-4">
                    <div className="space-y-2">
                      <Label>Notes Title</Label>
                      <Input 
                        placeholder="e.g. Midterm Preparation Guide" 
                        value={sellData.title}
                        onChange={(e) => setSellData({...sellData, title: e.target.value})}
                        className="h-12 bg-muted/50 border-none rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Price (Rs.)</Label>
                      <Input 
                        type="number" 
                        placeholder="e.g. 500" 
                        value={sellData.price}
                        onChange={(e) => setSellData({...sellData, price: e.target.value})}
                        className="h-12 bg-muted/50 border-none rounded-xl"
                      />
                      {sellData.price && (
                        <p className="text-xs text-muted-foreground mt-1 font-medium">
                          You will receive Rs. {Math.round(parseInt(sellData.price) * 0.9)}
                        </p>
                      )}
                    </div>
                    <Button variant="outline" className="w-full justify-start gap-2 h-14 text-muted-foreground border-dashed bg-muted/30 rounded-xl">
                      <FileText className="w-5 h-5" />
                      Upload PDF/Doc File
                    </Button>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleSellNotes} className="w-full h-12 rounded-xl" disabled={!sellData.title || !sellData.price}>
                      List for Sale
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Mocked Notes Cards */}
            <div className="space-y-4">
              {[
                { title: "Midterm Crash Course PDF", author: "Ali Khan", price: "500", rating: "4.8" },
                { title: "Complete Handwritten Notes", author: "Sara Ahmed", price: "800", rating: "4.9" },
                { title: "Past Papers Solved (2018-2023)", author: "Hamza Malik", price: "400", rating: "4.5" },
              ].map((note, i) => (
                <Card key={i} className="border-border/50 bg-background/80 backdrop-blur-sm shadow-sm rounded-2xl overflow-hidden">
                  <CardContent className="p-5 flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold leading-tight line-clamp-2">{note.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1">By {note.author} • ⭐ {note.rating}</p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="font-bold text-lg text-primary">Rs. {note.price}</span>
                      </div>
                    </div>
                    
                    <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full rounded-xl gap-2 font-medium">
                          <Download className="w-4 h-4" /> Purchase & Download
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px] rounded-2xl w-[90vw]">
                        <DialogHeader>
                          <DialogTitle>Purchase Notes</DialogTitle>
                          <DialogDescription>
                            Buy '{note.title}' for Rs. {note.price}. You will be able to download them immediately.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                          <div className="space-y-2">
                            <Label>Select Payment Method</Label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                              <SelectTrigger className="h-12 bg-muted/50 border-none rounded-xl">
                                <SelectValue placeholder="Choose payment option" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="jazzcash">
                                  <div className="flex items-center gap-2">
                                    <Banknote className="w-4 h-4 text-orange-500" /> JazzCash
                                  </div>
                                </SelectItem>
                                <SelectItem value="easypaisa">
                                  <div className="flex items-center gap-2">
                                    <Banknote className="w-4 h-4 text-green-500" /> EasyPaisa
                                  </div>
                                </SelectItem>
                                <SelectItem value="nayapay">
                                  <div className="flex items-center gap-2">
                                    <Banknote className="w-4 h-4 text-teal-500" /> NayaPay
                                  </div>
                                </SelectItem>
                                <SelectItem value="card">
                                  <div className="flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-blue-500" /> Credit / Debit Card
                                  </div>
                                </SelectItem>
                                <SelectItem value="bank">
                                  <div className="flex items-center gap-2">
                                    <Landmark className="w-4 h-4 text-purple-500" /> Bank Transfer
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {paymentMethod && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                              <Label>
                                {paymentMethod === 'card' ? 'Card Number' : 
                                 paymentMethod === 'bank' ? 'IBAN Number' : 'Account/Mobile Number'}
                              </Label>
                              <Input 
                                placeholder={paymentMethod === 'card' ? '0000 0000 0000 0000' : '03XX XXXXXXX'} 
                                className="h-12 bg-muted/50 border-none rounded-xl"
                              />
                            </div>
                          )}
                        </div>
                        <DialogFooter>
                          <Button onClick={handlePurchaseNotes} className="w-full h-12 rounded-xl" disabled={!paymentMethod}>
                            Pay Rs. {note.price}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
