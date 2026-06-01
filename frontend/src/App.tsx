import { Suspense, lazy, Component } from "react";
import type { ReactNode, ErrorInfo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import ScrollToTop from "@/components/shared/ScrollToTop";

// ── Lazy-loaded public pages ──────────────────────────────────────────────────
const Index              = lazy(() => import("./pages/Index.tsx"));
const ServicesPage       = lazy(() => import("./pages/ServicesPage.tsx"));
const ServiceDetailPage  = lazy(() => import("./pages/ServiceDetailPage.tsx"));
const PricingPage        = lazy(() => import("./pages/PricingPage.tsx"));
const CheckoutPage       = lazy(() => import("./pages/CheckoutPage.tsx"));
const SubmitDocumentsPage = lazy(() => import("./pages/SubmitDocumentsPage.tsx"));
const DashboardPage      = lazy(() => import("./pages/DashboardPage.tsx"));
const AboutPage          = lazy(() => import("./pages/AboutPage.tsx"));
const ContactPage        = lazy(() => import("./pages/ContactPage.tsx"));
const SupportPage        = lazy(() => import("./pages/SupportPage.tsx"));
const PrivacyPage        = lazy(() => import("./pages/PrivacyPage.tsx"));
const NotFound           = lazy(() => import("./pages/NotFound.tsx"));
const BlogsPage          = lazy(() => import("./pages/BlogsPage.tsx"));
const BlogDetailPage     = lazy(() => import("./pages/BlogDetailPage.tsx"));

// ── Lazy-loaded auth pages ────────────────────────────────────────────────────
const LoginPage          = lazy(() => import("./pages/LoginPage.tsx"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage.tsx"));
const ResetPasswordPage  = lazy(() => import("./pages/ResetPasswordPage.tsx"));

// ── Lazy-loaded CRM (heavy, separate chunk) ───────────────────────────────────
const CRMApp             = lazy(() => import("./app/crm/CRMApp.tsx"));

// ── Query client ─────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

// ── Page loading fallback ─────────────────────────────────────────────────────

function PageLoader() {
  return (
    <div
      role="status"
      aria-label="Loading page"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F8FAFC",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 40,
            height: 40,
            border: "3px solid #E2E8F0",
            borderTopColor: "#1E3A8A",
            borderRadius: "50%",
            animation: "spin 0.7s linear infinite",
            margin: "0 auto 12px",
          }}
          aria-hidden="true"
        />
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.875rem",
            color: "#64748B",
          }}
        >
          Loading…
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Error boundary ────────────────────────────────────────────────────────────

interface EBState { hasError: boolean; }
class AppErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  state: EBState = { hasError: false };

  static getDerivedStateFromError(): EBState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In production, wire to Sentry here: Sentry.captureException(error, { extra: info });
    if (import.meta.env.DEV) console.error("[AppErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#F8FAFC",
            padding: "2rem",
            textAlign: "center",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <div>
            <h1 style={{ color: "#0F1B4C", fontSize: "1.5rem", fontWeight: 700, marginBottom: 8 }}>
              Something went wrong
            </h1>
            <p style={{ color: "#64748B", marginBottom: 24 }}>
              An unexpected error occurred. Please refresh the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: "linear-gradient(90deg,#D97706,#F59E0B)",
                color: "#0F172A",
                fontWeight: 600,
                border: "none",
                borderRadius: 8,
                padding: "12px 28px",
                cursor: "pointer",
                fontSize: "0.9375rem",
              }}
            >
              Refresh page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Root app ──────────────────────────────────────────────────────────────────

const App = () => (
  <AppErrorBoundary>
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
  </AppErrorBoundary>
);

/** Redirect already-authenticated users away from /login */
function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, role } = useAuth();
  if (isAuthenticated && role) {
    const dest = role === "admin"
      ? "/crm/admin"
      : role === "employee"
      ? "/crm/employee"
      : "/dashboard";
    return <Navigate to={dest} replace />;
  }
  return <>{children}</>;
}

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* ── Public site ──────────────────────────────── */}
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

            {/* ── Blog / SEO content ───────────────────────── */}
            <Route path="/blogs"            element={<BlogsPage />} />
            <Route path="/blogs/:slug"      element={<BlogDetailPage />} />

            {/* ── Auth pages ───────────────────────────────── */}
            <Route path="/login"           element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
            <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>} />
            <Route path="/reset-password"  element={<ResetPasswordPage />} />

            {/* ── Client dashboard ─────────────────────────── */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={["client", "admin"]}>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            {/* ── CRM (heavy, separate chunk) ──────────────── */}
            <Route
              path="/crm/*"
              element={
                <ProtectedRoute>
                  <CRMApp />
                </ProtectedRoute>
              }
            />

            {/* ── Catch-all ────────────────────────────────── */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </>
  );
};

export default App;
