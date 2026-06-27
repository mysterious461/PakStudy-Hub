import React, { useState } from "react";
import { ArrowLeft, Sparkles, Send, Paperclip, MoreVertical, Bot } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AiTutor() {
  const [, setLocation] = useLocation();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "ai",
      text: "Hi there! I'm your PakStudy Hub AI Tutor. I can help you understand complex topics, solve equations, or summarize your notes. What are we studying today?",
      time: "Just now"
    }
  ]);

  const handleSend = () => {
    if (!message.trim()) return;
    
    // Add user message
    const newMsg = {
      id: Date.now(),
      sender: "user",
      text: message,
      time: "Just now"
    };
    
    setMessages([...messages, newMsg]);
    setMessage("");
    
    // Simulate AI typing and response
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: "ai",
        text: "I'm a prototype AI in this mockup! In the real app, I'd analyze that based on top-tier educational models to give you step-by-step guidance.",
        time: "Just now"
      }]);
    }, 1500);
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 relative overflow-hidden">
      {/* Header */}
      <header className="px-4 py-4 pt-6 bg-white sticky top-0 z-20 shadow-[0_4px_20px_rgb(0,0,0,0.05)] border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="-ml-2 rounded-full hover:bg-slate-100" onClick={() => setLocation("/home")}>
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md shadow-blue-500/20">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-tight flex items-center gap-1">
                PakStudy AI <Sparkles className="w-3 h-3 text-blue-500" />
              </h1>
              <p className="text-[10px] uppercase tracking-wider font-bold text-blue-600">Online • Ready to help</p>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100">
          <MoreVertical className="w-5 h-5 text-slate-600" />
        </Button>
      </header>

      {/* Suggested Prompts */}
      {messages.length === 1 && (
        <div className="px-4 pt-6 pb-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1">Suggested for you</h3>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {[
              "Explain Object Oriented Programming",
              "Help me with Calculus derivatives",
              "How to write a lab report?",
              "Summarize the OSI model"
            ].map((prompt, i) => (
              <button 
                key={i}
                onClick={() => setMessage(prompt)}
                className="shrink-0 bg-white border border-slate-200 text-slate-600 text-xs font-medium px-4 py-2 rounded-2xl hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6 pb-24">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.sender === "user" ? "flex-row-reverse" : ""}`}>
              {msg.sender === "ai" && (
                <div className="w-8 h-8 shrink-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-sm">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              
              <div className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"} max-w-[75%]`}>
                <div className={`p-3.5 rounded-2xl shadow-sm text-[15px] leading-relaxed ${
                  msg.sender === "user" 
                    ? "bg-blue-600 text-white rounded-tr-sm" 
                    : "bg-white text-slate-800 rounded-tl-sm border border-slate-100"
                }`}>
                  {msg.text}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 font-medium">{msg.time}</span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200 p-4 pt-3 pb-8">
        <div className="flex items-center gap-2 max-w-lg mx-auto relative">
          <Button variant="ghost" size="icon" className="shrink-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full h-10 w-10">
            <Paperclip className="w-5 h-5" />
          </Button>
          <div className="relative flex-1">
            <Input 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask anything..." 
              className="pl-4 pr-12 h-12 rounded-full bg-slate-100/80 border-transparent focus-visible:ring-2 focus-visible:ring-blue-500/30 text-[15px]"
            />
            <Button 
              size="icon"
              onClick={handleSend}
              className={`absolute right-1 top-1 h-10 w-10 rounded-full transition-all duration-300 ${
                message.trim() 
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/30" 
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
