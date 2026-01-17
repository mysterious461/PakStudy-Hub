import React, { useState } from "react";
import { useLocation } from "wouter";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogOut, Settings, Award, BookOpen, Edit, Save, X, User, School, Book } from "lucide-react";
import { auth } from "@/lib/firebase";
import { signOut, updateProfile } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const user = auth.currentUser;

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: user?.displayName || "Student Name",
    grade: "Grade 12",
    track: "Pre-Engineering"
  });

  const handleLogout = async () => {
    await signOut(auth);
    setLocation("/auth");
  };

  const handleSave = async () => {
    try {
      if (user) {
        await updateProfile(user, { displayName: formData.displayName });
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

  return (
    <div className="h-full flex flex-col bg-muted/10 relative">
      <div className="bg-primary h-32 w-full absolute top-0 left-0 z-0" />
      
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
                     <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Grade</Label>
                     <Select value={formData.grade} onValueChange={(v) => setFormData({...formData, grade: v})}>
                       <SelectTrigger className="bg-muted/30 border-none rounded-xl h-10 focus:ring-1 ring-primary/20">
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="Grade 9">Grade 9</SelectItem>
                         <SelectItem value="Grade 10">Grade 10</SelectItem>
                         <SelectItem value="Grade 11">Grade 11</SelectItem>
                         <SelectItem value="Grade 12">Grade 12</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                   <div className="space-y-1.5">
                     <Label className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Track</Label>
                     <Select value={formData.track} onValueChange={(v) => setFormData({...formData, track: v})}>
                       <SelectTrigger className="bg-muted/30 border-none rounded-xl h-10 focus:ring-1 ring-primary/20">
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="Pre-Engineering">Pre-Engineering</SelectItem>
                         <SelectItem value="Pre-Medical">Pre-Medical</SelectItem>
                         <SelectItem value="Computer Science">Computer Science</SelectItem>
                         <SelectItem value="Arts">Arts</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                 </div>
               </div>
             ) : (
               <>
                 <h2 className="text-xl font-bold">{formData.displayName}</h2>
                 <p className="text-muted-foreground text-sm mb-4">{user?.email || "student@example.com"}</p>
                 
                 <div className="flex gap-2 mb-6">
                   <Badge variant="secondary" className="px-3 py-1 bg-accent/10 text-accent-foreground border-none">{formData.grade}</Badge>
                   <Badge variant="secondary" className="px-3 py-1 bg-primary/10 text-primary border-none">{formData.track}</Badge>
                 </div>
               </>
             )}

             <div className="grid grid-cols-3 gap-8 w-full border-t border-border/50 pt-6 mt-2">
               <div>
                 <div className="text-xl font-bold">12</div>
                 <div className="text-xs text-muted-foreground">Questions</div>
               </div>
               <div>
                 <div className="text-xl font-bold">48</div>
                 <div className="text-xs text-muted-foreground">Answers</div>
               </div>
               <div>
                 <div className="text-xl font-bold">156</div>
                 <div className="text-xs text-muted-foreground">Reputation</div>
               </div>
             </div>
           </div>
        </div>

        <h3 className="font-semibold mb-4 px-1">Resources</h3>
        <div className="space-y-3">
          <Card className="border-border/50 shadow-sm cursor-pointer hover:bg-muted/30 transition-all active:scale-[0.98]">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm">My Study Materials</h4>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm cursor-pointer hover:bg-muted/30 transition-all active:scale-[0.98]">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                <Award className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm">Achievements</h4>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm cursor-pointer hover:bg-muted/30 transition-all active:scale-[0.98]">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                <Settings className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm">Settings</h4>
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
      </div>

      <BottomNav />
    </div>
  );
}
