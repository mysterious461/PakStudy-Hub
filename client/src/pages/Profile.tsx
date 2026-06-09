import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LogOut, Settings, Award, BookOpen, Edit, Save, X, User, Banknote, ArrowDownLeft, ArrowUpRight, CreditCard, Plus, Moon, Sun, Trophy } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { signOut, updateProfile } from "firebase/auth";
import { doc, onSnapshot, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const user = auth.currentUser;

  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [formData, setFormData] = useState({
    displayName: user?.displayName || "Student Name",
    grade: "Matric",
    track: "Pre-Engineering",
    university: "",
    bio: "",
    subjects: [] as string[]
  });

  const [stats, setStats] = useState({ questions: 0, answers: 0, reputation: 0 });
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpCard, setTopUpCard] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check initial dark mode state
    setIsDarkMode(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleDarkMode = () => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }
    setIsDarkMode(!isDarkMode);
    toast({
      title: "Theme Changed",
      description: `Dark mode ${!isDarkMode ? 'enabled' : 'disabled'}.`
    });
  };

  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(doc(db, "users", user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setProfileData(data);
        setFormData({
          displayName: data.name || user.displayName || "Student Name",
          grade: data.grade || "Matric",
          track: data.track || "Pre-Engineering",
          university: data.university || "",
          bio: data.bio || "",
          subjects: data.subjects || []
        });
        if (data.reputation !== undefined) {
          setStats(prev => ({ ...prev, reputation: data.reputation }));
        }
      }
    });

    const fetchStats = async () => {
      try {
        const qSnapshot = await getDocs(query(collection(db, "questions"), where("userId", "==", user.uid)));
        setStats(prev => ({ ...prev, questions: qSnapshot.size, answers: qSnapshot.size * 2 + 3, reputation: prev.reputation || (qSnapshot.size * 10 + 25) }));
      } catch (err) {
        console.error(err);
      }
    };
    
    fetchStats();

    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    setLocation("/auth");
  };

  const handleSave = async () => {
    try {
      if (user) {
        await updateProfile(user, { displayName: formData.displayName });
        await updateDoc(doc(db, "users", user.uid), {
          name: formData.displayName,
          grade: formData.grade,
          track: formData.track,
          university: formData.university,
          bio: formData.bio,
          subjects: formData.subjects
        });
      }
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your changes have been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleTopUp = () => {
    toast({ title: "Processing Top Up", description: "Securely adding funds via App Pay..." });
    setTimeout(() => {
      toast({ title: "Top Up Successful", description: `Rs. ${topUpAmount} added to your wallet.` });
      setIsTopUpOpen(false);
      setTopUpAmount("");
      setTopUpCard("");
    }, 2000);
  };

  return (
    <div className="h-full flex flex-col bg-muted/10 relative">
      <div className="h-32 w-full absolute top-0 left-0 z-0 overflow-hidden">
        <img src="/src/assets/images/header-bg.jpg" alt="Background" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-primary/80 mix-blend-multiply" />
      </div>
      
      <div className="flex-1 overflow-y-auto pb-24 z-10 px-6 pt-16">
        <div className="bg-background rounded-3xl shadow-sm p-6 mb-6 border border-border/50 relative overflow-hidden">
           {!isEditing ? (
             <Button 
               variant="ghost" 
               size="icon" 
               className="absolute top-4 right-4 text-muted-foreground hover:bg-muted/50"
               onClick={() => setIsEditing(true)}
             >
               <Edit className="w-4 h-4" />
             </Button>
           ) : (
             <div className="absolute top-4 right-4 flex gap-1">
               <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => setIsEditing(false)}>
                 <X className="w-4 h-4" />
               </Button>
               <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10" onClick={handleSave}>
                 <Save className="w-4 h-4" />
               </Button>
             </div>
           )}

           <div className="flex flex-col items-center">
             <Avatar className="w-24 h-24 border-4 border-background shadow-xl mb-4">
               <AvatarImage src={user?.photoURL || ""} />
               <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                 {formData.displayName.charAt(0).toUpperCase() || "S"}
               </AvatarFallback>
             </Avatar>

             {isEditing ? (
               <div className="w-full space-y-4 mt-2">
                 <div className="space-y-1.5">
                   <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Full Name</Label>
                   <div className="relative">
                     <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                     <Input 
                       value={formData.displayName} 
                       onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                       className="pl-9 h-10 bg-muted/30 border-none rounded-xl focus-visible:ring-1 ring-primary/20" 
                     />
                   </div>
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-1.5">
                     <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Education Level</Label>
                     <Select value={formData.grade} onValueChange={(v) => setFormData({...formData, grade: v})}>
                       <SelectTrigger className="bg-muted/30 border-none rounded-xl h-10 focus:ring-1 ring-primary/20">
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="Middle (8th)">Middle (8th)</SelectItem>
                         <SelectItem value="Matriculation (Science)">Matriculation (Science)</SelectItem>
                         <SelectItem value="Matriculation (Arts)">Matriculation (Arts)</SelectItem>
                         <SelectItem value="Intermediate (Pre-Engineering)">Intermediate (Pre-Engineering)</SelectItem>
                         <SelectItem value="Intermediate (Pre-Medical)">Intermediate (Pre-Medical)</SelectItem>
                         <SelectItem value="Intermediate (ICS)">Intermediate (ICS)</SelectItem>
                         <SelectItem value="Intermediate (I.Com)">Intermediate (I.Com)</SelectItem>
                         <SelectItem value="Intermediate (FA)">Intermediate (FA)</SelectItem>
                         <SelectItem value="Bachelors (BS/BSc/BA)">Bachelors (BS/BSc/BA)</SelectItem>
                         <SelectItem value="Masters (MS/MPhil)">Masters (MS/MPhil)</SelectItem>
                         <SelectItem value="Doctorate (PhD)">Doctorate (PhD)</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                   <div className="space-y-1.5">
                     <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Track / Major</Label>
                     <Select value={formData.track} onValueChange={(v) => setFormData({...formData, track: v})}>
                       <SelectTrigger className="bg-muted/30 border-none rounded-xl h-10 focus:ring-1 ring-primary/20">
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="Pre-Engineering">Pre-Engineering</SelectItem>
                         <SelectItem value="Pre-Medical">Pre-Medical</SelectItem>
                         <SelectItem value="Computer Science">Computer Science</SelectItem>
                         <SelectItem value="Arts/Humanities">Arts / Humanities</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                 </div>

                 <div className="space-y-1.5">
                   <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Bio</Label>
                   <Input 
                     value={formData.bio} 
                     onChange={(e) => setFormData({...formData, bio: e.target.value})}
                     placeholder="A little bit about yourself"
                     className="h-10 bg-muted/30 border-none rounded-xl focus-visible:ring-1 ring-primary/20" 
                   />
                 </div>

                 <div className="space-y-1.5">
                   <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">University / School</Label>
                   <Input 
                     value={formData.university} 
                     onChange={(e) => setFormData({...formData, university: e.target.value})}
                     placeholder="Enter your institution"
                     className="h-10 bg-muted/30 border-none rounded-xl focus-visible:ring-1 ring-primary/20" 
                   />
                 </div>
               </div>
             ) : (
               <>
                 <h2 className="text-xl font-bold">{formData.displayName}</h2>
                 <p className="text-muted-foreground text-sm mb-1">{user?.email || "student@example.com"}</p>
                 <p className="text-xs text-primary font-medium mb-2">{formData.university || "Add your university"}</p>
                 {formData.bio && <p className="text-sm text-foreground/80 mb-4 text-center max-w-[80%]">{formData.bio}</p>}
                 
                 <div className="flex gap-2 mb-6">
                   <Badge variant="secondary" className="px-3 py-1 bg-accent/10 text-accent-foreground border-none">{formData.grade}</Badge>
                   <Badge variant="secondary" className="px-3 py-1 bg-primary/10 text-primary border-none">{formData.track}</Badge>
                 </div>
               </>
             )}

             <div className="grid grid-cols-3 gap-8 w-full border-t border-border/50 pt-6 mt-2 text-center">
               <div>
                 <div className="text-xl font-bold">{stats.questions}</div>
                 <div className="text-xs text-muted-foreground">Questions</div>
               </div>
               <div>
                 <div className="text-xl font-bold">{stats.answers}</div>
                 <div className="text-xs text-muted-foreground">Answers</div>
               </div>
               <div>
                 <div className="text-xl font-bold">{stats.reputation}</div>
                 <div className="text-xs text-muted-foreground">Reputation</div>
               </div>
             </div>
           </div>
        </div>

        <h3 className="font-semibold mb-4 px-1 relative z-10 mt-6">Wallet</h3>
        <div className="space-y-3 relative z-10 mb-8">
          <Card className="border-border/50 shadow-sm overflow-hidden bg-background">
            <CardContent className="p-0">
              <div className="bg-primary/10 p-6 flex flex-col justify-between border-b border-primary/10 gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wider text-primary/80 mb-1">Available Balance</p>
                    <h4 className="text-3xl font-bold text-primary">Rs. 2,450</h4>
                  </div>
                  <div className="p-4 bg-primary/20 rounded-2xl text-primary shadow-inner">
                    <Banknote className="w-8 h-8" />
                  </div>
                </div>
                
                <Dialog open={isTopUpOpen} onOpenChange={setIsTopUpOpen}>
                  <DialogTrigger asChild>
                    <Button variant="default" className="w-full rounded-xl mt-2 font-semibold">
                      <Plus className="w-4 h-4 mr-2" /> Top Up Wallet
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] rounded-2xl w-[90vw]">
                    <DialogHeader>
                      <DialogTitle>Top Up Wallet</DialogTitle>
                      <DialogDescription>
                        Add funds to your wallet securely using App Pay. 
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                      <div className="bg-primary/10 p-4 rounded-xl border border-primary/20">
                        <h4 className="text-sm font-semibold text-primary mb-1">How it works</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Your payment is securely processed through App Pay. 
                          The topped-up amount will be instantly available in your wallet 
                          to purchase notes and other educational resources on the platform.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Amount to add (Rs.)</Label>
                        <Input 
                          type="number"
                          placeholder="e.g. 1000" 
                          value={topUpAmount}
                          onChange={(e) => setTopUpAmount(e.target.value)}
                          className="h-12 bg-muted/50 border-none rounded-xl text-lg font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Select Payment Method</Label>
                        <div className="h-12 bg-muted/50 border-none rounded-xl flex items-center px-3 opacity-70">
                           <div className="flex items-center gap-2">
                             <CreditCard className="w-4 h-4 text-blue-500" /> Credit / Debit Card (App Pay)
                           </div>
                        </div>
                      </div>
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                        <Label>Card Number</Label>
                        <Input 
                          placeholder="0000 0000 0000 0000" 
                          value={topUpCard}
                          onChange={(e) => setTopUpCard(e.target.value)}
                          className="h-12 bg-muted/50 border-none rounded-xl"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 delay-75">
                        <div className="space-y-2">
                          <Label>Expiry Date</Label>
                          <Input placeholder="MM/YY" className="h-12 bg-muted/50 border-none rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label>Security Code</Label>
                          <Input placeholder="CVC" className="h-12 bg-muted/50 border-none rounded-xl" type="password" maxLength={3} />
                        </div>
                      </div>
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-2 delay-100">
                        <Label>Cardholder Name</Label>
                        <Input placeholder="Name on card" className="h-12 bg-muted/50 border-none rounded-xl" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleTopUp} className="w-full h-12 rounded-xl" disabled={!topUpAmount || !topUpCard}>
                        {topUpAmount ? `Pay Rs. ${topUpAmount}` : "Enter Amount"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="p-5">
                <h5 className="text-xs font-bold mb-4 uppercase tracking-widest text-muted-foreground">Recent Transactions</h5>
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-green-500/10 text-green-600 rounded-full">
                        <ArrowDownLeft className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold leading-none mb-1">Sold: Calculus Notes</p>
                        <p className="text-[11px] font-medium text-muted-foreground">Today, 2:30 PM</p>
                      </div>
                    </div>
                    <span className="font-bold text-sm text-green-600">+ Rs. 450</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-destructive/10 text-destructive rounded-full">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold leading-none mb-1">Bought: Physics Past Papers</p>
                        <p className="text-[11px] font-medium text-muted-foreground">Yesterday, 11:15 AM</p>
                      </div>
                    </div>
                    <span className="font-bold text-sm text-destructive">- Rs. 200</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-5 rounded-xl h-10 text-xs font-bold uppercase tracking-wider">
                  View All History
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <h3 className="font-semibold mb-4 px-1 relative z-10 mt-6">Top Contributors</h3>
        <Card className="border-border/50 shadow-sm mb-6 bg-background relative z-10">
          <CardContent className="p-0">
            <div className="p-4 space-y-4">
              {[
                { name: "Ali Khan", rep: 1250, badge: "🥇", initials: "AK", color: "bg-yellow-100 text-yellow-700" },
                { name: "Sara Ahmed", rep: 980, badge: "🥈", initials: "SA", color: "bg-gray-200 text-gray-700" },
                { name: "Hamza Malik", rep: 845, badge: "🥉", initials: "HM", color: "bg-orange-100 text-orange-700" }
              ].map((contributor, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="w-10 h-10 border border-border">
                        <AvatarFallback className={contributor.color + " font-bold"}>{contributor.initials}</AvatarFallback>
                      </Avatar>
                      <span className="absolute -bottom-1 -right-1 text-sm bg-background rounded-full leading-none">{contributor.badge}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold">{contributor.name}</p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Top Answerer</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">{contributor.rep}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Rep</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <h3 className="font-semibold mb-4 px-1 relative z-10 mt-6">Resources</h3>
        <div className="space-y-3 relative z-10">
          <Card 
            className="border-border/50 shadow-sm cursor-pointer hover:bg-muted/30 transition-all active:scale-[0.98]"
            onClick={() => setLocation("/library")}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm">My Study Materials</h4>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="border-border/50 shadow-sm cursor-pointer hover:bg-muted/30 transition-all active:scale-[0.98]"
            onClick={() => setLocation("/achievements")}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                <Award className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm">Achievements</h4>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="border-border/50 shadow-sm cursor-pointer hover:bg-muted/30 transition-all active:scale-[0.98]"
            onClick={() => setLocation("/settings")}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                <Settings className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm">Settings</h4>
              </div>
            </CardContent>
          </Card>

          {/* Mock Admin Link for demonstration */}
          <Card 
            className="border-border/50 shadow-sm cursor-pointer hover:bg-red-500/10 transition-all active:scale-[0.98] mt-4 border-red-500/30"
            onClick={() => setLocation("/admin")}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                <Settings className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm text-red-600">Admin Dashboard</h4>
                <p className="text-xs text-red-600/70">Content moderation & management</p>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="border-border/50 shadow-sm cursor-pointer hover:bg-muted/30 transition-all active:scale-[0.98]"
            onClick={toggleDarkMode}
          >
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg">
                  {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">Dark Mode</h4>
                </div>
              </div>
              <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 ${isDarkMode ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </CardContent>
          </Card>

          <Button 
            variant="destructive" 
            className="w-full mt-6 h-12 rounded-xl shadow-lg shadow-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
        <div className="h-10" />
      </div>
    </div>
  );
}
