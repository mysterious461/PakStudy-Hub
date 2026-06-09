import React, { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, ArrowUp, MessageSquare, CheckCircle } from "lucide-react";
import { doc, onSnapshot, collection, addDoc, serverTimestamp, updateDoc, increment, query, orderBy } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, CreditCard, Banknote, Landmark, Share2, Facebook, Twitter, Link as LinkIcon, Bookmark } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Star, StarHalf } from "lucide-react";

export default function QuestionDetail() {
  const [, params] = useRoute("/question/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [question, setQuestion] = useState<any>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [reply, setReply] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  const toggleSave = () => {
    setIsSaved(!isSaved);
    toast({
      title: isSaved ? "Removed from Library" : "Saved to Library",
      description: isSaved ? "Question removed from your saved items." : "Question saved to your library for later.",
    });
  };

  const handlePurchaseNotes = () => {
    toast({
      title: "Payment Processing",
      description: "Redirecting to payment gateway...",
    });
    setTimeout(() => {
      toast({
        title: "Purchase Successful",
        description: "Notes have been added to your study materials.",
      });
      setIsPaymentOpen(false);
    }, 2000);
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

  useEffect(() => {
    if (!params?.id) return;

    // Fetch question
    const qUnsubscribe = onSnapshot(doc(db, "questions", params.id), (doc) => {
      if (doc.exists()) {
        setQuestion({ id: doc.id, ...doc.data() });
      }
    }, (error) => {
      console.error("Error fetching question:", error);
      toast({ title: "Error loading question", variant: "destructive" });
    });

    // Fetch answers
    const answersQuery = query(
      collection(db, "questions", params.id, "answers"),
      orderBy("createdAt", "asc")
    );
    const aUnsubscribe = onSnapshot(answersQuery, (snapshot) => {
      const fetchedAnswers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAnswers(fetchedAnswers);
    }, (error) => {
      console.error("Error fetching answers:", error);
    });

    return () => {
      qUnsubscribe();
      aUnsubscribe();
    };
  }, [params?.id, toast]);

  const handleUpvote = async () => {
    if (!params?.id) return;
    try {
      await updateDoc(doc(db, "questions", params.id), {
        upvotes: increment(1)
      });
    } catch (error) {
      console.error("Error upvoting:", error);
    }
  };

  const handleMarkCorrect = async (answerId: string) => {
    if (!params?.id || question?.userId !== auth.currentUser?.uid) return;
    
    try {
      // Unmark any previously correct answer
      const prevCorrect = answers.find(a => a.isCorrect);
      if (prevCorrect) {
        await updateDoc(doc(db, "questions", params.id, "answers", prevCorrect.id), {
          isCorrect: false
        });
      }

      // Mark the new one as correct
      await updateDoc(doc(db, "questions", params.id, "answers", answerId), {
        isCorrect: true
      });
      
      // Give points to the user who answered
      const answer = answers.find(a => a.id === answerId);
      if (answer && answer.userId) {
        await updateDoc(doc(db, "users", answer.userId), {
          reputation: increment(15)
        }).catch(err => console.error("Could not update reputation:", err));
      }
      
      toast({ title: "Answer marked as correct! (+15 reputation awarded)" });
    } catch (error) {
      console.error("Error marking correct:", error);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !params?.id) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "questions", params.id, "answers"), {
        content: reply,
        userId: auth.currentUser?.uid,
        userName: auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0],
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, "questions", params.id), {
        commentsCount: increment(1)
      });

      setReply("");
      toast({ title: "Reply posted successfully" });
    } catch (error: any) {
      toast({ title: "Failed to post reply", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!question) return (
    <div className="h-full flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <p className="text-muted-foreground animate-pulse">Loading question...</p>
        <Button variant="outline" onClick={() => setLocation("/home")}>Go Back</Button>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-background relative overflow-hidden">
      <header className="px-6 py-4 bg-background sticky top-0 z-10 border-b flex items-center gap-4">
        <Button variant="ghost" size="icon" className="-ml-2 hover:bg-muted/50 transition-colors" onClick={() => setLocation("/home")}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-lg font-bold truncate">Question</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-6 pb-36">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-sm">
              {question.userName?.charAt(0) || "U"}
            </div>
            <div>
              <h3 className="font-semibold text-sm">{question.userName}</h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Original Poster</p>
            </div>
          </div>

          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-none px-3 py-0.5 rounded-full text-[10px] font-semibold">
            {question.subject}
          </Badge>
          
          <h2 className="text-2xl font-bold leading-tight tracking-tight">{question.title}</h2>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap text-base font-normal">
            {question.content}
          </p>

          {question.sellNotes && (
            <div className="mt-4 p-4 rounded-2xl border border-primary/20 bg-primary/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/20 text-primary rounded-xl">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Attached Notes</h4>
                  <p className="text-xs text-muted-foreground mb-1">Price: Rs. {question.notesPrice}</p>
                  <div className="flex items-center gap-1">
                    <div className="flex">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <StarHalf className="w-3 h-3 fill-amber-400 text-amber-400" />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">4.8 (24 reviews)</span>
                  </div>
                </div>
              </div>
              <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="rounded-xl px-4 shadow-sm shadow-primary/20">
                    <Download className="w-4 h-4 mr-2" /> Buy Notes
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] rounded-2xl w-[90vw]">
                  <DialogHeader>
                    <DialogTitle>Purchase Notes</DialogTitle>
                    <DialogDescription>
                      Buy attached notes for Rs. {question.notesPrice}. You will be able to download them immediately.
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
                    <Button onClick={handlePurchaseNotes} className="w-full h-12 rounded-xl" disabled={!paymentMethod}>
                      Pay Rs. {question.notesPrice}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}

          <div className="flex items-center gap-6 pt-6 border-t border-border/50">
            <button 
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-all active:scale-95 group" 
              onClick={handleUpvote}
            >
              <div className="p-2 rounded-full bg-muted/50 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <ArrowUp className="w-5 h-5" />
              </div>
              <span className="font-bold text-sm">{question.upvotes || 0}</span>
            </button>
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="p-2 rounded-full bg-muted/50">
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className="font-bold text-sm">{question.commentsCount || 0}</span>
            </div>

            <button 
              className={`flex items-center gap-2 transition-colors group ${isSaved ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
              onClick={toggleSave}
            >
              <div className={`p-2 rounded-full transition-colors ${isSaved ? 'bg-primary/10' : 'bg-muted/50 group-hover:bg-primary/10'}`}>
                <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
              </div>
              <span className="font-bold text-sm hidden sm:inline">{isSaved ? "Saved" : "Save"}</span>
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-all ml-auto">
                  <div className="p-2 rounded-full bg-muted/50">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-sm hidden sm:inline">Share</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl">
                <DropdownMenuItem onClick={() => handleShare('whatsapp', question.id)} className="gap-2 cursor-pointer">
                  <div className="w-5 h-5 rounded bg-green-500 text-white flex items-center justify-center shrink-0">
                    <MessageSquare className="w-3 h-3" />
                  </div>
                  <span>WhatsApp</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare('twitter', question.id)} className="gap-2 cursor-pointer">
                  <div className="w-5 h-5 rounded bg-blue-400 text-white flex items-center justify-center shrink-0">
                    <Twitter className="w-3 h-3" />
                  </div>
                  <span>Twitter</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare('facebook', question.id)} className="gap-2 cursor-pointer">
                  <div className="w-5 h-5 rounded bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Facebook className="w-3 h-3" />
                  </div>
                  <span>Facebook</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare('copy', question.id)} className="gap-2 cursor-pointer">
                  <div className="w-5 h-5 rounded bg-muted-foreground text-white flex items-center justify-center shrink-0">
                    <LinkIcon className="w-3 h-3" />
                  </div>
                  <span>Copy Link</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="pt-10 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xl tracking-tight">Answers</h3>
              <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 border-muted-foreground/30">
                {answers.length} Total
              </Badge>
            </div>
            
            {answers.length === 0 ? (
              <div className="bg-muted/10 border border-dashed border-border rounded-2xl p-8 text-center space-y-2">
                <p className="text-muted-foreground text-sm font-medium italic">No answers yet.</p>
                <p className="text-[11px] text-muted-foreground/60">Be the first to help out the community!</p>
              </div>
            ) : (
              <div className="space-y-4 pb-4">
                {answers.map((answer) => (
                  <div key={answer.id} className={`bg-card p-5 rounded-3xl space-y-3 border shadow-sm hover:shadow-md transition-shadow ${answer.isCorrect ? 'border-primary/50 bg-primary/5' : 'border-border/50'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                          {answer.userName?.charAt(0) || "A"}
                        </div>
                        <span className="font-bold text-xs text-foreground/80">{answer.userName}</span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                        <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-tighter">Verified Member</span>
                      </div>
                      
                      {answer.isCorrect ? (
                        <Badge variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/20 border-none px-2 py-0.5 text-[10px] gap-1">
                          <CheckCircle className="w-3 h-3" /> Correct Answer
                        </Badge>
                      ) : (
                        question?.userId === auth.currentUser?.uid && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 px-2 text-[10px] text-muted-foreground hover:text-primary"
                            onClick={() => handleMarkCorrect(answer.id)}
                          >
                            Mark as Correct
                          </Button>
                        )
                      )}
                    </div>
                    <p className="text-sm leading-relaxed font-medium text-foreground/90">{answer.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="shrink-0 p-4 bg-background border-t border-border/50">
        <form onSubmit={handleSubmitReply} className="flex gap-3 max-w-4xl mx-auto items-center">
          <div className="relative flex-1 group">
            <Input 
              placeholder={auth.currentUser ? "Provide an answer..." : "Sign in to answer"} 
              className="rounded-2xl bg-muted/30 border-none h-12 pl-4 pr-12 text-sm focus-visible:ring-1 focus-visible:ring-primary/20 transition-all" 
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              disabled={!auth.currentUser}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-focus-within:opacity-100 transition-opacity">
              <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-tighter">Enter to send</span>
            </div>
          </div>
          <Button 
            type="submit" 
            size="icon" 
            className="rounded-2xl h-12 w-12 shrink-0 shadow-lg shadow-primary/10 transition-transform active:scale-95" 
            disabled={isSubmitting || !reply.trim() || !auth.currentUser}
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}