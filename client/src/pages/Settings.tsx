import React, { useState, useEffect } from "react";
import { ArrowLeft, Bell, Shield, Moon, Globe, LogOut, ChevronRight, Check } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [privateProfile, setPrivateProfile] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleDarkMode = (checked: boolean) => {
    const root = document.documentElement;
    if (checked) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    setIsDarkMode(checked);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setLocation("/auth");
    } catch (error: any) {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="h-full flex flex-col bg-muted/10 relative overflow-hidden">
      <header className="px-6 py-4 bg-background sticky top-0 z-10 border-b flex items-center gap-4 shadow-sm">
        <Button variant="ghost" size="icon" className="-ml-2 hover:bg-muted/50" onClick={() => setLocation("/profile")}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-lg font-bold truncate">Settings</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-24">
        
        {/* Account Settings */}
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 px-1">Account & Preferences</h3>
          <Card className="border-border/50 shadow-sm overflow-hidden bg-background">
            <CardContent className="p-0 divide-y divide-border/50">
              <div className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Language</p>
                    <p className="text-xs text-muted-foreground">English (US)</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
              
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                    <Moon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Dark Mode</p>
                    <p className="text-xs text-muted-foreground">Adjust app appearance</p>
                  </div>
                </div>
                <Switch checked={isDarkMode} onCheckedChange={toggleDarkMode} />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Notifications */}
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 px-1">Notifications</h3>
          <Card className="border-border/50 shadow-sm overflow-hidden bg-background">
            <CardContent className="p-0 divide-y divide-border/50">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Push Notifications</p>
                    <p className="text-xs text-muted-foreground">Alerts for answers and messages</p>
                  </div>
                </div>
                <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
              </div>
              
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Email Summaries</p>
                    <p className="text-xs text-muted-foreground">Weekly digest of activities</p>
                  </div>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Privacy */}
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 px-1">Privacy</h3>
          <Card className="border-border/50 shadow-sm overflow-hidden bg-background">
            <CardContent className="p-0">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Private Profile</p>
                    <p className="text-xs text-muted-foreground">Hide profile from search</p>
                  </div>
                </div>
                <Switch checked={privateProfile} onCheckedChange={setPrivateProfile} />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Actions */}
        <section className="pt-4">
          <Button 
            variant="outline" 
            className="w-full text-destructive border-destructive/20 hover:bg-destructive/10 h-12 rounded-xl text-sm font-bold shadow-sm"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log Out
          </Button>
          <p className="text-center text-xs text-muted-foreground mt-6">PakStudy Hub v1.0.0</p>
        </section>

      </div>
    </div>
  );
}