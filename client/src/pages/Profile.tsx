import React, { useEffect, useState } from "react";
import { Award, CalendarDays, Home, Loader2, LockKeyhole, LogOut, Save, UserRound } from "lucide-react";
import { useLocation } from "wouter";
import { sendPasswordResetEmail, signOut, updateProfile as updateAuthProfile } from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ContributorPortalShell } from "@/components/contributor/ContributorPortalShell";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";
import { apiRequest } from "@/lib/queryClient";

const initialProfile = {
  name: "",
  email: "",
  university: "",
  department: "",
  degree: "",
  grade: "",
  bio: "",
};

const emptyStats = {
  reputationPoints: 0,
  badgeStatus: "Not started",
  totalUploads: 0,
  approvedUploads: 0,
};

export default function Profile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const user = auth.currentUser;
  const [profile, setProfile] = useState(initialProfile);
  const [savedProfile, setSavedProfile] = useState<any>(null);
  const [stats, setStats] = useState(emptyStats);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLocation("/auth?returnTo=/profile");
      return;
    }

    void apiRequest("POST", "/api/users/me").catch(() => undefined);
    void apiRequest("GET", "/api/contributor/stats")
      .then((response) => response.json())
      .then(setStats)
      .catch(() => setStats(emptyStats));

    const unsubscribe = onSnapshot(doc(db, "users", user.uid), (snapshot) => {
      const data = snapshot.exists() ? snapshot.data() : {};
      const nextProfile = {
        name: data.name || user.displayName || "",
        email: data.email || user.email || "",
        university: data.university || "",
        department: data.department || "",
        degree: data.degree || data.track || "",
        grade: data.grade || "",
        bio: data.bio || "",
      };
      setProfile(nextProfile);
      setSavedProfile({ ...data, createdAt: data.createdAt });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, setLocation]);

  const updateField = (field: keyof typeof initialProfile, value: string) => {
    setProfile((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateAuthProfile(user, { displayName: profile.name.trim() || user.displayName });
      await setDoc(doc(db, "users", user.uid), {
        name: profile.name.trim(),
        email: profile.email || user.email,
        university: profile.university.trim(),
        department: profile.department.trim(),
        degree: profile.degree.trim(),
        grade: profile.grade.trim(),
        track: profile.degree.trim(),
        bio: profile.bio.trim(),
        updatedAt: new Date(),
      }, { merge: true });
      await apiRequest("PATCH", "/api/users/me/profile", {
        name: profile.name.trim(),
        university: profile.university.trim(),
        grade: profile.grade.trim(),
        track: profile.degree.trim(),
        bio: profile.bio.trim(),
      });
      setIsEditing(false);
      toast({ title: "Profile updated", description: "Your contributor profile has been saved." });
    } catch (error: any) {
      toast({ title: "Profile not saved", description: error.message || "Please try again.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    await sendPasswordResetEmail(auth, user.email);
    toast({ title: "Password reset email sent", description: "Firebase Auth will handle the password change securely." });
  };

  const handleLogout = async () => {
    await signOut(auth);
    setLocation("/contribute");
  };

  return (
    <ContributorPortalShell>
      <div className="min-h-[calc(100vh-170px)] bg-muted/10">
        <header className="border-b bg-background shadow-sm">
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-5 sm:px-6">
            <Button variant="outline" className="rounded-2xl font-bold" onClick={() => setLocation("/contribute")}>
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
            <div>
              <h1 className="text-xl font-black">Contributor Profile</h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Academic identity</p>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          {isLoading ? (
            <div className="flex min-h-80 items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading profile
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
              <Card className="border-border/60 shadow-sm">
                <CardContent className="p-6 text-center">
                  <Avatar className="mx-auto h-24 w-24 border-4 border-background shadow-lg">
                    <AvatarImage src={user?.photoURL || ""} />
                    <AvatarFallback className="bg-primary/10 text-3xl font-black text-primary">
                      {(profile.name || user?.email || "C").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="mt-4 text-2xl font-black">{profile.name || "Student Contributor"}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{profile.email}</p>
                  <Badge variant="outline" className="mt-4 rounded-full border-primary/20 bg-primary/10 px-4 py-1.5 text-primary">
                    {stats.badgeStatus}
                  </Badge>

                  <div className="mt-6 grid grid-cols-2 gap-3 text-left">
                    <MiniStat label="Reputation" value={stats.reputationPoints} icon={Award} />
                    <MiniStat label="Approved" value={stats.approvedUploads} icon={UserRound} />
                  </div>

                  <div className="mt-5 rounded-2xl border border-border/60 bg-muted/20 p-4 text-left">
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                      Member since
                    </div>
                    <p className="font-semibold">{formatDate(savedProfile?.createdAt)}</p>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-5">
                <Card className="border-border/60 shadow-sm">
                  <CardContent className="p-6">
                    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-lg font-black">Academic Details</h2>
                        <p className="text-sm text-muted-foreground">Keep this accurate so reviewers understand your context.</p>
                      </div>
                      <Button variant={isEditing ? "default" : "outline"} className="rounded-2xl font-bold" onClick={() => isEditing ? void handleSave() : setIsEditing(true)} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {isEditing ? "Save Profile" : "Edit Profile"}
                      </Button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <ProfileField label="Full name" value={profile.name} editing={isEditing} onChange={(value) => updateField("name", value)} />
                      <ProfileField label="Email" value={profile.email} editing={false} onChange={() => undefined} />
                      <ProfileField label="University" value={profile.university} editing={isEditing} placeholder="National University of Sciences and Technology" onChange={(value) => updateField("university", value)} />
                      <ProfileField label="Department" value={profile.department} editing={isEditing} placeholder="School of Avionics and Electrical Engineering" onChange={(value) => updateField("department", value)} />
                      <ProfileField label="Degree program" value={profile.degree} editing={isEditing} placeholder="MS Avionics Engineering" onChange={(value) => updateField("degree", value)} />
                      <ProfileField label="Study level" value={profile.grade} editing={isEditing} placeholder="Undergraduate, Masters, PhD" onChange={(value) => updateField("grade", value)} />
                      <div className="space-y-2 sm:col-span-2">
                        <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Bio</Label>
                        {isEditing ? (
                          <Textarea className="min-h-28 resize-none" value={profile.bio} placeholder="Tell other students what you study and what resources you like to share." onChange={(event) => updateField("bio", event.target.value)} />
                        ) : (
                          <div className="min-h-20 rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm leading-7 text-muted-foreground">
                            {profile.bio || "No bio added yet."}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/60 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <LockKeyhole className="h-5 w-5 text-primary" />
                          <h2 className="font-black">Change Password</h2>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          Password changes are handled through Firebase Auth email reset.
                        </p>
                      </div>
                      <Button variant="outline" className="rounded-2xl font-bold" onClick={handlePasswordReset}>Send Reset Email</Button>
                    </div>
                  </CardContent>
                </Card>

                <Button variant="destructive" className="h-12 rounded-2xl font-bold" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ContributorPortalShell>
  );
}

function ProfileField({ label, value, editing, placeholder, onChange }: { label: string; value: string; editing: boolean; placeholder?: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</Label>
      {editing ? (
        <Input value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <div className="flex min-h-10 items-center rounded-xl border border-border/60 bg-muted/20 px-3 text-sm font-semibold">
          {value || "Not added"}
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background p-4">
      <Icon className="mb-3 h-5 w-5 text-primary" />
      <p className="text-2xl font-black">{value}</p>
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
    </div>
  );
}

function formatDate(value: any) {
  const raw = typeof value?.toDate === "function" ? value.toDate() : value;
  const date = raw ? new Date(raw) : null;
  if (!date || Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}
