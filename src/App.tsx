import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Adherents from "./pages/Adherents";
import Mpandray from "./pages/Mpandray";
import Groupes from "./pages/Groupes";
import Statistiques from "./pages/Statistiques";
import Finances from "./pages/Finances";
import Admin from "./pages/Admin";
import MemberProfile from "./pages/MemberProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
            <Route path="/adherents" element={<Layout><Adherents /></Layout>} />
            <Route path="/mpandray" element={<Layout><Mpandray /></Layout>} />
            <Route path="/groupes" element={<Layout><Groupes /></Layout>} />
            <Route path="/statistiques" element={<Layout><Statistiques /></Layout>} />
            <Route path="/finances" element={<Layout><Finances /></Layout>} />
            <Route path="/admin" element={<Layout><Admin /></Layout>} />
            <Route path="/profil" element={<Layout><MemberProfile /></Layout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;