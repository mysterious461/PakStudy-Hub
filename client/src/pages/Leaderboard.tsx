import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Trophy, Flame, TrendingUp, Award, User, GraduationCap, ArrowUp } from "lucide-react";
import { UNIVERSITIES } from "@/lib/educationData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { auth } from "@/lib/firebase";

const UNIVERSITY_RANKINGS = [
  { rank: 1, name: "NUST", score: 15400, trend: "up" },
  { rank: 2, name: "FAST-NU", score: 14850, trend: "up" },
  { rank: 3, name: "LUMS", score: 12200, trend: "down" },
  { rank: 4, name: "UET", score: 10500, trend: "up" },
  { rank: 5, name: "PU", score: 9800, trend: "down" },
  { rank: 6, name: "COMSATS", score: 8900, trend: "same" },
];

export default function Leaderboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("students");
  const [topStudents, setTopStudents] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/leaderboard", { credentials: "include" })
      .then((res) => res.ok ? res.json() : [])
      .then((users) => setTopStudents(users.map((user: any, index: number) => ({
        id: user.id,
        name: user.name,
        uni: user.university || "PakStudy",
        points: user.reputation || 0,
        streak: user.streak || 0,
        avatar: user.name?.split(" ").map((part: string) => part[0]).join("").slice(0, 2).toUpperCase() || "ST",
        rank: index + 1,
        isCurrentUser: user.id === auth.currentUser?.uid,
      }))))
      .catch(() => setTopStudents([]));
  }, []);

  return (
    <div className="h-full flex flex-col bg-muted/10 relative overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3" />
      </div>

      <header className="px-6 py-4 pt-6 sticky top-0 z-20 border-b border-border/40 bg-background/60 backdrop-blur-xl flex items-center justify-between shadow-[0_4px_30px_rgb(0,0,0,0.03)]">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="-ml-2 hover:bg-muted/50 rounded-full transition-colors" onClick={() => setLocation("/home")}>
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 rounded-xl">
              <Trophy className="w-5 h-5 text-amber-500" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight">Leaderboards</h1>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto relative z-10 pb-32">
        {/* User Stats Card */}
        <div className="px-4 pt-6 pb-4">
          <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 rounded-[2rem] p-6 text-white shadow-lg shadow-orange-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -translate-y-10 translate-x-10" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-xl translate-y-10 -translate-x-10" />
            
            <div className="relative z-10 flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Avatar className="w-14 h-14 border-[3px] border-white/30 shadow-xl ring-4 ring-white/10">
                  <AvatarFallback className="bg-gradient-to-br from-white/30 to-white/10 text-white font-bold text-lg">ME</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-white/80 text-xs uppercase tracking-wider mb-1">Your Ranking</p>
                  <p className="text-3xl font-black tracking-tight leading-none">#42</p>
                </div>
              </div>
              <div className="text-right bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/10">
                <p className="font-medium text-white/80 text-[10px] uppercase tracking-wider mb-1">Total Points</p>
                <p className="text-2xl font-black leading-none">850</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 pt-5 border-t border-white/20">
              <div className="flex items-center gap-2 bg-black/10 px-3 py-1.5 rounded-xl backdrop-blur-sm border border-white/5">
                <Flame className="w-4 h-4 text-yellow-300 drop-shadow-md" />
                <span className="text-sm font-semibold">2 Day Streak</span>
              </div>
              <div className="flex items-center gap-2 bg-black/10 px-3 py-1.5 rounded-xl backdrop-blur-sm border border-white/5">
                <ArrowUp className="w-4 h-4 text-green-300 drop-shadow-md" />
                <span className="text-sm font-semibold">Top 15%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 pb-4">
          <Tabs defaultValue="students" onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-2 mb-6 bg-muted/40 p-1.5 rounded-2xl border border-border/50">
              <TabsTrigger value="students" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-foreground font-semibold py-2">
                <User className="w-4 h-4 mr-2" /> Top Students
              </TabsTrigger>
              <TabsTrigger value="universities" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:text-foreground font-semibold py-2">
                <GraduationCap className="w-4 h-4 mr-2" /> Universities
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="students" className="space-y-3 mt-0 animate-in fade-in duration-500 slide-in-from-bottom-4">
              {topStudents.map((student) => (
                <div 
                  key={student.id}
                  className={`flex items-center justify-between p-4 rounded-3xl border transition-all duration-300 hover:-translate-y-0.5 ${
                    student.isCurrentUser 
                      ? "bg-gradient-to-r from-primary/10 to-transparent border-primary/20 shadow-sm ring-1 ring-primary/10" 
                      : "bg-background/80 backdrop-blur-sm border-border/40 hover:shadow-md hover:border-border/80"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 flex justify-center font-black ${
                      student.rank === 1 ? "text-amber-500 text-2xl drop-shadow-sm" :
                      student.rank === 2 ? "text-slate-400 text-xl" :
                      student.rank === 3 ? "text-amber-700 text-lg" :
                      "text-muted-foreground"
                    }`}>
                      #{student.rank}
                    </div>
                    
                    <Avatar className={`w-12 h-12 shadow-sm ${
                      student.rank === 1 ? "ring-2 ring-amber-500 ring-offset-2 ring-offset-background" : 
                      student.rank === 2 ? "ring-2 ring-slate-400 ring-offset-2 ring-offset-background" :
                      student.rank === 3 ? "ring-2 ring-amber-700 ring-offset-2 ring-offset-background" : ""
                    }`}>
                      <AvatarFallback className={student.isCurrentUser ? "bg-primary text-primary-foreground font-bold text-lg" : "bg-muted text-foreground font-bold text-lg"}>
                        {student.avatar}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className="font-extrabold text-base tracking-tight">{student.name}</p>
                        {student.rank === 1 && <Award className="w-4 h-4 text-amber-500" />}
                      </div>
                      <p className="text-xs font-semibold text-primary">{student.uni}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-black text-lg text-foreground/90">{student.points}</p>
                    <div className="flex items-center justify-end gap-1.5 text-[11px] font-bold text-muted-foreground mt-0.5 bg-muted/50 px-2 py-0.5 rounded-full w-fit ml-auto">
                      <Flame className={`w-3 h-3 ${student.streak > 10 ? "text-orange-500 fill-orange-500/20" : "text-orange-400"}`} />
                      <span>{student.streak}</span>
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="universities" className="space-y-4 mt-0 animate-in fade-in duration-500 slide-in-from-bottom-4">
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-3xl p-5 mb-6 flex items-start gap-4 shadow-sm relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-xl" />
                <div className="p-3 bg-background rounded-2xl shadow-sm border border-primary/10 shrink-0">
                  <Trophy className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-1 text-foreground">Represent your University!</h3>
                  <p className="text-[13px] text-muted-foreground leading-relaxed font-medium">
                    Earn points for your university by upvoting helpful answers, maintaining study streaks, and creating quality posts.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {UNIVERSITY_RANKINGS.map((uni) => (
                  <div 
                    key={uni.rank}
                    className="flex items-center justify-between p-5 rounded-3xl border border-border/40 bg-background/80 backdrop-blur-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <div className="flex items-center gap-5">
                      <div className={`w-8 flex justify-center font-black ${
                        uni.rank === 1 ? "text-amber-500 text-3xl drop-shadow-sm" :
                        uni.rank === 2 ? "text-slate-400 text-2xl" :
                        uni.rank === 3 ? "text-amber-700 text-xl" :
                        "text-muted-foreground text-lg"
                      }`}>
                        #{uni.rank}
                      </div>
                      
                      <div>
                        <p className="font-extrabold text-lg tracking-tight mb-0.5">{uni.name}</p>
                        <p className="text-[13px] text-muted-foreground font-bold">{uni.score.toLocaleString()} pts</p>
                      </div>
                    </div>
                    
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm ${
                      uni.trend === "up" ? "bg-green-100 text-green-600 border border-green-200" :
                      uni.trend === "down" ? "bg-red-100 text-red-600 border border-red-200" :
                      "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}>
                      {uni.trend === "up" && <TrendingUp className="w-5 h-5" />}
                      {uni.trend === "down" && <TrendingUp className="w-5 h-5 rotate-180" />}
                      {uni.trend === "same" && <div className="w-4 h-0.5 bg-current rounded-full" />}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}
