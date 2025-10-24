import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Elections from "./pages/admin/Elections";
import Voters from "./pages/admin/Voters";
import Candidates from "./pages/admin/Candidates";
import Admins from "./pages/admin/Admins";
import Results from "./pages/admin/Results";
import AuditLogs from "./pages/admin/AuditLogs";
import Positions from "./pages/admin/Positions";
import Files from "./pages/admin/Files";
import Analytics from "./pages/admin/Analytics";
import Requirements from "./pages/admin/Requirements";
import Profile from "./pages/voter/Profile";
import Vote from "./pages/voter/Vote";
import CandidateRegister from "./pages/candidate/Register";
import MyCandidacy from "./pages/candidate/MyCandidacy";
import CandidatesList from "./pages/Candidates";
import ViewRequirements from "./pages/candidate/ViewRequirements";

import AnonymousVote from "./pages/AnonymousVote";
import PublicResults from "./pages/Results";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin/elections" element={<Elections />} />
          <Route path="/admin/positions" element={<Positions />} />
          <Route path="/admin/voters" element={<Voters />} />
          <Route path="/admin/candidates" element={<Candidates />} />
          <Route path="/admin/admins" element={<Admins />} />
          <Route path="/admin/results" element={<Results />} />
          <Route path="/admin/files" element={<Files />} />
          <Route path="/admin/analytics" element={<Analytics />} />
          <Route path="/admin/requirements" element={<Requirements />} />
          <Route path="/admin/audit-logs" element={<AuditLogs />} />
          <Route path="/voter/profile" element={<Profile />} />
          <Route path="/voter/vote" element={<Vote />} />
          <Route path="/candidate/register" element={<CandidateRegister />} />
          <Route path="/candidate/my-candidacy" element={<MyCandidacy />} />
          <Route
            path="/candidate/requirements"
            element={<ViewRequirements />}
          />
          <Route path="/candidates" element={<CandidatesList />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="/anonymous-vote" element={<AnonymousVote />} />
          <Route path="/PublicResults" element={<PublicResults />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
