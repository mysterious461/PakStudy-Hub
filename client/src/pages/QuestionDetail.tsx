import React, { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, ArrowUp, MessageSquare } from "lucide-react";
import { doc, onSnapshot, collection, addDoc, serverTimestamp, updateDoc, increment, query, orderBy } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function QuestionDetail() {
  const [, params] = useRoute("/question/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [question, setQuestion] = useState<any>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [reply, setReply] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
                  <div key={answer.id} className="bg-card p-5 rounded-3xl space-y-3 border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                        {answer.userName?.charAt(0) || "A"}
                      </div>
                      <span className="font-bold text-xs text-foreground/80">{answer.userName}</span>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                      <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-tighter">Verified Member</span>
                    </div>
                    <p className="text-sm leading-relaxed font-medium text-foreground/90">{answer.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="fixed bottom-16 left-0 right-0 p-4 bg-background/90 backdrop-blur-md border-t border-border/50 z-20">
        <form onSubmit={handleSubmitReply} className="flex gap-3 max-w-4xl mx-auto items-center">
          <div className="relative flex-1 group">
            <Input 
              placeholder="Provide an answer..." 
              className="rounded-2xl bg-muted/30 border-none h-12 pl-4 pr-12 text-sm focus-visible:ring-1 focus-visible:ring-primary/20 transition-all" 
              value={reply}
              onChange={(e) => setReply(e.target.value)}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-focus-within:opacity-100 transition-opacity">
              <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-tighter">Enter to send</span>
            </div>
          </div>
          <Button 
            type="submit" 
            size="icon" 
            className="rounded-2xl h-12 w-12 shrink-0 shadow-lg shadow-primary/10 transition-transform active:scale-95" 
            disabled={isSubmitting || !reply.trim()}
          >
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>

      <BottomNav />
    </div>
  );
}