import React from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, BookOpen, Download, FileText, ShoppingBag, SearchX } from "lucide-react";

export default function Library() {
  const [, setLocation] = useLocation();

  return (
    <div className="h-full flex flex-col bg-background relative overflow-hidden">
      <header className="px-6 py-4 sticky top-0 z-10 border-b flex items-center gap-4 bg-background">
        <Button variant="ghost" size="icon" className="-ml-2 hover:bg-muted/50 transition-colors" onClick={() => window.history.back()}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold tracking-tight">My Library</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag className="w-5 h-5 text-primary" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Bought Notes</h2>
            </div>
            
            <div className="bg-muted/10 border border-dashed border-border rounded-2xl p-8 text-center flex flex-col items-center justify-center animate-in fade-in duration-500">
               <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                 <ShoppingBag className="w-8 h-8 text-primary/50" />
               </div>
               <h3 className="font-bold text-lg mb-1">Your library is empty</h3>
               <p className="text-muted-foreground text-sm max-w-[250px] mb-6">You haven't purchased any study materials yet.</p>
               <Button onClick={() => setLocation("/subjects")} className="rounded-xl shadow-md">Explore Notes</Button>
            </div>
          </div>

          <div>
             <div className="flex items-center gap-2 mb-4 mt-8">
                <BookOpen className="w-5 h-5 text-green-600" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">My Uploads (Selling)</h2>
             </div>
             <div className="bg-muted/10 border border-dashed border-border rounded-2xl p-8 text-center flex flex-col items-center justify-center animate-in fade-in duration-500 delay-150">
               <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                 <FileText className="w-8 h-8 text-green-500/50" />
               </div>
               <h3 className="font-bold text-lg mb-1">No uploads yet</h3>
               <p className="text-muted-foreground text-sm max-w-[250px] mb-6">Start selling your notes to earn money while helping others.</p>
               <Button onClick={() => setLocation("/sell")} variant="outline" className="rounded-xl text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 shadow-sm">Upload Notes</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}