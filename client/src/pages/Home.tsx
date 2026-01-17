import React, { useEffect, useState } from "react";
import { BottomNav } from "@/components/layout/BottomNav";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Bell, Filter, MessageSquare, ArrowUp, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { collection, onSnapshot, query, orderBy, doc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLocation } from "wouter";
import logoImage from "@assets/generated_images/minimalist_education_logo_with_book_and_crescent_moon_green.png";

const CATEGORIES = ["All", "Math", "Physics", "Chemistry", "Computer", "English", "Urdu"];

export default function Home() {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const q = query(collection(db, "questions"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPosts(fetchedPosts);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleUpvote = async (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    try {
      const postRef = doc(db, "questions", postId);
      await updateDoc(postRef, {
        upvotes: increment(1)
      });
    } catch (error) {
      console.error("Error upvoting:", error);
    }
  };

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
        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">Loading questions...</div>
        ) : posts.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">No questions yet. Be the first to ask!</div>
        ) : (
          posts.map((post) => (
            <div 
              key={post.id} 
              className="bg-card p-4 rounded-2xl shadow-sm border border-border/50 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setLocation(`/question/${post.id}`)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {post.userName?.charAt(0) || "U"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm">{post.userName || "Anonymous"}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">Just now</p>
                  </div>
                </div>
                <button className="text-muted-foreground hover:text-foreground">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-3">
                <div className="flex gap-2 mb-2">
                   <Badge variant="secondary" className="text-[10px] font-normal px-2 bg-accent/10 text-accent-foreground border-transparent rounded-md text-amber-700 dark:text-amber-400">{post.subject}</Badge>
                </div>
                <h2 className="font-bold text-lg leading-snug mb-2">{post.title}</h2>
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {post.content}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/30">
                <div className="flex items-center gap-4">
                  <button 
                    className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors group"
                    onClick={(e) => handleUpvote(e, post.id)}
                  >
                    <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                    <span className="text-sm font-medium">{post.upvotes || 0}</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
                    <MessageSquare className="w-5 h-5" />
                    <span className="text-sm font-medium">{post.commentsCount || 0}</span>
                  </button>
                </div>
                <button className="text-xs font-medium text-primary hover:underline">Read more</button>
              </div>
            </div>
          ))
        )}
        
        <div className="h-4" /> {/* Spacer for bottom nav */}
      </div>

      <BottomNav />
    </div>
  );
}
