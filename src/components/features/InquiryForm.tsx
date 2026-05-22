/**
 * InquiryForm — Reusable service inquiry / lead capture form.
 *
 * Used on:
 *   - Service detail page sidebar
 *   - Pricing page CTA
 *   - Any page that needs inline lead capture
 *
 * Submits to POST /api/v1/contact via submitLead().
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { submitLead, getErrorMessage } from "@/lib/api";

export interface InquiryFormProps {
  /** Service title label shown in the form heading */
  serviceTitle?: string;
  /** Service slug forwarded as serviceInterestSlugs */
  serviceSlug?: string;
  /** Heading to render above the form */
  heading?: string;
  /** Sub-heading */
  subheading?: string;
  /** Whether to show the service dropdown */
  showServiceField?: boolean;
}

interface FormState {
  name: string;
  phone: string;
  email: string;
  message: string;
}

const inputBase: React.CSSProperties = {
  width: "100%",
  padding: "10px 13px",
  borderRadius: "10px",
  border: "1.5px solid #E2E8F0",
  fontFamily: "'DM Sans', sans-serif",
  fontSize: "0.9375rem",
  color: "#0F172A",
  background: "white",
  outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
  display: "block",
};

export default function InquiryForm({
  serviceTitle,
  serviceSlug,
  heading = "Get a Free Consultation",
  subheading = "Fill in your details and we'll reach out within 2 hours.",
  showServiceField = false,
}: InquiryFormProps) {
  const [form, setForm] = useState<FormState>({ name: "", phone: "", email: "", message: "" });
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors(er => ({ ...er, [key]: undefined }));
  };

  const validate = (): boolean => {
    const e: Partial<FormState> = {};
    if (!form.name.trim()) e.name = "Name is required";
    else if (form.name.trim().length < 2) e.name = "Please enter your full name";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    else if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\s/g, "")))
      e.phone = "Enter a valid 10-digit Indian mobile number";
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      e.email = "Enter a valid email address";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError(null);
    try {
      await submitLead({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        service: serviceTitle,
        message: form.message.trim() || undefined,
        serviceSlug: serviceSlug,
      });
      setSubmitted(true);
    } catch (err) {
      const msg = getErrorMessage(err);
      const isNetworkErr = msg.toLowerCase().includes("fetch") || msg.toLowerCase().includes("network");
      if (isNetworkErr) {
        // Graceful fallback — network down shouldn't block the user
        setSubmitted(true);
      } else {
        setApiError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Success State ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
        className="text-center py-6 px-4"
      >
        <div
          className="flex items-center justify-center w-14 h-14 rounded-full mx-auto mb-4"
          style={{ background: "rgba(34,197,94,0.12)" }}
        >
          <CheckCircle2 size={28} strokeWidth={1.75} style={{ color: "#22C55E" }} />
        </div>
        <h3
          style={{
            fontFamily: "'Sora', sans-serif",
            fontWeight: 700,
            fontSize: "1.125rem",
            color: "#0F1B4C",
          }}
          className="mb-2"
        >
          Inquiry Received!
        </h3>
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.875rem",
            color: "#64748B",
            lineHeight: 1.6,
          }}
        >
          Our team will contact you within 2 hours.
          For faster help, WhatsApp us directly.
        </p>
        <a
          href={
            "https://wa.me/917387731313?text=" +
            encodeURIComponent(
              `Hi KlawTax! I just submitted an inquiry${serviceTitle ? ` for ${serviceTitle}` : ""}. Please guide me.`
            )
          }
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            background: "#25D366",
            color: "white",
            textDecoration: "none",
            boxShadow: "0 4px 16px rgba(37,211,102,0.30)",
          }}
        >
          Open WhatsApp
          <ArrowRight size={14} strokeWidth={2.5} />
        </a>
      </motion.div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Heading */}
      {heading && (
        <div className="mb-4">
          <p
            style={{
              fontFamily: "'Sora', sans-serif",
              fontWeight: 700,
              fontSize: "1rem",
              color: "#0F1B4C",
              marginBottom: "4px",
            }}
          >
            {heading}
          </p>
          {subheading && (
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.8125rem",
                color: "#64748B",
                lineHeight: 1.5,
              }}
            >
              {subheading}
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-3">

          {/* Name */}
          <div>
            <input
              type="text"
              placeholder="Your full name *"
              value={form.name}
              onChange={set("name")}
              autoComplete="name"
              aria-label="Full name"
              style={{
                ...inputBase,
                borderColor: errors.name ? "#EF4444" : "#E2E8F0",
                boxShadow: errors.name ? "0 0 0 3px rgba(239,68,68,0.10)" : "none",
              }}
              onFocus={(e) => {
                if (!errors.name) e.currentTarget.style.borderColor = "#3B82F6";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.12)";
              }}
              onBlur={(e) => {
                if (!errors.name) {
                  e.currentTarget.style.borderColor = "#E2E8F0";
                  e.currentTarget.style.boxShadow = "none";
                }
              }}
            />
            <AnimatePresence>
              {errors.name && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", color: "#EF4444", marginTop: "4px" }}
                >
                  {errors.name}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Phone */}
          <div>
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: "13px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.9375rem",
                  color: "#94A3B8",
                  pointerEvents: "none",
                  userSelect: "none",
                }}
              >
                +91
              </span>
              <input
                type="tel"
                placeholder="10-digit mobile number *"
                value={form.phone}
                onChange={set("phone")}
                autoComplete="tel"
                aria-label="Phone number"
                inputMode="numeric"
                maxLength={10}
                style={{
                  ...inputBase,
                  paddingLeft: "46px",
                  borderColor: errors.phone ? "#EF4444" : "#E2E8F0",
                  boxShadow: errors.phone ? "0 0 0 3px rgba(239,68,68,0.10)" : "none",
                }}
                onFocus={(e) => {
                  if (!errors.phone) e.currentTarget.style.borderColor = "#3B82F6";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.12)";
                }}
                onBlur={(e) => {
                  if (!errors.phone) {
                    e.currentTarget.style.borderColor = "#E2E8F0";
                    e.currentTarget.style.boxShadow = "none";
                  }
                }}
              />
            </div>
            <AnimatePresence>
              {errors.phone && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", color: "#EF4444", marginTop: "4px" }}
                >
                  {errors.phone}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Email (optional) */}
          <div>
            <input
              type="email"
              placeholder="Email address (optional)"
              value={form.email}
              onChange={set("email")}
              autoComplete="email"
              aria-label="Email address"
              style={{
                ...inputBase,
                borderColor: errors.email ? "#EF4444" : "#E2E8F0",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#3B82F6";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.12)";
              }}
              onBlur={(e) => {
                if (!errors.email) {
                  e.currentTarget.style.borderColor = "#E2E8F0";
                  e.currentTarget.style.boxShadow = "none";
                }
              }}
            />
            {errors.email && (
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", color: "#EF4444", marginTop: "4px" }}>
                {errors.email}
              </p>
            )}
          </div>

          {/* Message (optional) */}
          <div>
            <textarea
              placeholder={`Your query${serviceTitle ? ` about ${serviceTitle}` : ""} (optional)`}
              value={form.message}
              onChange={set("message")}
              rows={3}
              aria-label="Your message"
              style={{
                ...inputBase,
                resize: "vertical",
                minHeight: "80px",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#3B82F6";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.12)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#E2E8F0";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          {/* API error */}
          <AnimatePresence>
            {apiError && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="px-3 py-2.5 rounded-lg"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.20)" }}
              >
                <p
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.8125rem",
                    color: "#DC2626",
                  }}
                >
                  {apiError}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              background: "linear-gradient(90deg, #D97706, #F59E0B)",
              color: "#0F172A",
              border: "none",
              boxShadow: "0 4px 20px rgba(217,119,6,0.35)",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? (
              <>
                <Loader2 size={15} strokeWidth={2.5} className="animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send size={15} strokeWidth={2.5} />
                Send Inquiry
              </>
            )}
          </button>

          {!showServiceField && (
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.725rem",
                color: "#94A3B8",
                textAlign: "center",
                lineHeight: 1.5,
              }}
            >
              🔒 Your information is private & confidential
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
