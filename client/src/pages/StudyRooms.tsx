import React, { useState } from "react";
import { ArrowLeft, Users, MessageSquare, Clock, Video, Flame, Search, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function StudyRooms() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("FAST-NU");

  const rooms = [
    { id: 1, title: "CS-101 Midterm Prep", uni: "FAST-NU", participants: 12, host: "Ali K.", timeRemaining: "45:00", isLive: true, tags: ["Computer Science", "Midterm"] },
    { id: 2, title: "Physics Lab Report Help", uni: "NUST", participants: 4, host: "Sara M.", timeRemaining: "12:30", isLive: true, tags: ["Physics", "Lab"] },
    { id: 3, title: "Calculus III Silent Study (Pomodoro)", uni: "LUMS", participants: 28, host: "Omer F.", timeRemaining: "25:00", isLive: true, tags: ["Math", "Pomodoro"] },
    { id: 4, title: "DLD Past Papers Discussion", uni: "FAST-NU", participants: 8, host: "Hamza S.", timeRemaining: "05:15", isLive: true, tags: ["Engineering", "Past Papers"] }
  ];

  return (
    <div className="h-full flex flex-col bg-muted/10 relative overflow-hidden">
      <header className="px-6 py-4 bg-background sticky top-0 z-20 border-b shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="icon" className="-ml-2 hover:bg-muted/50" onClick={() => setLocation("/home")}>
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">Study Rooms</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Live Collaborative Learning</p>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search rooms or subjects..." 
            className="pl-9 h-10 rounded-xl bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/20" 
          />
        </div>
      </header>

      {/* University Hub Tabs */}
      <div className="bg-background border-b z-10">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex w-max p-2 px-4 gap-2">
            {["FAST-NU", "NUST", "LUMS", "PU", "UET", "COMSATS"].map((uni) => (
              <button
                key={uni}
                onClick={() => setActiveTab(uni)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  activeTab === uni 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                }`}
              >
                {uni}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Streak Banner */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-4 text-white shadow-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm">4 Day Study Streak!</h3>
              <p className="text-xs text-white/80">Join a room today to keep it alive.</p>
            </div>
          </div>
          <Button size="sm" className="bg-white text-red-600 hover:bg-white/90 rounded-full font-bold text-xs h-8">
            View Leaderboard
          </Button>
        </div>

        {/* Room List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Live Now at {activeTab}</h3>
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              14 Active
            </span>
          </div>

          {rooms.filter(r => r.uni === activeTab).length > 0 ? (
            rooms.filter(r => r.uni === activeTab).map((room) => (
              <div key={room.id} className="bg-background p-4 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-2 flex-wrap max-w-[70%]">
                    {room.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="bg-muted text-muted-foreground text-[9px] uppercase tracking-wider font-bold">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-primary font-bold text-xs bg-primary/10 px-2 py-1 rounded-lg">
                    <Clock className="w-3 h-3" />
                    {room.timeRemaining}
                  </div>
                </div>
                
                <h3 className="font-bold text-lg mb-2 leading-tight">{room.title}</h3>
                
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      <Avatar className="w-6 h-6 border-2 border-background">
                        <AvatarFallback className="text-[8px] bg-blue-100 text-blue-700">{room.host[0]}</AvatarFallback>
                      </Avatar>
                      <Avatar className="w-6 h-6 border-2 border-background">
                        <AvatarFallback className="text-[8px] bg-purple-100 text-purple-700">M</AvatarFallback>
                      </Avatar>
                      <Avatar className="w-6 h-6 border-2 border-background">
                        <AvatarFallback className="text-[8px] bg-green-100 text-green-700">A</AvatarFallback>
                      </Avatar>
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">
                      <span className="text-foreground font-bold">{room.host}</span> +{room.participants - 1} studying
                    </span>
                  </div>
                  <Button size="sm" className="rounded-xl h-8 px-4 font-bold shadow-sm shadow-primary/20 group-hover:bg-primary/90 transition-colors">
                    Join
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-muted/30 border border-dashed border-border rounded-2xl p-8 text-center flex flex-col items-center">
               <Video className="w-10 h-10 text-muted-foreground/30 mb-3" />
               <h3 className="font-bold text-sm mb-1">No active rooms</h3>
               <p className="text-xs text-muted-foreground mb-4">Be the first to start a study session at {activeTab}.</p>
               <Button variant="outline" className="rounded-xl">Start a Room</Button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
