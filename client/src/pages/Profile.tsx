import React from "react";
import { useLocation } from "wouter";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Settings, Award, BookOpen, MessageSquare, Edit } from "lucide-react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

export default function Profile() {
  const [, setLocation] = useLocation();
  const user = auth.currentUser;

  const handleLogout = async () => {
    await signOut(auth);
    setLocation("/auth");
  };

  return (
    <div className="h-full flex flex-col bg-muted/10 relative">
      <div className="bg-primary h-32 w-full absolute top-0 left-0 z-0" />
      
      <div className="flex-1 overflow-y-auto pb-24 z-10 px-6 pt-16">
        <div className="bg-background rounded-3xl shadow-sm p-6 mb-6 text-center border border-border/50 relative overflow-hidden">
           <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-muted-foreground">
             <Edit className="w-4 h-4" />
           </Button>

           <div className="flex flex-col items-center">
             <Avatar className="w-24 h-24 border-4 border-background shadow-xl mb-4">
               <AvatarImage src={user?.photoURL || ""} />
               <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                 {user?.email?.charAt(0).toUpperCase() || "S"}
               </AvatarFallback>
             </Avatar>
             <h2 className="text-xl font-bold">{user?.displayName || "Student Name"}</h2>
             <p className="text-muted-foreground text-sm mb-4">{user?.email || "student@example.com"}</p>
             
             <div className="flex gap-2 mb-6">
               <Badge variant="secondary" className="px-3 py-1 bg-accent/10 text-accent-foreground">Grade 12</Badge>
               <Badge variant="secondary" className="px-3 py-1 bg-primary/10 text-primary">Pre-Engineering</Badge>
             </div>

             <div className="grid grid-cols-3 gap-8 w-full border-t border-border/50 pt-6">
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

        <h3 className="font-semibold mb-4 px-1">Menu</h3>
        <div className="space-y-3">
          <Card className="border-border/50 shadow-sm cursor-pointer hover:bg-muted/30 transition-colors">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm">My Study Materials</h4>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm cursor-pointer hover:bg-muted/30 transition-colors">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                <Award className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-sm">Achievements</h4>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm cursor-pointer hover:bg-muted/30 transition-colors">
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
            className="w-full mt-6 h-12 rounded-xl"
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
