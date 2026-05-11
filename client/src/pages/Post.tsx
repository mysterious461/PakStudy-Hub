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
import { ImagePlus, X } from "lucide-react";

export default function Post() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    subject: ""
  });

  const handlePost = async () => {
    if (!auth.currentUser) {
      toast({
        title: "Guest Mode",
        description: "Please log in to post questions.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title || !formData.content || !formData.subject) {
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

      <div className="flex-1 overflow-y-auto p-6 relative z-10">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Subject</Label>
            <Select onValueChange={(v) => setFormData({...formData, subject: v})}>
              <SelectTrigger className="bg-background/80 backdrop-blur-sm border-border/50 h-12 rounded-xl">
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mathematics">Mathematics</SelectItem>
                <SelectItem value="Physics">Physics</SelectItem>
                <SelectItem value="Chemistry">Chemistry</SelectItem>
                <SelectItem value="Computer Science">Computer Science</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Title</Label>
            <Input 
              placeholder="What's your question about?" 
              className="font-medium text-lg border-none px-4 h-14 bg-background/80 backdrop-blur-sm rounded-xl focus-visible:ring-1 ring-primary/20 placeholder:text-muted-foreground/50" 
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Textarea 
              placeholder="Describe your question in detail..." 
              className="min-h-[200px] border-none p-4 bg-background/80 backdrop-blur-sm rounded-xl focus-visible:ring-1 ring-primary/20 resize-none text-base" 
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
            />
          </div>

          <div className="pt-4 border-t border-border/50">
            <Button variant="outline" className="w-full justify-start gap-2 h-12 text-muted-foreground border-dashed">
              <ImagePlus className="w-5 h-5" />
              Add photos or screenshots
            </Button>
          </div>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}
