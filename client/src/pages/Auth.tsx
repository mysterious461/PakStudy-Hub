import React, { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, Lock } from "lucide-react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import logoImage from "@assets/generated_images/minimalist_education_logo_with_book_and_crescent_moon_green.png";

export default function Auth() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setLocation("/home");
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save user to Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: name,
        email: email,
        role: "Student", // Default role
        university: "", // Placeholder
        subjects: [], // Placeholder
        grade: "Grade 12",
        track: "Pre-Engineering"
      });

      setLocation("/home");
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col relative p-6 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src="/src/assets/images/auth-bg.jpg" alt="Background" className="w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-background/95 backdrop-blur-sm" />
      </div>

      <div className="relative z-10 mb-8">
        <Button variant="ghost" size="icon" className="-ml-2" onClick={() => setLocation("/")}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
      </div>

      <div className="relative z-10 flex flex-col items-center mb-8">
        <img src={logoImage} alt="Logo" className="w-20 h-20 mb-4" />
        <h1 className="text-2xl font-bold">Welcome Back</h1>
        <p className="text-muted-foreground">Sign in to continue to your account</p>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto pb-4 scrollbar-hide">
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-8 h-12 bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="login" className="rounded-lg text-base">Login</TabsTrigger>
          <TabsTrigger value="register" className="rounded-lg text-base">Register</TabsTrigger>
        </TabsList>

        <TabsContent value="login">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input id="login-email" name="email" type="email" placeholder="student@example.com" className="pl-10 h-12 rounded-xl bg-muted/30 border-muted-foreground/20" required />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input id="login-password" name="password" type="password" placeholder="••••••••" className="pl-10 h-12 rounded-xl bg-muted/30 border-muted-foreground/20" required />
              </div>
            </div>

            <div className="flex justify-end">
              <a href="#" className="text-sm text-primary font-medium hover:underline">Forgot Password?</a>
            </div>

            <Button type="submit" className="w-full h-12 text-base rounded-xl mt-4" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Login"}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="register">
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reg-name">Full Name</Label>
              <Input id="reg-name" name="name" placeholder="Ali Khan" className="h-12 rounded-xl bg-muted/30 border-muted-foreground/20" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-email">Email</Label>
              <Input id="reg-email" name="email" type="email" placeholder="student@example.com" className="h-12 rounded-xl bg-muted/30 border-muted-foreground/20" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-password">Password</Label>
              <Input id="reg-password" name="password" type="password" placeholder="Create a password" className="h-12 rounded-xl bg-muted/30 border-muted-foreground/20" required />
            </div>
            <Button type="submit" className="w-full h-12 text-base rounded-xl mt-4" disabled={isLoading}>
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
        </TabsContent>
      </Tabs>

        <div className="mt-8 relative z-10">
          <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Button variant="outline" className="h-12 rounded-xl border-muted-foreground/20 text-muted-foreground font-medium" onClick={() => setLocation("/home")}>
             Continue as Guest
          </Button>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <Button variant="outline" className="h-12 rounded-xl border-muted-foreground/20">
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </Button>
            <Button variant="outline" className="h-12 rounded-xl border-muted-foreground/20">
               Apple
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
