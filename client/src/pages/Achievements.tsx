import React from "react";
import { ArrowLeft, Award, Trophy, Star, Zap, Flame, Shield, BookOpen, Crown } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function Achievements() {
  const [, setLocation] = useLocation();

  const achievements = [
    { id: 1, title: "First Steps", description: "Asked your first question.", icon: Star, color: "text-yellow-500", bg: "bg-yellow-100", unlocked: true, progress: 100 },
    { id: 2, title: "Helpful Hand", description: "Answered 5 questions correctly.", icon: Zap, color: "text-orange-500", bg: "bg-orange-100", unlocked: true, progress: 100 },
    { id: 3, title: "Hot Streak", description: "Logged in for 7 consecutive days.", icon: Flame, color: "text-red-500", bg: "bg-red-100", unlocked: false, progress: 40 },
    { id: 4, title: "Subject Master", description: "Earned 500 reputation in a single subject.", icon: Crown, color: "text-purple-500", bg: "bg-purple-100", unlocked: false, progress: 75 },
    { id: 5, title: "Knowledge Sharer", description: "Sold your first study notes.", icon: BookOpen, color: "text-blue-500", bg: "bg-blue-100", unlocked: true, progress: 100 },
    { id: 6, title: "Community Guardian", description: "Reported inappropriate content.", icon: Shield, color: "text-emerald-500", bg: "bg-emerald-100", unlocked: false, progress: 0 },
  ];

  return (
    <div className="h-full flex flex-col bg-muted/10 relative overflow-hidden">
      <header className="px-6 py-4 bg-background sticky top-0 z-10 border-b flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="-ml-2 hover:bg-muted/50" onClick={() => setLocation("/profile")}>
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-lg font-bold truncate">Achievements</h1>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-full">
          <Trophy className="w-4 h-4 fill-current" />
          <span className="text-xs font-bold">Level 4</span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-24">
        {/* Banner */}
        <div className="bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-6 text-primary-foreground shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />
          <h2 className="text-2xl font-bold mb-2 relative z-10">You're doing great!</h2>
          <p className="text-primary-foreground/80 text-sm mb-4 max-w-[200px] relative z-10">
            You've unlocked 3 out of 12 total achievements. Keep learning!
          </p>
          <div className="space-y-1.5 relative z-10">
            <div className="flex justify-between text-xs font-medium">
              <span>Next Level: 5</span>
              <span>150 / 300 XP</span>
            </div>
            <Progress value={50} className="h-2 bg-primary-foreground/20 [&>div]:bg-white" />
          </div>
        </div>

        {/* Badges Grid */}
        <div className="grid gap-4">
          <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground px-1">Badges</h3>
          {achievements.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.id} className={`border-border/50 shadow-sm transition-all ${item.unlocked ? 'bg-background' : 'bg-muted/30 opacity-70 grayscale-[30%]'}`}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center shadow-inner ${item.bg} ${item.color}`}>
                    <Icon className={`w-7 h-7 ${item.unlocked ? 'fill-current opacity-20' : ''}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-sm">{item.title}</h4>
                      {item.unlocked && <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 bg-green-100 px-2 py-0.5 rounded-sm">Unlocked</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{item.description}</p>
                    {!item.unlocked && (
                      <div className="space-y-1.5">
                        <Progress value={item.progress} className="h-1.5" />
                        <p className="text-[10px] text-muted-foreground text-right font-medium">{item.progress}%</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
