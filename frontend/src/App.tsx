import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/shared/ProtectedRoute";

// Public site pages
import Index from "./pages/Index.tsx";
import ServicesPage from "./pages/ServicesPage.tsx";
import ServiceDetailPage from "./pages/ServiceDetailPage.tsx";
import PricingPage from "./pages/PricingPage.tsx";
import CheckoutPage from "./pages/CheckoutPage.tsx";
import SubmitDocumentsPage from "./pages/SubmitDocumentsPage.tsx";
import DashboardPage from "./pages/DashboardPage.tsx";
import AboutPage from "./pages/AboutPage.tsx";
import ContactPage from "./pages/ContactPage.tsx";
import SupportPage from "./pages/SupportPage.tsx";
import PrivacyPage from "./pages/PrivacyPage.tsx";
import NotFound from "./pages/NotFound.tsx";
import ScrollToTop from "./components/shared/ScrollToTop.tsx";

// Auth pages
import LoginPage from "./pages/LoginPage.tsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.tsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.tsx";

// CRM
import CRMApp from "./app/crm/CRMApp.tsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AnimatedRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

/** Redirect already-authenticated users away from /login */
function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, role } = useAuth();
  if (isAuthenticated && role) {
    const dest = role === "admin" ? "/crm/admin" : role === "employee" ? "/crm/employee" : "/dashboard";
    return <Navigate to={dest} replace />;
  }
  return <>{children}</>;
}

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <>
      <ScrollToTop />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* ── Public site ────────────────────────────── */}
          <Route path="/"                 element={<Index />} />
          <Route path="/services"         element={<ServicesPage />} />
          <Route path="/services/:slug"   element={<ServiceDetailPage />} />
          <Route path="/pricing"          element={<PricingPage />} />
          <Route path="/checkout"         element={<CheckoutPage />} />
          <Route path="/submit-documents" element={<SubmitDocumentsPage />} />
          <Route path="/about"            element={<AboutPage />} />
          <Route path="/contact"          element={<ContactPage />} />
          <Route path="/support"          element={<SupportPage />} />
          <Route path="/privacy"          element={<PrivacyPage />} />

          {/* ── Auth pages ─────────────────────────────── */}
          <Route path="/login"          element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
          <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />
          <Route path="/reset-password"  element={<ResetPasswordPage />} />

          {/* ── Client dashboard (requires client / admin role) ── */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={["client", "admin"]}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* ── CRM (requires any authenticated role) ─── */}
          <Route
            path="/crm/*"
            element={
              <ProtectedRoute>
                <CRMApp />
              </ProtectedRoute>
            }
          />

          {/* ── Catch-all ──────────────────────────────── */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </>
  );
};

export default App;
