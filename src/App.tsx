import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import Activity from "./pages/Activity";
import Community from "./pages/CommunityPage";
import Learn from "./pages/Learn";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import AlternativeChooser from "./pages/AlternativeChooser";
import BottomNav from "./components/BottomNav";
import { supabase } from "./integrations/supabase/client";
import Questionnaire from "./pages/Questionnaire";
import { ONBOARDING_DONE_KEY } from "./lib/onboarding";

const queryClient = new QueryClient();
const AUTH_BYPASS = true;

interface ProtectedLayoutProps {
  isLoading: boolean;
  session: Session | null;
}

const ProtectedLayout = ({ isLoading, session }: ProtectedLayoutProps) => {
  const location = useLocation();
  const onboardingDone = localStorage.getItem(ONBOARDING_DONE_KEY) === "true";

  if (!onboardingDone && location.pathname !== "/questionnaire") {
    return <Navigate to="/questionnaire" replace />;
  }

  if (AUTH_BYPASS) {
    return (
      <>
        <Outlet />
        <BottomNav />
      </>
    );
  }

  if (isLoading) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <>
      <Outlet />
      <BottomNav />
    </>
  );
};

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setIsLoading(false);
    };

    initializeSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={AUTH_BYPASS || session ? <Navigate to="/" replace /> : <Auth />} />
            <Route element={<ProtectedLayout isLoading={isLoading} session={session} />}>
              <Route path="/" element={<Index />} />
              <Route path="/activity" element={<Activity />} />
              <Route path="/community" element={<Community />} />
              <Route path="/learn" element={<Learn />} />
              <Route path="/alternatives" element={<AlternativeChooser />} />
              <Route path="/questionnaire" element={<Questionnaire />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
