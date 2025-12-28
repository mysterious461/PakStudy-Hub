import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { MobileShell } from "@/components/layout/MobileShell";
import NotFound from "@/pages/not-found";
import Onboarding from "@/pages/Onboarding";
import Auth from "@/pages/Auth";
import Home from "@/pages/Home";

function Router() {
  return (
    <MobileShell>
      <Switch>
        <Route path="/" component={Onboarding} />
        <Route path="/auth" component={Auth} />
        <Route path="/home" component={Home} />
        <Route path="/subjects" component={() => <Home />} /> {/* Mock */}
        <Route path="/post" component={() => <Home />} /> {/* Mock */}
        <Route path="/profile" component={() => <Home />} /> {/* Mock */}
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
