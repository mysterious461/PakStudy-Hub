import React, { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import logoImage from "@assets/generated_images/minimalist_education_logo_with_book_and_crescent_moon_green.png";

const slides = [
  {
    title: "Welcome to PakStudy Hub",
    description: "The largest community of students and teachers in Pakistan. Connect, learn, and grow together.",
    image: logoImage
  },
  {
    title: "Ask Questions, Get Answers",
    description: "Stuck on a problem? Post it here and get help from experts and fellow students.",
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=1000"
  },
  {
    title: "Prepare for Exams",
    description: "Access past papers, notes, and study materials shared by the community.",
    image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=1000"
  }
];

export default function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [, setLocation] = useLocation();

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(curr => curr + 1);
    } else {
      setLocation("/auth");
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(curr => curr - 1);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50, scale: 0.95 }}
            transition={{ duration: 0.4, type: "spring", bounce: 0.2 }}
            className="flex flex-col items-center w-full touch-none"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(e, { offset }) => {
              if (offset.x < -50) {
                nextSlide();
              } else if (offset.x > 50) {
                prevSlide();
              }
            }}
          >
            <div className="w-72 h-72 rounded-3xl overflow-hidden mb-12 shadow-2xl ring-1 ring-border/50 bg-white flex items-center justify-center relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-black/5 to-transparent z-10" />
              <img 
                src={slides[currentSlide].image} 
                alt="Onboarding" 
                className={currentSlide === 0 ? "w-40 h-40 object-contain drop-shadow-xl" : "w-full h-full object-cover"}
              />
            </div>
            
            <h1 className="text-4xl font-extrabold mb-4 font-sans tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
              {slides[currentSlide].title}
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-xs font-medium">
              {slides[currentSlide].description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="p-8 w-full z-10 bg-gradient-to-t from-background via-background/90 to-transparent">
        <div className="flex justify-center space-x-2 mb-8">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`h-2.5 rounded-full transition-all duration-500 ${
                index === currentSlide ? "w-10 bg-primary shadow-md shadow-primary/40" : "w-2.5 bg-muted-foreground/20 hover:bg-muted-foreground/40"
              }`}
            />
          ))}
        </div>

        <Button 
          size="lg" 
          className="w-full text-lg h-16 rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all font-bold group"
          onClick={nextSlide}
        >
          {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
          <ChevronRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </div>
  );
}
