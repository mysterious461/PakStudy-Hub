import React, { useState } from "react";
import { BottomNav } from "@/components/layout/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, ArrowLeft, UploadCloud } from "lucide-react";
import { EDUCATION_HIERARCHY } from "@/lib/educationData";

export default function Sell() {
  const { toast } = useToast();
  
  // Cascading Selection State
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [selectedDegree, setSelectedDegree] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");

  const [sellData, setSellData] = useState({ title: "", price: "" });

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

  const handleSellNotes = () => {
    toast({ title: "Notes Uploaded", description: "Your notes have been listed for sale!" });
    setSellData({ title: "", price: "" });
    setSelectedLevel("");
    setSelectedDegree("");
    setSelectedCourse("");
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
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Sell Notes</h1>
            <p className="text-muted-foreground mt-1 text-sm">Upload study materials and earn</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 relative z-10 pb-24 space-y-6">
        <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden bg-background/80 backdrop-blur-sm">
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">1. Education Level</Label>
                <Select value={selectedLevel} onValueChange={handleLevelChange}>
                  <SelectTrigger className="w-full h-12 bg-muted/30 border-none rounded-xl">
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
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">2. Degree / Program</Label>
                  <Select value={selectedDegree} onValueChange={handleDegreeChange}>
                    <SelectTrigger className="w-full h-12 bg-muted/30 border-none rounded-xl">
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
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">3. Course</Label>
                  <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                    <SelectTrigger className="w-full h-12 bg-muted/30 border-none rounded-xl">
                      <SelectValue placeholder="Select Course" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCourses.map((course: string) => (
                        <SelectItem key={course} value={course}>{course}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {selectedCourse && (
              <div className="space-y-4 pt-4 border-t border-border/50 animate-in fade-in slide-in-from-top-4">
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
                      You will receive Rs. {Math.round(parseInt(sellData.price) * 0.9)} in your wallet (10% platform fee)
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Upload File</Label>
                  <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:bg-muted/30 transition-colors cursor-pointer flex flex-col items-center justify-center gap-3">
                    <div className="p-3 bg-primary/10 text-primary rounded-full">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Tap to upload PDF/Doc</p>
                      <p className="text-xs text-muted-foreground mt-1">Max file size: 25MB</p>
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={handleSellNotes} 
                  className="w-full h-14 rounded-xl text-base mt-2" 
                  disabled={!sellData.title || !sellData.price}
                >
                  List Notes for Sale
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}