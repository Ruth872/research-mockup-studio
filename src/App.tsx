import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Landing from "./pages/Landing";
import SymptomChecker from "./pages/SymptomChecker";
import Dashboard from "./pages/Dashboard";
import AIChat from "./pages/AIChat";
import Appointments from "./pages/Appointments";
import TriageHistory from "./pages/TriageHistory";
import PatientPortal from "./pages/PatientPortal";
import StaffLogin from "./pages/auth/StaffLogin";
import StaffSignup from "./pages/auth/StaffSignup";
import PatientLogin from "./pages/auth/PatientLogin";
import PatientSignup from "./pages/auth/PatientSignup";
import StaffDashboard from "./pages/staff/StaffDashboard";
import PatientRecords from "./pages/staff/PatientRecords";
import TriageQueue from "./pages/staff/TriageQueue";
import Referrals from "./pages/staff/Referrals";
import Notifications from "./pages/staff/Notifications";
import AuditLogs from "./pages/staff/AuditLogs";
import AlgorithmLogs from "./pages/staff/AlgorithmLogs";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Navbar />
          <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/triage" element={<SymptomChecker />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/chat" element={<AIChat />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/triage-history" element={<TriageHistory />} />

            {/* Auth */}
            <Route path="/staff/login" element={<StaffLogin />} />
            <Route path="/staff/signup" element={<StaffSignup />} />
            <Route path="/patient/login" element={<PatientLogin />} />
            <Route path="/patient/signup" element={<PatientSignup />} />

            {/* Patient Portal */}
            <Route path="/patient/portal" element={<PatientPortal />} />

            {/* Staff Portal */}
            <Route path="/staff/dashboard" element={<StaffDashboard />} />
            <Route path="/staff/patients" element={<PatientRecords />} />
            <Route path="/staff/triage" element={<TriageQueue />} />
            <Route path="/staff/referrals" element={<Referrals />} />
            <Route path="/staff/notifications" element={<Notifications />} />
            <Route path="/staff/audit-logs" element={<AuditLogs />} />
            <Route path="/staff/algorithm-logs" element={<AlgorithmLogs />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
          <Footer />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
