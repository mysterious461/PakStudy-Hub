import React, { useEffect, useState } from "react";
import { ArrowLeft, MessageSquare, ShieldCheck, Search, Users, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";

export default function MessagesList() {
  const [, setLocation] = useLocation();
  const [chats, setChats] = useState<any[]>([]);

  useEffect(() => {
    apiRequest("GET", "/api/messages")
      .then((res) => res.json())
      .then(setChats)
      .catch(() => setChats([]));
  }, []);

  return (
    <div className="h-full flex flex-col bg-slate-50 relative overflow-hidden">
      <header className="px-4 py-4 pt-6 bg-white sticky top-0 z-20 shadow-[0_4px_20px_rgb(0,0,0,0.05)] border-b border-slate-100">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" className="-ml-2 rounded-full hover:bg-slate-100" onClick={() => setLocation("/home")}>
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </Button>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 leading-tight">Messages</h1>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Connect with students</p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search messages..." 
            className="pl-11 h-11 rounded-2xl bg-slate-100/80 border-transparent focus-visible:ring-2 focus-visible:ring-primary/20"
          />
        </div>
      </header>

      <ScrollArea className="flex-1 p-4 pb-24">
        {/* Support Section */}
        <div className="mb-6 space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-2">Support</h2>
          <div 
            className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md hover:border-emerald-200 transition-all group"
            onClick={() => setLocation("/admin-support")}
          >
             <div className="flex items-center gap-3">
               <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                  <ShieldCheck className="w-6 h-6 text-emerald-600 group-hover:text-white transition-colors" />
               </div>
               <div>
                  <h3 className="font-bold text-slate-900">Admin Support</h3>
                  <p className="text-xs text-slate-500">Help, reports, and questions</p>
               </div>
             </div>
             <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
          </div>
        </div>

        {/* Direct Messages Section */}
        <div className="space-y-2">
           <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-2">Direct Messages</h2>
           
           <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
             {chats.map((chat, idx) => (
               <React.Fragment key={chat.id}>
                 <div 
                   className="p-4 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors"
                   onClick={() => setLocation(`/chat/${chat.id}`)}
                 >
                   <div className="relative">
                     <Avatar className="w-12 h-12 border border-slate-200">
                       <AvatarFallback className="bg-primary/10 text-primary font-bold">{chat.id.charAt(0)}</AvatarFallback>
                     </Avatar>
                     {chat.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />}
                   </div>
                   <div className="flex-1 min-w-0">
                     <div className="flex justify-between items-baseline mb-1">
                       <h3 className="font-bold text-slate-900 truncate">{chat.id}</h3>
                       <span className="text-[10px] font-medium text-slate-400 shrink-0 ml-2">{new Date(chat.updatedAt).toLocaleDateString()}</span>
                     </div>
                     <p className={`text-xs truncate ${chat.unreadCount ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>
                       {chat.lastMessage}
                     </p>
                   </div>
                   {chat.unreadCount > 0 && (
                     <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                       <span className="text-[10px] font-bold text-white">{chat.unreadCount}</span>
                     </div>
                   )}
                 </div>
                 {idx < chats.length - 1 && <div className="h-px bg-slate-100 ml-16" />}
               </React.Fragment>
             ))}
           </div>
        </div>
      </ScrollArea>
    </div>
  );
}
