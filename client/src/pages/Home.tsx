import React from "react";
import { BottomNav } from "@/components/layout/BottomNav";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Bell, Filter, MessageSquare, ArrowUp, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import logoImage from "@assets/generated_images/minimalist_education_logo_with_book_and_crescent_moon_green.png";

const SAMPLE_POSTS = [
  {
    id: 1,
    user: "Ayesha Ahmed",
    role: "Teacher",
    time: "2h ago",
    title: "Can someone explain the concept of organic chemistry functional groups?",
    preview: "I'm having trouble understanding how to identify different functional groups in complex molecules...",
    subject: "Chemistry",
    tags: ["Grade 12", "Organic Chem"],
    upvotes: 24,
    comments: 8,
    avatar: "AA"
  },
  {
    id: 2,
    user: "Bilal Khan",
    role: "Student",
    time: "4h ago",
    title: "Past papers for FBISE Class 10 Computer Science?",
    preview: "Does anyone have the link to 2023 solved past papers? I have my exam next week and really need to practice.",
    subject: "Computer Science",
    tags: ["FBISE", "Class 10"],
    upvotes: 15,
    comments: 12,
    avatar: "BK"
  },
  {
    id: 3,
    user: "Hassan Raza",
    role: "Student",
    time: "5m ago",
    title: "Physics numericals Chapter 3 - Kinematics",
    preview: "Question 3.4 is really confusing. A car starts from rest... how do I apply the second equation of motion here?",
    subject: "Physics",
    tags: ["Class 9", "Numericals"],
    upvotes: 2,
    comments: 0,
    avatar: "HR"
  }
];

const CATEGORIES = ["All", "Math", "Physics", "Chemistry", "Computer", "English", "Urdu"];

export default function Home() {
  return (
    <div className="h-full flex flex-col bg-muted/10 relative">
      {/* Header */}
      <header className="px-6 py-4 bg-background sticky top-0 z-10 border-b border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <img src={logoImage} alt="Logo" className="w-8 h-8" />
            <h1 className="text-xl font-bold tracking-tight text-primary">PakStudy</h1>
          </div>
          <button className="relative p-2 rounded-full hover:bg-muted/50 transition-colors">
            <Bell className="w-6 h-6 text-foreground" />
            <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-background" />
          </button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search questions, topics..." 
            className="pl-9 h-10 rounded-xl bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/20" 
          />
        </div>
      </header>

      {/* Categories */}
      <div className="bg-background pb-2">
        <ScrollArea className="w-full whitespace-nowrap px-6">
          <div className="flex w-max space-x-2 pb-2 px-6">
            {CATEGORIES.map((cat, i) => (
              <Badge 
                key={cat} 
                variant={i === 0 ? "default" : "secondary"}
                className={`px-4 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-colors ${i === 0 ? 'bg-primary hover:bg-primary/90' : 'bg-muted hover:bg-muted-foreground/10 text-muted-foreground'}`}
              >
                {cat}
              </Badge>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-24">
        {SAMPLE_POSTS.map((post) => (
          <div key={post.id} className="bg-card p-4 rounded-2xl shadow-sm border border-border/50 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {post.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">{post.user}</h3>
                    {post.role === "Teacher" && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-primary/30 text-primary bg-primary/5">Teacher</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{post.time}</p>
                </div>
              </div>
              <button className="text-muted-foreground hover:text-foreground">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-3">
              <div className="flex gap-2 mb-2">
                 <Badge variant="secondary" className="text-[10px] font-normal px-2 bg-accent/10 text-accent-foreground border-transparent rounded-md text-amber-700 dark:text-amber-400">{post.subject}</Badge>
                 {post.tags.map(tag => (
                   <span key={tag} className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md flex items-center">#{tag}</span>
                 ))}
              </div>
              <h2 className="font-bold text-lg leading-snug mb-2">{post.title}</h2>
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {post.preview}
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border/30">
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors group">
                  <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                  <span className="text-sm font-medium">{post.upvotes}</span>
                </button>
                <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
                  <MessageSquare className="w-5 h-5" />
                  <span className="text-sm font-medium">{post.comments}</span>
                </button>
              </div>
              <button className="text-xs font-medium text-primary hover:underline">Read more</button>
            </div>
          </div>
        ))}
        
        <div className="h-4" /> {/* Spacer for bottom nav */}
      </div>

      <BottomNav />
    </div>
  );
}
