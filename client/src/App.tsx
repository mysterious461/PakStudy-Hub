import { Switch, Route } from "wouter";
import { useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { MobileShell } from "@/components/layout/MobileShell";
import { ContributorPortalLayout } from "@/components/contributor/ContributorPortalShell";
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
import AdminResources from "@/pages/AdminResources";
import AdminResourceReview from "@/pages/AdminResourceReview";
import AdminContactMessages from "@/pages/AdminContactMessages";
import AdminAcademicHierarchy from "@/pages/AdminAcademicHierarchy";
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
import ResourceSearch from "@/pages/ResourceSearch";
import ResourceDetail from "@/pages/ResourceDetail";
import { AboutPakStudy, AcademicIntegrityPolicy, ContactPage, ContributorGuidelines, CopyrightPolicy, HelpCenter, PrivacyPolicy, TermsOfService } from "@/pages/PortalInfoPages";

function Router() {
  const [location] = useLocation();
  const isContributorPortal =
    location === "/" ||
    location === "/contribute" ||
    location === "/profile" ||
    location === "/admin" ||
    location === "/admin/resources" ||
    location === "/admin/resources/review" ||
    location === "/admin/contact-messages" ||
    location === "/admin/academic-hierarchy" ||
    location.startsWith("/about") ||
    location.startsWith("/guidelines") ||
    location.startsWith("/help") ||
    location.startsWith("/contact") ||
    location.startsWith("/privacy") ||
    location.startsWith("/terms") ||
    location.startsWith("/copyright") ||
    location.startsWith("/academic-integrity") ||
    location.startsWith("/resources") ||
    location.startsWith("/contributors");

  if (location === "/auth" || location.startsWith("/auth?")) {
    return <Auth />;
  }

  if (isContributorPortal) {
    return (
      <ContributorPortalLayout>
        <Switch>
          <Route path="/" component={ContributorLanding} />
          <Route path="/contribute" component={ContributorLanding} />
          <Route path="/contributors" component={ContributorLanding} />
          <Route path="/contributors/dashboard" component={ContributorDashboard} />
          <Route path="/contributors/upload" component={ContributorUpload} />
          <Route path="/contributors/uploads" component={ContributorUploads} />
          <Route path="/resources/:resourceId" component={ResourceDetail} />
          <Route path="/resources" component={ResourceSearch} />
          <Route path="/profile" component={Profile} />
          <Route path="/admin/resources/review" component={AdminResourceReview} />
          <Route path="/admin/resources" component={AdminResources} />
          <Route path="/admin/contact-messages" component={AdminContactMessages} />
          <Route path="/admin/academic-hierarchy" component={AdminAcademicHierarchy} />
          <Route path="/admin" component={Admin} />
          <Route path="/about" component={AboutPakStudy} />
          <Route path="/guidelines" component={ContributorGuidelines} />
          <Route path="/help" component={HelpCenter} />
          <Route path="/contact" component={ContactPage} />
          <Route path="/privacy" component={PrivacyPolicy} />
          <Route path="/terms" component={TermsOfService} />
          <Route path="/copyright" component={CopyrightPolicy} />
          <Route path="/academic-integrity" component={AcademicIntegrityPolicy} />
          <Route component={NotFound} />
        </Switch>
      </ContributorPortalLayout>
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
        <Route path="/admin-upload" component={AdminUpload} />
        <Route path="/admin/resources/review" component={AdminResourceReview} />
        <Route path="/admin/resources" component={AdminResources} />
        <Route path="/admin" component={Admin} />
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

