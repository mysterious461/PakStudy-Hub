import React, { useState } from "react";
import { useLocation } from "wouter";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Trophy, Flame, TrendingUp, Award, User, GraduationCap, ArrowUp } from "lucide-react";
import { UNIVERSITIES } from "@/lib/educationData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Mock data for leaderboards
const TOP_STUDENTS = [
  { id: "1", name: "Ali Khan", uni: "NUST", points: 2450, streak: 14, avatar: "AK", rank: 1 },
  { id: "2", name: "Fatima Ahmed", uni: "FAST-NU", points: 2100, streak: 8, avatar: "FA", rank: 2 },
  { id: "3", name: "Zainab Malik", uni: "LUMS", points: 1950, streak: 21, avatar: "ZM", rank: 3 },
  { id: "4", name: "Ahmed Raza", uni: "UET", points: 1820, streak: 5, avatar: "AR", rank: 4 },
  { id: "5", name: "Aisha Tariq", uni: "PU", points: 1600, streak: 12, avatar: "AT", rank: 5 },
  { id: "6", name: "Hassan Ali", uni: "COMSATS", points: 1450, streak: 3, avatar: "HA", rank: 6 },
  { id: "7", name: "You", uni: "NUST", points: 850, streak: 2, avatar: "ME", rank: 42, isCurrentUser: true }
];

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

  return (
    <div className="h-full flex flex-col bg-muted/10 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-background to-orange-500/5 backdrop-blur-[1px]" />
      </div>

      <header className="px-6 py-4 sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="-ml-2" onClick={() => setLocation("/home")}>
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h1 className="text-lg font-bold">Leaderboards</h1>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto relative z-10 pb-24">
        {/* User Stats Card */}
        <div className="px-4 py-4">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 text-white shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-10 translate-x-10" />
            
            <div className="relative z-10 flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12 border-2 border-white/20">
                  <AvatarFallback className="bg-white/20 text-white font-bold">ME</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-white/90 text-sm">Your Ranking</p>
                  <p className="text-2xl font-black">#42</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-white/90 text-sm">Total Points</p>
                <p className="text-2xl font-black">850</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 pt-4 border-t border-white/20">
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-yellow-200" />
                <span className="text-sm font-medium">2 Day Streak</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ArrowUp className="w-4 h-4 text-green-200" />
                <span className="text-sm font-medium">Top 15%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 pb-4">
          <Tabs defaultValue="students" onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-2 mb-4 bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="students" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <User className="w-4 h-4 mr-2" /> Top Students
              </TabsTrigger>
              <TabsTrigger value="universities" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <GraduationCap className="w-4 h-4 mr-2" /> Universities
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="students" className="space-y-3 mt-0 animate-in fade-in duration-300">
              {TOP_STUDENTS.map((student) => (
                <div 
                  key={student.id}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    student.isCurrentUser 
                      ? "bg-primary/5 border-primary/20 shadow-sm" 
                      : "bg-background border-border/50 hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 font-black text-center ${
                      student.rank === 1 ? "text-amber-500 text-xl" :
                      student.rank === 2 ? "text-slate-400 text-lg" :
                      student.rank === 3 ? "text-amber-700 text-lg" :
                      "text-muted-foreground"
                    }`}>
                      #{student.rank}
                    </div>
                    
                    <Avatar className={`w-10 h-10 ${
                      student.rank === 1 ? "ring-2 ring-amber-500 ring-offset-2 ring-offset-background" : ""
                    }`}>
                      <AvatarFallback className={student.isCurrentUser ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}>
                        {student.avatar}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-sm">{student.name}</p>
                        {student.rank === 1 && <Award className="w-3.5 h-3.5 text-amber-500" />}
                      </div>
                      <p className="text-xs text-muted-foreground">{student.uni}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-bold text-sm">{student.points}</p>
                    <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground mt-0.5">
                      <Flame className={`w-3 h-3 ${student.streak > 10 ? "text-orange-500" : "text-orange-300"}`} />
                      <span>{student.streak}</span>
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="universities" className="space-y-3 mt-0 animate-in fade-in duration-300">
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mb-4 flex items-start gap-3">
                <Trophy className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-primary/80 leading-relaxed">
                  Earn points for your university by upvoting helpful answers, maintaining study streaks, and creating quality posts!
                </p>
              </div>

              {UNIVERSITY_RANKINGS.map((uni) => (
                <div 
                  key={uni.rank}
                  className="flex items-center justify-between p-4 rounded-2xl border border-border/50 bg-background hover:bg-muted/30 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 font-black text-center ${
                      uni.rank === 1 ? "text-amber-500 text-2xl" :
                      uni.rank === 2 ? "text-slate-400 text-xl" :
                      uni.rank === 3 ? "text-amber-700 text-lg" :
                      "text-muted-foreground"
                    }`}>
                      #{uni.rank}
                    </div>
                    
                    <div>
                      <p className="font-bold text-base">{uni.name}</p>
                      <p className="text-xs text-muted-foreground font-medium">{uni.score.toLocaleString()} points</p>
                    </div>
                  </div>
                  
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    uni.trend === "up" ? "bg-green-100 text-green-600" :
                    uni.trend === "down" ? "bg-red-100 text-red-600" :
                    "bg-slate-100 text-slate-600"
                  }`}>
                    {uni.trend === "up" && <TrendingUp className="w-4 h-4" />}
                    {uni.trend === "down" && <TrendingUp className="w-4 h-4 rotate-180" />}
                    {uni.trend === "same" && <div className="w-3 h-0.5 bg-current rounded-full" />}
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}
