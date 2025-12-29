import React from "react";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImagePlus, X } from "lucide-react";

export default function Post() {
  return (
    <div className="h-full flex flex-col bg-muted/10 relative">
      <header className="px-6 py-4 bg-background sticky top-0 z-10 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
           <Button variant="ghost" size="icon" className="-ml-2">
             <X className="w-6 h-6" />
           </Button>
           <h1 className="text-lg font-bold">Create Post</h1>
        </div>
        <Button size="sm" className="rounded-full px-6">Post</Button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 pb-24 bg-background">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Subject</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="math">Mathematics</SelectItem>
                <SelectItem value="physics">Physics</SelectItem>
                <SelectItem value="chemistry">Chemistry</SelectItem>
                <SelectItem value="cs">Computer Science</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Title</Label>
            <Input placeholder="What's your question about?" className="font-medium text-lg border-none px-0 shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/50" />
          </div>

          <div className="space-y-2">
            <Textarea 
              placeholder="Describe your question in detail..." 
              className="min-h-[200px] border-none px-0 shadow-none focus-visible:ring-0 resize-none text-base" 
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
