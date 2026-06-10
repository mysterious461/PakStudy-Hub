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
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3" />
        <img src="/src/assets/images/auth-bg.jpg" alt="Background" className="w-full h-full object-cover opacity-5 mix-blend-overlay" />
        <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 mb-6">
        <Button variant="ghost" size="icon" className="-ml-2 hover:bg-muted/50 rounded-full transition-colors" onClick={() => setLocation("/")}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
      </div>

      <div className="relative z-10 flex flex-col items-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="w-24 h-24 bg-white rounded-3xl shadow-xl shadow-primary/10 flex items-center justify-center p-2 mb-6 ring-1 ring-border/50 relative overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent z-0" />
           <img src={logoImage} alt="Logo" className="w-full h-full object-contain relative z-10 drop-shadow-sm" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70 mb-2">Welcome Back</h1>
        <p className="text-muted-foreground font-medium text-center max-w-[250px]">Sign in to continue to your educational journey</p>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto pb-8 scrollbar-hide animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="bg-background/60 backdrop-blur-xl border border-border/50 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-10 translate-x-10" />
          
          <Tabs defaultValue="login" className="w-full relative z-10">
            <TabsList className="w-full grid grid-cols-2 mb-8 h-14 bg-muted/40 p-1.5 rounded-2xl border border-border/50">
              <TabsTrigger value="login" className="rounded-xl text-base font-semibold data-[state=active]:shadow-md data-[state=active]:bg-background py-2 transition-all">Login</TabsTrigger>
              <TabsTrigger value="register" className="rounded-xl text-base font-semibold data-[state=active]:shadow-md data-[state=active]:bg-background py-2 transition-all">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground ml-1">Email</Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input id="login-email" name="email" type="email" placeholder="student@example.com" className="pl-12 h-12 rounded-xl bg-muted/40 border-transparent focus-visible:ring-2 ring-primary/20 transition-all font-medium" required />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground ml-1">Password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input id="login-password" name="password" type="password" placeholder="••••••••" className="pl-12 h-12 rounded-xl bg-muted/40 border-transparent focus-visible:ring-2 ring-primary/20 transition-all font-medium" required />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <a href="#" className="text-[13px] text-primary font-bold hover:underline">Forgot Password?</a>
                </div>

                <Button type="submit" className="w-full h-14 text-base font-bold rounded-2xl mt-6 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Login"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-name" className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground ml-1">Full Name</Label>
                  <Input id="reg-name" name="name" placeholder="Ali Khan" className="h-12 rounded-xl bg-muted/40 border-transparent focus-visible:ring-2 ring-primary/20 transition-all font-medium px-4" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email" className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground ml-1">Email</Label>
                  <Input id="reg-email" name="email" type="email" placeholder="student@example.com" className="h-12 rounded-xl bg-muted/40 border-transparent focus-visible:ring-2 ring-primary/20 transition-all font-medium px-4" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password" className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground ml-1">Password</Label>
                  <Input id="reg-password" name="password" type="password" placeholder="Create a password" className="h-12 rounded-xl bg-muted/40 border-transparent focus-visible:ring-2 ring-primary/20 transition-all font-medium px-4" required />
                </div>
                <Button type="submit" className="w-full h-14 text-base font-bold rounded-2xl mt-6 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all" disabled={isLoading}>
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-8 relative z-10">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-wider">
                <span className="bg-background px-3 text-muted-foreground rounded-full">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <Button variant="outline" className="h-12 rounded-xl border-border/60 bg-muted/20 text-foreground font-semibold hover:bg-muted/40 transition-colors" onClick={() => setLocation("/home")}>
                 Continue as Guest
              </Button>
              <div className="grid grid-cols-2 gap-3 mt-1">
                <Button variant="outline" className="h-12 rounded-xl border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors font-semibold">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Google
                </Button>
                <Button variant="outline" className="h-12 rounded-xl border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors font-semibold">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.15 2.95.97 3.67 2.32-3.13 1.93-2.6 6.31.5 7.6-.66 1.34-1.63 2.53-2.82 3.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                  Apple
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
