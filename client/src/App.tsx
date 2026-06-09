import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { MobileShell } from "@/components/layout/MobileShell";
import NotFound from "@/pages/not-found";
import Onboarding from "@/pages/Onboarding";
import Auth from "@/pages/Auth";
import Home from "@/pages/Home";
import Subjects from "@/pages/Subjects";
import Post from "@/pages/Post";
import Profile from "@/pages/Profile";
import QuestionDetail from "@/pages/QuestionDetail";
import Sell from "@/pages/Sell";
import Library from "@/pages/Library";
import Admin from "@/pages/Admin";
import Achievements from "@/pages/Achievements";
import Settings from "@/pages/Settings";
import Flashcards from "@/pages/Flashcards";
import StudyRooms from "@/pages/StudyRooms";
import Leaderboard from "@/pages/Leaderboard";

function Router() {
  return (
    <MobileShell>
      <Switch>
        <Route path="/" component={Onboarding} />
        <Route path="/auth" component={Auth} />
        <Route path="/home" component={Home} />
        <Route path="/subjects" component={Subjects} />
        <Route path="/post" component={Post} />
        <Route path="/sell" component={Sell} />
        <Route path="/profile" component={Profile} />
        <Route path="/library" component={Library} />
        <Route path="/question/:id" component={QuestionDetail} />
        <Route path="/admin" component={Admin} />
        <Route path="/achievements" component={Achievements} />
        <Route path="/settings" component={Settings} />
        <Route path="/flashcards" component={Flashcards} />
        <Route path="/study-rooms" component={StudyRooms} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route component={NotFound} />
      </Switch>
    </MobileShell>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Router />
    </QueryClientProvider>
  );
}

export default App;
