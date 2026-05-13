import React from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, BookOpen, Download, FileText, ShoppingBag } from "lucide-react";

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
            
            <div className="space-y-4">
              {[
                { title: "Calculus Final Review PDF", author: "Ahmed", date: "Oct 12, 2023", size: "2.4 MB" },
                { title: "Physics Past Papers 2022", author: "Sara", date: "Oct 10, 2023", size: "5.1 MB" },
              ].map((note, i) => (
                <Card key={i} className="border-border/50 shadow-sm rounded-2xl overflow-hidden hover:border-primary/30 transition-colors cursor-pointer group">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0 group-hover:scale-105 transition-transform">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm leading-tight">{note.title}</h3>
                        <p className="text-[11px] text-muted-foreground mt-1">From {note.author} • {note.size}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0 text-primary hover:bg-primary/10">
                      <Download className="w-5 h-5" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-green-600" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">My Uploads (Selling)</h2>
            </div>
            
            <div className="space-y-4">
              <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden hover:border-green-500/30 transition-colors cursor-pointer group">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-500/10 text-green-600 rounded-xl shrink-0 group-hover:scale-105 transition-transform">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm leading-tight">Chemistry Midterm Notes</h3>
                      <p className="text-[11px] text-muted-foreground mt-1">Listed for Rs. 300 • 5 Sales</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-green-600">Active</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">Edit</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}