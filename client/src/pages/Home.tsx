import React, { useEffect, useState } from "react";
import { BottomNav } from "@/components/layout/BottomNav";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Bell, MessageSquare, ArrowUp, MoreHorizontal, Share2, Facebook, Twitter, Link as LinkIcon, FileText, Bookmark, SlidersHorizontal, Brain, Users, Trophy, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { collection, onSnapshot, query, orderBy, doc, updateDoc, increment } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import logoImage from "@assets/generated_images/minimalist_education_logo_with_book_and_crescent_moon_green.png";

const CATEGORIES = ["All", "Math", "Physics", "Chemistry", "Computer", "English", "Urdu"];

export default function Home() {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [savedPosts, setSavedPosts] = useState<Record<string, boolean>>({});
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const toggleSave = (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    setSavedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
    toast({
      title: savedPosts[postId] ? "Removed from Library" : "Saved to Library",
      description: savedPosts[postId] ? "Question removed from your saved items." : "Question saved to your library for later.",
    });
  };

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
    if (!auth.currentUser) {
      toast({
        title: "Guest Mode",
        description: "Please log in to upvote questions.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const postRef = doc(db, "questions", postId);
      await updateDoc(postRef, {
        upvotes: increment(1)
      });
    } catch (error) {
      console.error("Error upvoting:", error);
    }
  };

  const handleShare = (platform: string, postId: string) => {
    const url = `${window.location.origin}/question/${postId}`;
    let shareUrl = "";

    switch (platform) {
      case "whatsapp":
        shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(url)}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case "copy":
        navigator.clipboard.writeText(url);
        toast({ title: "Link Copied", description: "Link copied to clipboard!" });
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesCategory = selectedCategory === "All" || post.subject === selectedCategory || (selectedCategory === "Computer" && post.subject === "Computer Science");
    const matchesSearch = post.title?.toLowerCase().includes(searchQuery.toLowerCase()) || post.content?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="h-full flex flex-col bg-muted/10 relative overflow-hidden">
      {/* Header */}
      <header className="px-4 py-4 pt-6 sticky top-0 z-20 border-b border-border/40 bg-background/60 backdrop-blur-xl shadow-[0_4px_30px_rgb(0,0,0,0.03)] flex flex-col gap-4 transition-all duration-300">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2.5 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center p-1 border border-border/50 relative overflow-hidden group">
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <img src={logoImage} alt="PakStudy Hub" className="w-full h-full object-contain relative z-10" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-foreground/90 leading-tight">PakStudy Hub</h1>
              <p className="text-[10px] uppercase tracking-widest font-bold text-primary">Student Community</p>
            </div>
          </div>
          
          <div className="flex gap-2 animate-in fade-in slide-in-from-right-4 duration-500">
            <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-muted/50 bg-background shadow-sm border border-border/50 transition-transform hover:scale-105 active:scale-95" onClick={() => setLocation('/messages')}>
              <MessageSquare className="w-5 h-5 text-foreground/80" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background animate-pulse" />
            </Button>
            <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-muted/50 bg-background shadow-sm border border-border/50 transition-transform hover:scale-105 active:scale-95">
              <Bell className="w-5 h-5 text-foreground/80" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border-2 border-background animate-pulse" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted/50 bg-background shadow-sm border border-border/50 transition-transform hover:scale-105 active:scale-95 overflow-hidden" onClick={() => setLocation('/profile')}>
              <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center font-bold text-xs text-primary">
                {auth.currentUser?.displayName?.charAt(0) || "U"}
              </div>
            </Button>
          </div>
        </div>
        
        <div className="flex gap-2 px-2 animate-in fade-in slide-in-from-top-4 duration-500 delay-100">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search questions, notes, topics..." 
              className="pl-12 h-12 rounded-2xl bg-muted/40 border-none focus-visible:ring-2 focus-visible:ring-primary/20 shadow-inner font-medium transition-all" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 h-12 w-12 rounded-2xl border-none bg-muted/40 hover:bg-muted/60 shadow-sm transition-all hover:scale-105 active:scale-95">
                <SlidersHorizontal className="w-5 h-5 text-foreground/80" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl border-border/40 bg-background/95 backdrop-blur-xl">
              <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Sort By</div>
              <DropdownMenuItem className="rounded-xl cursor-pointer font-medium focus:bg-primary/10 focus:text-primary py-2.5">Most Recent</DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl cursor-pointer font-medium focus:bg-primary/10 focus:text-primary py-2.5">Highest Upvotes</DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl cursor-pointer font-medium focus:bg-primary/10 focus:text-primary py-2.5">Most Answers</DropdownMenuItem>
              <div className="h-px bg-border/50 my-2" />
              <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Filter</div>
              <DropdownMenuItem className="rounded-xl cursor-pointer font-medium focus:bg-primary/10 focus:text-primary py-2.5">Has Attachments (Notes)</DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl cursor-pointer font-medium focus:bg-primary/10 focus:text-primary py-2.5">Unanswered Only</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-32">
        <div className="bg-background pt-4 pb-2 border-b border-border/30 sticky top-0 z-10">
          <div className="px-4 flex gap-3 overflow-x-auto no-scrollbar mb-4 animate-in fade-in slide-in-from-right-8 duration-500 delay-150">
            <Button 
              variant="outline" 
              className="shrink-0 h-11 rounded-2xl border-none bg-purple-500/10 text-purple-700 hover:bg-purple-500/20 hover:text-purple-800 shadow-sm font-bold transition-all hover:scale-105"
              onClick={() => setLocation("/flashcards")}
            >
              <Brain className="w-5 h-5 mr-2" /> Quick Review
            </Button>
            <Button 
              variant="outline" 
              className="shrink-0 h-11 rounded-2xl border-none bg-green-500/10 text-green-700 hover:bg-green-500/20 hover:text-green-800 shadow-sm font-bold transition-all hover:scale-105"
              onClick={() => setLocation("/study-rooms")}
            >
              <Users className="w-5 h-5 mr-2" /> Study Rooms
            </Button>
            <Button 
              variant="outline" 
              className="shrink-0 h-11 rounded-2xl border-none bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 hover:text-blue-800 shadow-sm font-bold transition-all hover:scale-105"
              onClick={() => setLocation("/ai-tutor")}
            >
              <Sparkles className="w-5 h-5 mr-2 text-blue-600" /> AI Tutor
            </Button>
            <Button 
              variant="outline" 
              className="shrink-0 h-11 rounded-2xl border-none bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 hover:text-amber-800 shadow-sm font-bold transition-all hover:scale-105"
              onClick={() => setLocation("/leaderboard")}
            >
              <Trophy className="w-5 h-5 mr-2 text-amber-600" /> Leaderboard
            </Button>
          </div>

          <ScrollArea className="w-full whitespace-nowrap animate-in fade-in duration-500 delay-200">
            <div className="flex w-max space-x-2 pb-3 px-6">
              {CATEGORIES.map((cat) => (
                <Badge 
                  key={cat} 
                  variant={selectedCategory === cat ? "default" : "secondary"}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-[13px] font-bold cursor-pointer transition-all duration-300 ${selectedCategory === cat ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30 scale-105 hover:bg-primary/90' : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'}`}
                >
                  {cat}
                </Badge>
              ))}
            </div>
          </ScrollArea>
        </div>

      {/* Feed */}
      <div className="px-4 py-4 space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-background/60 backdrop-blur-sm p-5 rounded-3xl border border-border/40 space-y-4 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted/50 rounded-full animate-pulse" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted/50 rounded animate-pulse w-1/4" />
                    <div className="h-3 bg-muted/50 rounded animate-pulse w-1/5" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-5 bg-muted/50 rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-muted/50 rounded animate-pulse w-full" />
                  <div className="h-4 bg-muted/50 rounded animate-pulse w-5/6" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-4 animate-in fade-in duration-500">
            <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mb-4">
              <Search className="w-10 h-10 text-primary/40" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-foreground/80">No questions found</h3>
            <p className="text-muted-foreground text-sm max-w-[250px] mb-6">
              {searchQuery ? "We couldn't find anything matching your search. Try different keywords." : `There are no questions in ${selectedCategory} yet. Be the first to ask!`}
            </p>
            <Button className="rounded-xl shadow-md" onClick={() => setLocation("/post")}>Ask a Question</Button>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <div 
              key={post.id} 
              className="bg-background/60 backdrop-blur-sm p-5 rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-border/40 hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group"
              onClick={() => setLocation(`/question/${post.id}`)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold text-sm ring-2 ring-background shadow-sm">
                    {post.userName?.charAt(0) || "U"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm text-foreground/90">{post.userName || "Anonymous"}</h3>
                    </div>
                    <p className="text-[11px] font-medium text-muted-foreground">Just now</p>
                  </div>
                </div>
                <button className="text-muted-foreground hover:text-foreground p-2 rounded-full hover:bg-muted/50 transition-colors">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4">
                <div className="flex gap-2 mb-3">
                   <Badge variant="secondary" className="text-[10px] font-medium px-2.5 py-0.5 bg-primary/10 text-primary border-none rounded-md">{post.subject}</Badge>
                </div>
                <h2 className="font-bold text-[17px] leading-snug mb-2 text-foreground/90 group-hover:text-primary transition-colors duration-300">{post.title}</h2>
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {post.content}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border/30">
                <div className="flex items-center gap-1">
                  <button 
                    className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors p-2 rounded-xl hover:bg-primary/5"
                    onClick={(e) => handleUpvote(e, post.id)}
                  >
                    <div className="bg-muted/50 p-1.5 rounded-lg group-hover/btn:bg-primary/10 transition-colors">
                      <ArrowUp className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold">{post.upvotes || 0}</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors p-2 rounded-xl hover:bg-primary/5">
                    <div className="bg-muted/50 p-1.5 rounded-lg group-hover/btn:bg-primary/10 transition-colors">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold">{post.commentsCount || 0}</span>
                  </button>

                  <button 
                    className={`flex items-center gap-1.5 transition-colors ${savedPosts[post.id] ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
                    onClick={(e) => toggleSave(e, post.id)}
                  >
                    <Bookmark className={`w-5 h-5 ${savedPosts[post.id] ? 'fill-current' : ''}`} />
                  </button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button 
                        className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-xl" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem onClick={() => handleShare('whatsapp', post.id)} className="gap-2 cursor-pointer">
                        <div className="w-5 h-5 rounded bg-green-500 text-white flex items-center justify-center shrink-0">
                          <MessageSquare className="w-3 h-3" />
                        </div>
                        <span>WhatsApp</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShare('twitter', post.id)} className="gap-2 cursor-pointer">
                        <div className="w-5 h-5 rounded bg-blue-400 text-white flex items-center justify-center shrink-0">
                          <Twitter className="w-3 h-3" />
                        </div>
                        <span>Twitter</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShare('facebook', post.id)} className="gap-2 cursor-pointer">
                        <div className="w-5 h-5 rounded bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <Facebook className="w-3 h-3" />
                        </div>
                        <span>Facebook</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShare('copy', post.id)} className="gap-2 cursor-pointer">
                        <div className="w-5 h-5 rounded bg-muted-foreground text-white flex items-center justify-center shrink-0">
                          <LinkIcon className="w-3 h-3" />
                        </div>
                        <span>Copy Link</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <button className="text-xs font-medium text-primary hover:underline">Read more</button>
              </div>
            </div>
          ))
        )}
        
        <div className="h-4" /> {/* Spacer */}
      </div>
      </div>
    </div>
  );
}
