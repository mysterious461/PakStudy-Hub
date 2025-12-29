import React from "react";
import { BottomNav } from "@/components/layout/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Calculator, FlaskConical, Globe, Languages, Laptop } from "lucide-react";

const subjects = [
  { name: "Mathematics", icon: Calculator, color: "bg-blue-100 text-blue-600" },
  { name: "Physics", icon: FlaskConical, color: "bg-purple-100 text-purple-600" },
  { name: "Chemistry", icon: FlaskConical, color: "bg-green-100 text-green-600" },
  { name: "Computer Science", icon: Laptop, color: "bg-orange-100 text-orange-600" },
  { name: "English", icon: Languages, color: "bg-pink-100 text-pink-600" },
  { name: "Urdu", icon: Languages, color: "bg-emerald-100 text-emerald-600" },
  { name: "Pak Studies", icon: Globe, color: "bg-teal-100 text-teal-600" },
  { name: "Islamiyat", icon: BookOpen, color: "bg-indigo-100 text-indigo-600" },
];

export default function Subjects() {
  return (
    <div className="h-full flex flex-col bg-muted/10 relative">
      <header className="px-6 py-6 bg-background sticky top-0 z-10 border-b border-border/50">
        <h1 className="text-2xl font-bold tracking-tight">Browse Subjects</h1>
        <p className="text-muted-foreground mt-1">Select a subject to view resources</p>
      </header>

      <div className="flex-1 overflow-y-auto p-6 pb-24">
        <div className="grid grid-cols-2 gap-4">
          {subjects.map((subject) => (
            <Card key={subject.name} className="hover:shadow-md transition-shadow cursor-pointer border-border/50">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-4">
                <div className={`p-4 rounded-full ${subject.color}`}>
                  <subject.icon className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold">{subject.name}</h3>
                  <Badge variant="secondary" className="text-[10px]">120+ Resources</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
