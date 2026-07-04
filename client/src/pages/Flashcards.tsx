import React, { useEffect, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Share2, Bookmark, CheckCircle, Brain } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";

export default function Flashcards() {
  const [, setLocation] = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const [cards, setCards] = useState<any[]>([
    {
      id: 1,
      subject: "Computer Science",
      topic: "Data Structures",
      front: "What is the time complexity of searching in a perfectly balanced Binary Search Tree?",
      back: "O(log n) - because at each step, you eliminate half of the remaining nodes.",
      level: "Intermediate"
    },
    {
      id: 2,
      subject: "Physics",
      topic: "Mechanics",
      front: "State Newton's Second Law of Motion mathematically and conceptually.",
      back: "F = ma. The acceleration of an object is directly proportional to the net force acting on it and inversely proportional to its mass.",
      level: "Beginner"
    },
    {
      id: 3,
      subject: "Mathematics",
      topic: "Calculus",
      front: "What is the derivative of e^(2x)?",
      back: "2e^(2x) - Using the chain rule: d/dx[e^u] = e^u * du/dx, where u = 2x and du/dx = 2.",
      level: "Intermediate"
    }
  ]);

  useEffect(() => {
    apiRequest("GET", "/api/flashcards")
      .then((res) => res.json())
      .then((data) => {
        if (data.length > 0) setCards(data);
      })
      .catch(() => undefined);
  }, []);

  const nextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % cards.length);
    }, 150);
  };

  const prevCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    }, 150);
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-white relative overflow-hidden">
      <header className="px-6 py-4 sticky top-0 z-10 flex items-center justify-between">
        <Button variant="ghost" size="icon" className="-ml-2 hover:bg-white/10 text-white" onClick={() => setLocation("/home")}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-400" />
          <h1 className="text-sm font-bold tracking-widest uppercase">Quick Review</h1>
        </div>
        <div className="w-10" /> {/* Spacer */}
      </header>

      {/* Progress Bar */}
      <div className="px-6 mb-4">
        <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-purple-500 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
          />
        </div>
        <p className="text-center text-xs mt-2 text-white/50 font-bold uppercase tracking-wider">
          Card {currentIndex + 1} of {cards.length}
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative perspective-1000">
        <div 
          className="w-full max-w-sm aspect-[3/4] relative cursor-pointer group"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <motion.div
            className="w-full h-full relative preserve-3d"
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
          >
            {/* Front of card */}
            <div className="absolute inset-0 backface-hidden bg-white text-slate-900 rounded-3xl p-8 shadow-2xl flex flex-col">
              <div className="flex justify-between items-start mb-auto">
                <span className="text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-500 px-3 py-1 rounded-full">
                  {cards[currentIndex].subject}
                </span>
                <Bookmark className="w-5 h-5 text-slate-300 hover:text-slate-900 transition-colors" />
              </div>
              
              <div className="flex-1 flex items-center justify-center">
                <h2 className="text-2xl font-bold text-center leading-snug">
                  {cards[currentIndex].front}
                </h2>
              </div>
              
              <div className="mt-auto text-center">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Tap to flip</p>
              </div>
            </div>

            {/* Back of card */}
            <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-purple-600 to-indigo-700 text-white rounded-3xl p-8 shadow-2xl flex flex-col rotate-y-180">
               <div className="flex justify-between items-start mb-auto">
                <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">
                  Answer
                </span>
                <CheckCircle className="w-5 h-5 text-white/50" />
              </div>
              
              <div className="flex-1 flex items-center justify-center">
                <p className="text-xl font-medium text-center leading-relaxed">
                  {cards[currentIndex].back}
                </p>
              </div>
              
              <div className="mt-auto flex justify-center gap-4">
                <Button size="sm" variant="ghost" className="bg-white/10 hover:bg-white/20 rounded-full h-10 px-6 text-white border-none">Got it</Button>
                <Button size="sm" variant="ghost" className="bg-black/20 hover:bg-black/30 rounded-full h-10 px-6 text-white border-none">Needs review</Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="px-6 pb-12 flex justify-between items-center z-10">
        <Button 
          variant="ghost" 
          size="icon" 
          className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-30"
          onClick={prevCard}
        >
          <ChevronLeft className="w-8 h-8" />
        </Button>
        <div className="flex gap-4">
          <Button variant="ghost" size="icon" className="w-12 h-12 rounded-full text-white/50 hover:text-white hover:bg-white/10">
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 text-white"
          onClick={nextCard}
        >
          <ChevronRight className="w-8 h-8" />
        </Button>
      </div>
    </div>
  );
}
