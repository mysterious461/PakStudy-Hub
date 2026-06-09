import React, { useEffect, useState } from "react";
import { BottomNav } from "@/components/layout/BottomNav";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Bell, MessageSquare, ArrowUp, MoreHorizontal, Share2, Facebook, Twitter, Link as LinkIcon, FileText, Bookmark, SlidersHorizontal, Brain, Users } from "lucide-react";
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
    <div className="h-full flex flex-col bg-muted/10 relative">
      {/* Header */}
      <header className="px-6 py-4 sticky top-0 z-10 border-b border-border/50 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="/src/assets/images/header-bg.jpg" alt="Background" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />
        </div>
        <div className="relative z-10 flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <img src={logoImage} alt="Logo" className="w-8 h-8" />
            <h1 className="text-xl font-bold tracking-tight text-primary">PakStudy</h1>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <button className="relative p-2 rounded-full hover:bg-muted/50 transition-colors">
                <Bell className="w-6 h-6 text-foreground" />
                <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-background" />
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-2xl w-[90vw]">
              <DialogHeader>
                <DialogTitle>Notifications</DialogTitle>
                <DialogDescription>
                  Recent activity related to your courses.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm"><strong>Ali Khan</strong> answered your question in <strong>Computer Science</strong>.</p>
                    <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm">New notes available for <strong>Software Engineering</strong>: "Midterm Preparation Guide"</p>
                    <p className="text-xs text-muted-foreground mt-1">5 hours ago</p>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search questions, topics..." 
              className="pl-9 h-10 rounded-xl bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/20" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 h-10 w-10 rounded-xl border-border/50 bg-background/50 backdrop-blur-sm">
                <SlidersHorizontal className="w-4 h-4 text-foreground/80" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl p-2">
              <div className="px-2 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Sort By</div>
              <DropdownMenuItem className="rounded-lg cursor-pointer">Most Recent</DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg cursor-pointer">Highest Upvotes</DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg cursor-pointer">Most Answers</DropdownMenuItem>
              <div className="h-px bg-border/50 my-1.5" />
              <div className="px-2 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Filter</div>
              <DropdownMenuItem className="rounded-lg cursor-pointer">Has Attachments (Notes)</DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg cursor-pointer">Unanswered Only</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Categories */}
      <div className="bg-background pb-2">
        <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar mb-1">
          <Button 
            variant="outline" 
            size="sm" 
            className="shrink-0 h-9 rounded-xl border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:text-purple-800"
            onClick={() => setLocation("/flashcards")}
          >
            <Brain className="w-4 h-4 mr-2" /> Quick Review
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="shrink-0 h-9 rounded-xl border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:text-orange-800"
            onClick={() => setLocation("/study-rooms")}
          >
            <Users className="w-4 h-4 mr-2" /> Study Rooms
          </Button>
        </div>

        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex w-max space-x-2 pb-2 px-6">
            {CATEGORIES.map((cat) => (
              <Badge 
                key={cat} 
                variant={selectedCategory === cat ? "default" : "secondary"}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-colors ${selectedCategory === cat ? 'bg-primary hover:bg-primary/90' : 'bg-muted hover:bg-muted-foreground/10 text-muted-foreground'}`}
              >
                {cat}
              </Badge>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card p-4 rounded-2xl border border-border/50 space-y-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
                <div className="pt-3 flex gap-3 border-t border-border/30">
                  <Skeleton className="h-8 w-16 rounded-lg" />
                  <Skeleton className="h-8 w-16 rounded-lg" />
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
                <div className="flex items-center gap-3">
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
  );
}
