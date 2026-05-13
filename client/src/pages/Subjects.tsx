import React, { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Calculator, FlaskConical, Globe, Languages, Laptop, Plus, ChevronRight, FileText, Download, Banknote, CreditCard, Landmark, ArrowLeft, X, ShoppingBag, Search } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { EDUCATION_HIERARCHY } from "@/lib/educationData";

export default function Subjects() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Cascading Selection State
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [selectedDegree, setSelectedDegree] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");

  // Payment/Sell Notes Dialogs
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  
  // Search & Sort State
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("popular");

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

  const handlePurchaseNotes = () => {
    toast({ title: "Payment Processing", description: "Redirecting to payment gateway..." });
    setTimeout(() => {
      toast({ title: "Purchase Successful", description: "Notes have been added to your study materials." });
      setIsPaymentOpen(false);
    }, 2000);
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
            <h1 className="text-2xl font-bold tracking-tight">{selectedCourse ? selectedCourse : "Buy Notes"}</h1>
            <p className="text-muted-foreground mt-1 text-sm">{selectedCourse ? "Resources & materials" : "Purchase study materials from peers"}</p>
          </div>
        </div>
        <div className="relative z-10 flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-full bg-primary/10 text-primary hover:bg-primary/20" onClick={() => setLocation("/library")}>
            <ShoppingBag className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full bg-muted/50 hover:bg-muted" onClick={() => setLocation("/home")}>
            <X className="w-5 h-5" />
          </Button>
        </div>
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
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Available Notes</h2>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px] h-9 text-xs rounded-xl bg-background border-border/50">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popular">Top Rated</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search in this course..." 
                  className="pl-9 h-10 rounded-xl bg-background/80 backdrop-blur-sm border-border/50 focus-visible:ring-1 focus-visible:ring-primary/30"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Mocked Notes Cards */}
            <div className="space-y-4">
              {[
                { title: "Midterm Crash Course PDF", author: "Ali Khan", price: "500", rating: "4.8" },
                { title: "Complete Handwritten Notes", author: "Sara Ahmed", price: "800", rating: "4.9" },
                { title: "Past Papers Solved (2018-2023)", author: "Hamza Malik", price: "400", rating: "4.5" },
              ]
              .filter(note => note.title.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((note, i) => (
                <Card key={i} className="border-border/50 bg-background/80 backdrop-blur-sm shadow-sm rounded-2xl overflow-hidden hover:border-primary/20 transition-all">
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
                                <SelectItem value="card">
                                  <div className="flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-blue-500" /> Credit / Debit Card (App Pay)
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                              Payment is processed securely by the app. The seller will receive the amount minus a 10% platform fee in their wallet.
                            </p>
                          </div>

                          {paymentMethod && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                              <Label>Card Number</Label>
                              <Input 
                                placeholder="0000 0000 0000 0000" 
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
    </div>
  );
}
