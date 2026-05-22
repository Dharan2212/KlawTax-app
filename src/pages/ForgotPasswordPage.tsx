import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Scale, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { forgotPassword, getErrorMessage } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await forgotPassword(email.trim());
      setSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1B4C] via-[#1A2D6B] to-[#2E1065] flex flex-col items-center justify-center px-4 py-12">
      <Link to="/login" className="absolute top-6 left-6 text-white/70 hover:text-white text-sm transition-colors">
        ← Back to login
      </Link>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
              <Scale size={22} className="text-white" />
            </div>
            <span className="text-2xl font-bold text-white">Klaw<span className="text-amber-400">Tax</span></span>
          </div>
          <h1 className="text-white text-xl font-semibold">Reset your password</h1>
          <p className="text-white/60 text-sm mt-1">We'll send a reset link to your email</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl">
          {success ? (
            <div className="text-center py-4">
              <CheckCircle2 size={48} className="text-green-400 mx-auto mb-4" />
              <h2 className="text-white font-semibold text-lg mb-2">Check your inbox</h2>
              <p className="text-white/60 text-sm mb-6">
                If an account exists for <strong className="text-white">{email}</strong>, you'll receive a password reset link shortly.
              </p>
              <Link to="/login" className="text-amber-400 hover:text-amber-300 text-sm transition-colors">
                Return to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-start gap-3 bg-red-500/20 border border-red-500/40 rounded-xl px-4 py-3">
                  <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                  <span className="text-red-200 text-sm">{error}</span>
                </div>
              )}
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400/60 focus:border-amber-400/60 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-gray-900 font-semibold flex items-center justify-center gap-2 hover:from-amber-400 hover:to-amber-300 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-500/30"
              >
                {loading ? <><Loader2 size={18} className="animate-spin" />Sending…</> : "Send Reset Link"}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
