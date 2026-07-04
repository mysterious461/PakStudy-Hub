import React, { useState } from "react";
import { ArrowLeft, Send, Paperclip, MoreVertical, ShieldCheck, Check, CheckCheck } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";

export default function AdminSupport() {
  const [, setLocation] = useLocation();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "admin",
      text: "Hello! Welcome to PakStudy Hub Support. How can we help you today?",
      time: "10:00 AM",
      read: true
    }
  ]);

  const handleSend = async () => {
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
    
    try {
      const res = await apiRequest("POST", "/api/support/messages", { message });
      const ticket = await res.json();
      const latest = ticket.messages[ticket.messages.length - 1];
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: "admin",
        text: latest.text,
        time: "Just now",
        read: true
      }]);
    } catch (error: any) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: "admin",
        text: error.message || "Support is unavailable right now.",
        time: "Just now",
        read: true
      }]);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 relative overflow-hidden">
      {/* Header */}
      <header className="px-4 py-4 pt-6 bg-white sticky top-0 z-20 shadow-[0_4px_20px_rgb(0,0,0,0.05)] border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="-ml-2 rounded-full hover:bg-slate-100" onClick={() => setLocation("/profile")}>
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-md shadow-emerald-500/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-tight">
                Support & Help
              </h1>
              <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-600">Admin Team</p>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100">
          <MoreVertical className="w-5 h-5 text-slate-600" />
        </Button>
      </header>

      {/* Suggested Topics */}
      {messages.length === 1 && (
        <div className="px-4 pt-6 pb-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1">Common issues</h3>
          <div className="flex flex-wrap gap-2">
            {[
              "Report a user",
              "Payment issue",
              "Request subject addition",
              "Bug report"
            ].map((topic, i) => (
              <Badge 
                key={i}
                variant="outline"
                onClick={() => setMessage(`I need help with: ${topic}`)}
                className="bg-white border-slate-200 text-slate-600 cursor-pointer hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-300 py-1.5 px-3"
              >
                {topic}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Chat Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="flex justify-center mb-6">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-200/50 px-3 py-1 rounded-full">Today</span>
        </div>
        <div className="space-y-6 pb-24">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.sender === "user" ? "flex-row-reverse" : ""}`}>
              {msg.sender === "admin" && (
                <div className="w-8 h-8 shrink-0 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm">
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>
              )}
              
              <div className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"} max-w-[75%]`}>
                <div className={`p-3.5 rounded-2xl shadow-sm text-[14px] leading-relaxed ${
                  msg.sender === "user" 
                    ? "bg-emerald-600 text-white rounded-tr-sm" 
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
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200 p-4 pt-3 pb-8">
        <div className="flex items-center gap-2 max-w-lg mx-auto relative">
          <Button variant="ghost" size="icon" className="shrink-0 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full h-10 w-10">
            <Paperclip className="w-5 h-5" />
          </Button>
          <div className="relative flex-1">
            <Input 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..." 
              className="pl-4 pr-12 h-12 rounded-full bg-slate-100/80 border-transparent focus-visible:ring-2 focus-visible:ring-emerald-500/30 text-[15px]"
            />
            <Button 
              size="icon"
              onClick={handleSend}
              className={`absolute right-1 top-1 h-10 w-10 rounded-full transition-all duration-300 ${
                message.trim() 
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/30" 
                  : "bg-transparent text-slate-400 hover:bg-slate-200"
              }`}
            >
              <Send className={`w-4 h-4 ${message.trim() ? "ml-0.5" : ""}`} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
