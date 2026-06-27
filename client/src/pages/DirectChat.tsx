import React, { useState } from "react";
import { ArrowLeft, Send, Paperclip, MoreVertical, Check, CheckCheck, User, X } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function DirectChat() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/chat/:id");
  const userName = params?.id || "Student";
  
  const [message, setMessage] = useState("");
  const [requestStatus, setRequestStatus] = useState<"pending" | "accepted" | "rejected">("pending");
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "user",
      text: `Hi, I saw your question about Data Structures. I can help if you want!`,
      time: "10:00 AM",
      read: true
    }
  ]);

  const handleSend = () => {
    if (!message.trim()) return;
    
    const newMsg = {
      id: Date.now(),
      sender: "user",
      text: message,
      time: "Just now",
      read: false
    };
    
    setMessages([...messages, newMsg]);
    setMessage("");
  };

  const acceptRequest = () => setRequestStatus("accepted");
  const rejectRequest = () => setRequestStatus("rejected");

  return (
    <div className="h-full flex flex-col bg-slate-50 relative overflow-hidden">
      {/* Header */}
      <header className="px-4 py-4 pt-6 bg-white sticky top-0 z-20 shadow-[0_4px_20px_rgb(0,0,0,0.05)] border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="-ml-2 rounded-full hover:bg-slate-100" onClick={() => setLocation("/messages")}>
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border border-slate-200">
              <AvatarFallback className="bg-primary/10 text-primary">{userName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-tight">
                {userName}
              </h1>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Computer Science</p>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100">
          <MoreVertical className="w-5 h-5 text-slate-600" />
        </Button>
      </header>

      {/* Chat Request Banner */}
      {requestStatus === "pending" && (
        <div className="bg-primary/5 border-b border-primary/20 p-4 animate-in slide-in-from-top-4">
          <div className="flex items-start gap-3">
             <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
               <User className="w-4 h-4 text-primary" />
             </div>
             <div>
                <h3 className="text-sm font-bold text-foreground">Chat Request</h3>
                <p className="text-xs text-muted-foreground mt-1 mb-3">{userName} wants to connect with you to discuss study materials.</p>
                <div className="flex gap-2">
                  <Button size="sm" className="h-8 rounded-full text-xs font-bold" onClick={acceptRequest}>Accept</Button>
                  <Button size="sm" variant="outline" className="h-8 rounded-full text-xs font-bold" onClick={rejectRequest}>Decline</Button>
                </div>
             </div>
          </div>
        </div>
      )}
      
      {requestStatus === "rejected" && (
        <div className="bg-destructive/10 border-b border-destructive/20 p-4 text-center">
           <p className="text-xs font-bold text-destructive">You declined the chat request.</p>
        </div>
      )}

      {/* Chat Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="flex justify-center mb-6">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-200/50 px-3 py-1 rounded-full">Today</span>
        </div>
        <div className={`space-y-6 pb-24 ${requestStatus !== 'accepted' ? 'opacity-50 pointer-events-none' : ''}`}>
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.sender === "user" ? "flex-row-reverse" : ""}`}>
              {msg.sender === "other" && (
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">{userName.charAt(0)}</AvatarFallback>
                </Avatar>
              )}
              
              <div className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"} max-w-[75%]`}>
                <div className={`p-3.5 rounded-2xl shadow-sm text-[14px] leading-relaxed ${
                  msg.sender === "user" 
                    ? "bg-primary text-primary-foreground rounded-tr-sm" 
                    : "bg-white text-slate-800 rounded-tl-sm border border-slate-100"
                }`}>
                  {msg.text}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-[10px] text-slate-400 font-medium">{msg.time}</span>
                  {msg.sender === "user" && (
                    msg.read ? <CheckCheck className="w-3 h-3 text-blue-500" /> : <Check className="w-3 h-3 text-slate-400" />
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {requestStatus === "accepted" && (
             <div className="flex justify-center mt-4">
               <span className="text-xs text-muted-foreground bg-muted/50 px-4 py-1.5 rounded-full font-medium">
                 You accepted the request. You can now chat.
               </span>
             </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200 p-4 pt-3 pb-8">
        {requestStatus !== "accepted" ? (
          <div className="text-center py-2 text-sm text-muted-foreground font-medium">
             {requestStatus === "pending" ? "Accept request to reply" : "Chat unavailable"}
          </div>
        ) : (
          <div className="flex items-center gap-2 max-w-lg mx-auto relative">
            <Button variant="ghost" size="icon" className="shrink-0 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-full h-10 w-10">
              <Paperclip className="w-5 h-5" />
            </Button>
            <div className="relative flex-1">
              <Input 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Message..." 
                className="pl-4 pr-12 h-12 rounded-full bg-slate-100/80 border-transparent focus-visible:ring-2 focus-visible:ring-primary/30 text-[15px]"
              />
              <Button 
                size="icon"
                onClick={handleSend}
                className={`absolute right-1 top-1 h-10 w-10 rounded-full transition-all duration-300 ${
                  message.trim() 
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/30" 
                    : "bg-transparent text-slate-400 hover:bg-slate-200"
                }`}
              >
                <Send className={`w-4 h-4 ${message.trim() ? "ml-0.5" : ""}`} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
