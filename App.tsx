import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import Landing from "./pages/Landing";
import SymptomChecker from "./pages/SymptomChecker";
import TriageHistory from "./pages/TriageHistory";
import PatientPortal from "./pages/PatientPortal";
import PatientRecord from "./pages/PatientRecord";
import PatientAppointments from "./pages/PatientAppointments";
import StaffAppointments from "./pages/staff/StaffAppointments";
import StaffLogin from "./pages/auth/StaffLogin";
import PatientLogin from "./pages/auth/PatientLogin";
import PatientSignup from "./pages/auth/PatientSignup";
import DoctorDashboard from "./pages/DoctorDashboard";
import StaffDashboard from "./pages/staff/StaffDashboard";
import AnalyticsDashboard from "./pages/staff/AnalyticsDashboard";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "@/components/ProtectedRoute";
import { APP_BASE } from "@/lib/utils";
import ChangePassword from "./pages/auth/ChangePassword";
import StaffManagement from "./pages/admin/StaffManagement";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminAuditLog from "./pages/admin/AdminAuditLog";
import PatientAccounts from "./pages/admin/PatientAccounts";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter basename={APP_BASE}>
          <ScrollToTop />
          <Navbar />
          <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/triage" element={<ProtectedRoute roles={["patient"]}><SymptomChecker /></ProtectedRoute>} />
            <Route path="/dashboard" element={<Navigate to="/staff/dashboard" replace />} />
            <Route path="/triage-history" element={<ProtectedRoute roles={["patient"]}><TriageHistory /></ProtectedRoute>} />

            {/* Auth */}
            <Route path="/staff/login" element={<StaffLogin />} />
            <Route path="/patient/login" element={<PatientLogin />} />
            <Route path="/patient/signup" element={<PatientSignup />} />
            <Route path="/change-password" element={<ProtectedRoute roles={["patient", "doctor", "nurse", "admin"]} allowPasswordChange><ChangePassword /></ProtectedRoute>} />

            {/* Patient Portal */}
            <Route path="/patient/portal" element={<ProtectedRoute roles={["patient"]}><PatientPortal /></ProtectedRoute>} />
            <Route path="/patient/record" element={<ProtectedRoute roles={["patient"]}><PatientRecord /></ProtectedRoute>} />
            <Route path="/patient/appointments" element={<ProtectedRoute roles={["patient"]}><PatientAppointments /></ProtectedRoute>} />

            {/* Doctor & Staff Portal */}
            <Route path="/doctor" element={<ProtectedRoute roles={["doctor", "nurse"]}><DoctorDashboard /></ProtectedRoute>} />
            <Route path="/staff/dashboard" element={<ProtectedRoute roles={["doctor", "nurse"]}><StaffDashboard /></ProtectedRoute>} />
            <Route path="/staff/triage" element={<ProtectedRoute roles={["doctor", "nurse"]}><DoctorDashboard /></ProtectedRoute>} />
            <Route path="/staff/analytics" element={<ProtectedRoute roles={["doctor", "nurse"]}><AnalyticsDashboard /></ProtectedRoute>} />
            <Route path="/staff/appointments" element={<ProtectedRoute roles={["doctor", "nurse"]}><StaffAppointments /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><AdminOverview /></ProtectedRoute>} />
            <Route path="/admin/staff" element={<ProtectedRoute roles={["admin"]}><StaffManagement /></ProtectedRoute>} />
            <Route path="/admin/patients" element={<ProtectedRoute roles={["admin"]}><PatientAccounts /></ProtectedRoute>} />
            <Route path="/admin/audit-log" element={<ProtectedRoute roles={["admin"]}><AdminAuditLog /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
          <Footer />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;