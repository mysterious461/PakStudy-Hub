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
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
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
            <div className="w-64 h-64 rounded-2xl overflow-hidden mb-12 shadow-2xl ring-1 ring-border/50 bg-white flex items-center justify-center">
              <img 
                src={slides[currentSlide].image} 
                alt="Onboarding" 
                className={currentSlide === 0 ? "w-32 h-32 object-contain" : "w-full h-full object-cover"}
              />
            </div>
            
            <h1 className="text-3xl font-bold mb-4 font-sans tracking-tight text-foreground">
              {slides[currentSlide].title}
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-xs">
              {slides[currentSlide].description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="p-6 w-full z-10">
        <div className="flex justify-center space-x-2 mb-8">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>

        <Button 
          size="lg" 
          className="w-full text-lg h-14 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
          onClick={nextSlide}
        >
          {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
          <ChevronRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
