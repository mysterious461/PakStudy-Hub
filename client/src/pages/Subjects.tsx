import React, { useEffect, useState } from "react";
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
import { auth } from "@/lib/firebase";
import { EDUCATION_HIERARCHY } from "@/lib/educationData";
import { apiRequest } from "@/lib/queryClient";

export default function Subjects() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Cascading Selection State
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [selectedDegree, setSelectedDegree] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");

  // Payment/Sell Notes Dialogs
  const [paymentOpenFor, setPaymentOpenFor] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  
  // Search & Sort State
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("popular");
  const [notes, setNotes] = useState<any[]>([]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (selectedCourse) params.set("course", selectedCourse);

    fetch(`/api/notes?${params.toString()}`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Could not load notes");
        return res.json();
      })
      .then(setNotes)
      .catch((error) => {
        console.error(error);
        setNotes([]);
      });
  }, [searchQuery, selectedCourse]);

  const selectedDegreeMap = selectedLevel
    ? EDUCATION_HIERARCHY[selectedLevel as keyof typeof EDUCATION_HIERARCHY] as Record<string, string[]>
    : {};
  const availableDegrees = Object.keys(selectedDegreeMap);
  const availableCourses = selectedDegree ? selectedDegreeMap[selectedDegree] || [] : [];

  const handleLevelChange = (val: string) => {
    setSelectedLevel(val === "all" ? "" : val);
    setSelectedDegree("");
    setSelectedCourse("");
  };

  const handleDegreeChange = (val: string) => {
    setSelectedDegree(val === "all" ? "" : val);
    setSelectedCourse("");
  };

  const handleCourseChange = (val: string) => {
    setSelectedCourse(val === "all" ? "" : val);
  };

  const handlePurchaseNotes = async (noteId?: string) => {
    if (!auth.currentUser || !noteId) {
      toast({ title: "Please sign in to purchase notes", variant: "destructive" });
      return;
    }
    toast({ title: "Payment Processing", description: "Redirecting to payment gateway..." });
    try {
      const res = await apiRequest("POST", "/api/notes/purchase", {
        noteId,
      });
      const payment = await res.json();
      if (payment.checkoutUrl) {
        window.location.href = payment.checkoutUrl;
        return;
      }
      toast({ title: "Payment Started", description: "Complete the secure payment to unlock these notes." });
      setPaymentOpenFor(null);
    } catch (error: any) {
      toast({ title: "Purchase Failed", description: error.message, variant: "destructive" });
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
        <div className="relative z-10 flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Buy Notes</h1>
            <p className="text-muted-foreground mt-1 text-sm">Purchase study materials from peers</p>
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
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search notes..." 
                className="pl-9 h-10 rounded-xl bg-background/80 backdrop-blur-sm border-border/50 focus-visible:ring-1 focus-visible:ring-primary/30"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[110px] h-10 text-xs rounded-xl bg-background border-border/50">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Top Rated</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price-low">Price: Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Inline filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 scrollbar-none">
             <Select value={selectedLevel || "all"} onValueChange={handleLevelChange}>
                <SelectTrigger className="min-w-[140px] h-9 text-xs rounded-full bg-background border-border/50 shadow-sm whitespace-nowrap">
                  <SelectValue placeholder="Education Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {Object.keys(EDUCATION_HIERARCHY).map(level => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedLevel && (
                <Select value={selectedDegree || "all"} onValueChange={handleDegreeChange}>
                  <SelectTrigger className="min-w-[140px] h-9 text-xs rounded-full bg-background border-border/50 shadow-sm whitespace-nowrap">
                    <SelectValue placeholder="Degree/Program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Degrees</SelectItem>
                    {availableDegrees.map(degree => (
                      <SelectItem key={degree} value={degree}>{degree}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {selectedLevel && selectedDegree && (
                <Select value={selectedCourse || "all"} onValueChange={handleCourseChange}>
                  <SelectTrigger className="min-w-[140px] h-9 text-xs rounded-full bg-background border-border/50 shadow-sm whitespace-nowrap">
                    <SelectValue placeholder="Course/Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {availableCourses.map((course: string) => (
                      <SelectItem key={course} value={course}>{course}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
          </div>
        </div>

        {/* Notes Cards */}
        <div className="space-y-4">
          {notes.map((note, i) => (
            <Card key={i} className="border-border/50 bg-background/80 backdrop-blur-sm shadow-sm rounded-2xl overflow-hidden hover:border-primary/20 transition-all">
              <CardContent className="p-5 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold leading-tight line-clamp-2">{note.title}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground">By {note.sellerName || note.userName} • ★ {note.rating}</p>
                      <Badge variant="secondary" className="mt-2 text-[9px] uppercase tracking-wider px-2 py-0.5">{note.course}</Badge>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="font-bold text-lg text-primary">Rs. {note.notesPrice}</span>
                  </div>
                </div>
                    
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full rounded-xl gap-2 font-medium">
                            <FileText className="w-4 h-4" /> Preview
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] rounded-2xl w-[90vw] max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{note.title}</DialogTitle>
                            <DialogDescription>
                              By {note.sellerName || note.userName} • ★ {note.rating} ({note.purchases || 0} purchases)
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4 space-y-6">
                            <div className="space-y-2">
                              <h4 className="font-semibold text-sm">Preview</h4>
                              <div className="h-40 bg-muted/50 rounded-xl border border-border flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/90" />
                                <div className="text-center z-10 px-4">
                                  <p className="text-xs text-muted-foreground mb-2">Sample page from the notes...</p>
                                  <div className="w-full h-2 bg-muted-foreground/20 rounded-full mb-2"></div>
                                  <div className="w-3/4 h-2 bg-muted-foreground/20 rounded-full mb-2 mx-auto"></div>
                                  <div className="w-5/6 h-2 bg-muted-foreground/20 rounded-full mx-auto"></div>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <h4 className="font-semibold text-sm">Top Reviews</h4>
                              <div className="space-y-3">
                                <div className="bg-muted/30 p-3 rounded-xl text-sm">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-semibold text-xs">Ayesha M.</span>
                                    <span className="text-[10px] text-muted-foreground">⭐ 5.0</span>
                                  </div>
                                  <p className="text-muted-foreground text-xs leading-relaxed">"These notes saved my life for the midterm! Very concise and easy to understand."</p>
                                </div>
                                <div className="bg-muted/30 p-3 rounded-xl text-sm">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-semibold text-xs">Bilal K.</span>
                                    <span className="text-[10px] text-muted-foreground">⭐ 4.5</span>
                                  </div>
                                  <p className="text-muted-foreground text-xs leading-relaxed">"Good coverage of all topics, handwriting is neat. Wish it had more examples though."</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button className="w-full rounded-xl" onClick={() => setPaymentOpenFor(note.title)}>
                              Buy for Rs. {note.notesPrice}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={paymentOpenFor === note.title} onOpenChange={(open) => setPaymentOpenFor(open ? note.title : null)}>
                        <DialogTrigger asChild>
                          <Button className="w-full rounded-xl gap-2 font-medium bg-primary text-primary-foreground hover:bg-primary/90">
                            <Download className="w-4 h-4" /> Buy
                          </Button>
                        </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px] rounded-2xl w-[90vw]">
                        <DialogHeader>
                          <DialogTitle>Purchase Notes</DialogTitle>
                          <DialogDescription>
                            Buy '{note.title}' for Rs. {note.notesPrice}. You will be able to download them immediately.
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
                          <Button onClick={() => handlePurchaseNotes(note.id)} className="w-full h-12 rounded-xl" disabled={!paymentMethod}>
                            Pay Rs. {note.notesPrice}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
      </div>
    </div>
  );
}
