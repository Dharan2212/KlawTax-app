/**
 * LoginPage — Batch 4.3
 *
 * Changes from Batch 2:
 * - Detects `sessionExpired` in location state and shows a friendly banner
 * - Reads `from` state for post-login redirect
 * - Role-based redirect after login
 */

import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import {
  Scale, Eye, EyeOff, AlertCircle, Loader2, MessageCircle, Info,
} from "lucide-react";

const WHATSAPP_LINK =
  "https://wa.me/917387731313?text=Hi+KlawTax!+I+need+help+logging+in.";

function getRoleDestination(role: string): string {
  if (role === "admin")    return "/crm/admin";
  if (role === "employee") return "/crm/employee";
  return "/dashboard";
}

export default function LoginPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login, isAuthenticated, role, isLoading, error, clearError } = useAuth();

  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPass, setShowPass]         = useState(false);
  const [fieldErrors, setFieldErrors]   = useState<Record<string, string>>({});

  // Detect post-session-expiry redirect
  const locationState = location.state as {
    from?: { pathname: string };
    sessionExpired?: boolean;
  } | null;
  const isSessionExpired = !!locationState?.sessionExpired;

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && role) {
      const dest = locationState?.from?.pathname ?? getRoleDestination(role);
      navigate(dest, { replace: true });
    }
  }, [isAuthenticated, role, navigate, locationState]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!email.trim() || !email.includes("@")) errs.email    = "Valid email required";
    if (!password || password.length < 6)       errs.password = "Password required";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    if (!validate()) return;
    try {
      await login({ email: email.trim().toLowerCase(), password });
      // navigation handled by useEffect
    } catch {
      // error displayed from context
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1B4C] via-[#1A2D6B] to-[#2E1065] flex flex-col items-center justify-center px-4 py-12">
      {/* Back to home */}
      <Link
        to="/"
        className="absolute top-6 left-6 text-white/70 hover:text-white text-sm flex items-center gap-2 transition-colors"
      >
        ← Back to KlawTax
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
              <Scale size={22} className="text-white" />
            </div>
            <span className="text-2xl font-bold text-white">
              Klaw<span className="text-amber-400">Tax</span>
            </span>
          </div>
          <p className="text-white/60 text-sm">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl">

          {/* Session-expired notice */}
          {isSessionExpired && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="flex items-start gap-3 bg-amber-500/20 border border-amber-500/40 rounded-xl px-4 py-3 mb-5"
            >
              <Info size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
              <span className="text-amber-200 text-sm">
                Your session has expired. Please log in again.
              </span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* API error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex items-start gap-3 bg-red-500/20 border border-red-500/40 rounded-xl px-4 py-3"
              >
                <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                <span className="text-red-200 text-sm">{error}</span>
              </motion.div>
            )}

            {/* Email */}
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearError(); }}
                placeholder="you@example.com"
                autoComplete="email"
                className={`w-full px-4 py-3 rounded-xl bg-white/10 border text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400/60 transition-all ${
                  fieldErrors.email
                    ? "border-red-500/60"
                    : "border-white/20 focus:border-amber-400/60"
                }`}
              />
              {fieldErrors.email && (
                <p className="text-red-400 text-xs mt-1">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError(); }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={`w-full px-4 py-3 pr-12 rounded-xl bg-white/10 border text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400/60 transition-all ${
                    fieldErrors.password
                      ? "border-red-500/60"
                      : "border-white/20 focus:border-amber-400/60"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-red-400 text-xs mt-1">{fieldErrors.password}</p>
              )}
            </div>

            {/* Forgot password */}
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-amber-400/80 hover:text-amber-400 text-sm transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-gray-900 font-semibold flex items-center justify-center gap-2 hover:from-amber-400 hover:to-amber-300 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-500/30"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-white/15" />
            <span className="text-white/40 text-xs">or</span>
            <div className="flex-1 h-px bg-white/15" />
          </div>

          {/* WhatsApp help */}
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-white/20 text-white/70 hover:text-white hover:border-green-400/50 hover:bg-green-500/10 transition-all text-sm"
          >
            <MessageCircle size={16} className="text-green-400" />
            Need help? Chat on WhatsApp
          </a>
        </div>

        {/* Footer note */}
        <p className="text-center text-white/40 text-xs mt-6">
          New client?{" "}
          <Link
            to="/contact"
            className="text-amber-400/70 hover:text-amber-400 transition-colors"
          >
            Contact us
          </Link>{" "}
          to get started.
        </p>
      </motion.div>
    </div>
  );
}
