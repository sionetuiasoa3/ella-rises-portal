import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import ProtectedRoute from "@/components/portal/ProtectedRoute";
import AdminProtectedRoute from "@/components/admin/AdminProtectedRoute";
import AdminLayout from "@/components/admin/AdminLayout";
import Index from "./pages/Index";
import About from "./pages/About";
import Events from "./pages/Events";
import Contact from "./pages/Contact";
import Donate from "./pages/Donate";
import NotFound from "./pages/NotFound";
import ScrollToTopOnNavigate from "./components/ScrollToTopOnNavigate";
import PortalAuth from "./pages/portal/Auth";
import PortalDashboard from "./pages/portal/Dashboard";
import PortalProfile from "./pages/portal/Profile";
import PortalEvents from "./pages/portal/Events";
import PortalMilestones from "./pages/portal/Milestones";
import PortalSurvey from "./pages/portal/Survey";
import PortalDonate from "./pages/portal/Donate";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminParticipants from "./pages/admin/AdminParticipants";
import AdminParticipantDetail from "./pages/admin/AdminParticipantDetail";
import AdminEventTemplates from "./pages/admin/AdminEventTemplates";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminRegistrations from "./pages/admin/AdminRegistrations";
import AdminMilestones from "./pages/admin/AdminMilestones";
import AdminDonations from "./pages/admin/AdminDonations";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <AdminAuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTopOnNavigate />
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/events" element={<Events />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/donate" element={<Donate />} />
              
              {/* Participant Portal routes */}
              <Route path="/portal/auth" element={<PortalAuth />} />
              <Route path="/portal/dashboard" element={<ProtectedRoute><PortalDashboard /></ProtectedRoute>} />
              <Route path="/portal/profile" element={<ProtectedRoute><PortalProfile /></ProtectedRoute>} />
              <Route path="/portal/events" element={<ProtectedRoute><PortalEvents /></ProtectedRoute>} />
              <Route path="/portal/milestones" element={<ProtectedRoute><PortalMilestones /></ProtectedRoute>} />
              <Route path="/portal/survey/:eventId" element={<ProtectedRoute><PortalSurvey /></ProtectedRoute>} />
              <Route path="/portal/donate" element={<ProtectedRoute><PortalDonate /></ProtectedRoute>} />
              
              {/* Admin routes */}
              <Route path="/admin/login" element={<PortalAuth />} />
              <Route path="/admin" element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
                <Route index element={<AdminDashboard />} />
                <Route path="participants" element={<AdminParticipants />} />
                <Route path="participants/:id" element={<AdminParticipantDetail />} />
                <Route path="event-templates" element={<AdminEventTemplates />} />
                <Route path="events" element={<AdminEvents />} />
                <Route path="events/:eventId/registrations" element={<AdminRegistrations />} />
                <Route path="milestones" element={<AdminMilestones />} />
                <Route path="donations" element={<AdminDonations />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AdminAuthProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
