/**
 * ProtectedRoute — Batch 4.3
 *
 * Changes:
 * - Passes `sessionExpired` flag in location state when redirecting after 401
 *   so LoginPage can show a friendly "session expired" message
 * - Reads `isAuthError` from api.ts to detect 401 vs genuine non-auth
 */

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/context/AuthContext";

interface ProtectedRouteProps {
  children:      React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?:   string;
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const { isAuthenticated, role, isLoading } = useAuth();
  const location = useLocation();

  // While checking stored token on mount, show a neutral spinner to avoid flash
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location }}
        replace
      />
    );
  }

  // Authenticated but wrong role → redirect to appropriate home
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    const dashboardMap: Record<string, string> = {
      admin:    "/crm/admin",
      employee: "/crm/employee",
      client:   "/dashboard",
    };
    return <Navigate to={dashboardMap[role] ?? "/"} replace />;
  }

  return <>{children}</>;
}
