import { Switch, Route } from "wouter";
import { useLocation } from "wouter";
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
import AdminUpload from "@/pages/AdminUpload";
import AdminResourceReview from "@/pages/AdminResourceReview";
import Achievements from "@/pages/Achievements";
import Settings from "@/pages/Settings";
import Flashcards from "@/pages/Flashcards";
import StudyRooms from "@/pages/StudyRooms";
import Leaderboard from "@/pages/Leaderboard";
import AiTutor from "@/pages/AiTutor";
import AdminSupport from "@/pages/AdminSupport";
import MessagesList from "@/pages/MessagesList";
import DirectChat from "@/pages/DirectChat";
import ContributorLanding from "@/pages/ContributorLanding";
import ContributorDashboard from "@/pages/ContributorDashboard";
import ContributorUpload from "@/pages/ContributorUpload";
import ContributorUploads from "@/pages/ContributorUploads";

function Router() {
  const [location] = useLocation();
  const isContributorPortal = location === "/" || location === "/contribute" || location === "/profile" || location.startsWith("/contributors");

  if (location.startsWith("/auth?")) {
    return (
      <MobileShell>
        <Auth />
      </MobileShell>
    );
  }

  if (isContributorPortal) {
    return (
      <Switch>
        <Route path="/" component={ContributorLanding} />
        <Route path="/contribute" component={ContributorLanding} />
        <Route path="/contributors" component={ContributorLanding} />
        <Route path="/contributors/dashboard" component={ContributorDashboard} />
        <Route path="/contributors/upload" component={ContributorUpload} />
        <Route path="/contributors/uploads" component={ContributorUploads} />
        <Route path="/profile" component={Profile} />
        <Route component={NotFound} />
      </Switch>
    );
  }

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
        <Route path="/admin-upload" component={AdminUpload} />
        <Route path="/admin/resources/review" component={AdminResourceReview} />
        <Route path="/contributors/dashboard" component={ContributorDashboard} />
        <Route path="/contributors/upload" component={ContributorUpload} />
        <Route path="/contributors/uploads" component={ContributorUploads} />
        <Route path="/achievements" component={Achievements} />
        <Route path="/settings" component={Settings} />
        <Route path="/flashcards" component={Flashcards} />
        <Route path="/study-rooms" component={StudyRooms} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route path="/ai-tutor" component={AiTutor} />
        <Route path="/admin-support" component={AdminSupport} />
        <Route path="/messages" component={MessagesList} />
        <Route path="/chat/:id" component={DirectChat} />
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
