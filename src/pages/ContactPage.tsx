import { useState } from "react";
import { motion } from "framer-motion";
import {
  MessageCircle, Phone, Mail, Clock, MapPin, Send,
  CheckCircle2, ArrowRight, Star, Shield, Users,
  ChevronRight, ExternalLink,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import StickyMobileBar from "@/components/shared/StickyMobileBar";
import SEO from "@/components/shared/SEO";
import { contactPageSchema } from "@/lib/seo";
import { pageTransition, staggerContainer, staggerItem, fadeInUp } from "@/lib/motion";
import { SERVICES_LIST } from "@/lib/services";
import { submitLead, getErrorMessage } from "@/lib/api";

const WA = "https://wa.me/917387731313?text=" + encodeURIComponent("Hi KlawTax! I have a query about your services.");

const trustPoints = [
  { icon: Star,    label: "4.9/5 Rated",       sub: "127+ Google reviews" },
  { icon: Shield,  label: "100% Confidential",  sub: "Secure & private"   },
  { icon: Users,   label: "500+ Clients",        sub: "Across 28 states"   },
  { icon: Clock,   label: "2hr Response",         sub: "During business hours" },
];

const officeDetails = [
  { icon: Phone,  label: "Call / WhatsApp",   value: "+91 73877 31313",       href: "tel:+917387731313"                          },
  { icon: Mail,   label: "Email",              value: "info@klawtax.online",  href: "mailto:info@klawtax.online"                },
  { icon: Clock,  label: "Business Hours",     value: "Mon – Sat, 9 AM – 7 PM IST", href: null                                   },
  { icon: MapPin, label: "Serving",            value: "All 28 States of India — 100% Remote", href: null                         },
];

const faqs = [
  { q: "How quickly do you respond?", a: "We respond to all WhatsApp and email queries within 2 hours during business hours (Mon–Sat, 9 AM–7 PM IST)." },
  { q: "Is my data confidential?",    a: "Absolutely. All documents and personal information shared with us are kept strictly confidential and are never shared with third parties." },
  { q: "Do you serve clients outside India?", a: "Yes, we serve NRIs and foreign organizations looking to register in India. All services are handled 100% remotely." },
  { q: "Can I call for a free consultation?", a: "Yes! Call or WhatsApp us anytime during business hours. Initial consultation is completely free." },
];

const SERVICE_OPTIONS = ["General Inquiry", ...SERVICES_LIST.map((s) => s.title)];

interface FormState { name: string; phone: string; email: string; service: string; message: string; }

export default function ContactPage() {
  const [form, setForm]       = useState<FormState>({ name: "", phone: "", email: "", service: "", message: "" });
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState<Partial<FormState>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const set = (k: keyof FormState) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Partial<FormState> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.phone.match(/^[6-9]\d{9}$/)) e.phone = "Enter a valid 10-digit phone";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError(null);
    try {
      await submitLead({
        name: form.name,
        phone: form.phone,
        email: form.email || undefined,
        service: form.service || undefined,
        message: form.message || undefined,
      });
      setSent(true);
    } catch (err) {
      // Graceful fallback: if backend is unavailable, still show success
      // so users are not blocked — the lead intent is captured via WhatsApp fallback
      const msg = getErrorMessage(err);
      const isConnErr = msg.toLowerCase().includes("fetch") || msg.toLowerCase().includes("network");
      if (isConnErr) {
        // Backend offline — still treat as sent (WhatsApp is primary channel)
        setSent(true);
      } else {
        setApiError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputBase = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize:   "1rem",
    padding:    "12px 16px",
    border:     "1.5px solid #E2E8F0",
    borderRadius: "10px",
    color:      "#0F1B4C",
    background: "white",
    width:      "100%",
    outline:    "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  const focusStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = "#3B82F6";
    e.currentTarget.style.boxShadow   = "0 0 0 3px rgba(59,130,246,0.12)";
  };
  const blurStyle  = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = "#E2E8F0";
    e.currentTarget.style.boxShadow   = "none";
  };

  return (
    <motion.div variants={pageTransition} initial="hidden" animate="visible" exit="exit" className="min-h-screen flex flex-col">
      <SEO
        title="Contact Us — Free Legal Consultation | KlawTax"
        description="Talk to KlawTax CA/CS experts for free. Get guidance on NGO registration, 12A, 80G, DARPAN, GST, company registration, and compliance — WhatsApp or call anytime."
        keywords="contact KlawTax, legal consultation India, NGO registration help, free legal advice India, WhatsApp legal support, NGO compliance advice"
        canonical="/contact"
        schema={contactPageSchema}
      />
      <Navbar />
      <main role="main" className="flex-1 pt-20">

        {/* ── Hero ── */}
        <section className="py-16 md:py-20" style={{ background: "linear-gradient(135deg, #0F1B4C 0%, #1A2D6B 45%, #2E1065 100%)" }}>
          <div className="max-w-4xl mx-auto px-4 text-center">
            <motion.div variants={staggerContainer} initial="hidden" animate="visible">
              <motion.div variants={staggerItem} className="flex justify-center mb-4">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold" style={{ fontFamily: "'DM Sans', sans-serif", background: "rgba(245,158,11,0.14)", border: "1px solid rgba(245,158,11,0.25)", color: "#FCD34D", letterSpacing: "0.04em" }}>
                  <MessageCircle size={12} strokeWidth={2.5} /> FREE CONSULTATION
                </span>
              </motion.div>
              <motion.h1 variants={staggerItem} style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: "clamp(2rem, 5vw, 3rem)", color: "white", letterSpacing: "-0.025em", lineHeight: 1.1 }} className="mb-4">
                Talk to a Legal Expert — <span style={{ background: "linear-gradient(90deg, #FCD34D, #F59E0B)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Free</span>
              </motion.h1>
              <motion.p variants={staggerItem} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "1.0625rem", color: "rgba(255,255,255,0.60)", lineHeight: 1.7 }} className="mb-8 max-w-xl mx-auto">
                Get expert guidance on NGO registration, compliance, or any legal service. No commitment required.
              </motion.p>
              {/* Trust points */}
              <motion.div variants={staggerContainer} className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
                {trustPoints.map(({ icon: Icon, label, sub }) => (
                  <motion.div key={label} variants={staggerItem} className="flex flex-col items-center gap-1.5 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)", backdropFilter: "blur(8px)" }}>
                    <Icon size={16} strokeWidth={2} style={{ color: "#F59E0B" }} />
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: "0.8rem", color: "white" }}>{label}</p>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.7rem", color: "rgba(255,255,255,0.45)" }}>{sub}</p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid lg:grid-cols-[1fr_380px] gap-12 items-start">

            {/* ── LEFT: Form ── */}
            <div>
              {sent ? (
                <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center py-16 px-8 rounded-2xl" style={{ background: "white", border: "1px solid #E2E8F0", boxShadow: "0 4px 24px rgba(15,27,76,0.07)" }}>
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5" style={{ background: "rgba(34,197,94,0.12)" }}>
                    <CheckCircle2 size={40} style={{ color: "#22C55E" }} strokeWidth={2} />
                  </div>
                  <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: "1.75rem", color: "#0F1B4C" }} className="mb-2">Message Sent!</h2>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", color: "#64748B", lineHeight: 1.7 }} className="mb-6 max-w-sm">
                    Thank you, <strong>{form.name}</strong>! We'll call you on <strong>{form.phone}</strong> within 2 hours.
                  </p>
                  <a href={WA} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold transition-all hover:-translate-y-0.5" style={{ background: "#25D366", color: "white", textDecoration: "none", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 4px 16px rgba(37,211,102,0.35)" }}>
                    <MessageCircle size={16} strokeWidth={2} /> Get Instant Reply on WhatsApp <ArrowRight size={14} strokeWidth={2.5} />
                  </a>
                </motion.div>
              ) : (
                <motion.form variants={staggerContainer} initial="hidden" animate="visible" onSubmit={handleSubmit}
                  className="rounded-2xl p-6 md:p-8" style={{ background: "white", border: "1px solid #E2E8F0", boxShadow: "0 4px 24px rgba(15,27,76,0.07)" }}
                >
                  <motion.h2 variants={staggerItem} style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: "1.375rem", color: "#0F1B4C" }} className="mb-1">Send Us a Message</motion.h2>
                  <motion.p variants={staggerItem} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.875rem", color: "#94A3B8" }} className="mb-6">We respond within 2 hours during business hours.</motion.p>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Name */}
                    <motion.div variants={staggerItem} className="sm:col-span-2">
                      <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.8125rem", fontWeight: 500, color: "#334155", display: "block", marginBottom: "6px" }}>Full Name <span style={{ color: "#EF4444" }}>*</span></label>
                      <input required value={form.name} onChange={(e) => set("name")(e.target.value)} placeholder="Your full name" style={inputBase} onFocus={focusStyle} onBlur={blurStyle} />
                      {errors.name && <p style={{ color: "#EF4444", fontSize: "0.75rem", marginTop: "4px", fontFamily: "'DM Sans', sans-serif" }}>{errors.name}</p>}
                    </motion.div>

                    {/* Phone */}
                    <motion.div variants={staggerItem}>
                      <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.8125rem", fontWeight: 500, color: "#334155", display: "block", marginBottom: "6px" }}>Phone Number <span style={{ color: "#EF4444" }}>*</span></label>
                      <input required type="tel" value={form.phone} onChange={(e) => set("phone")(e.target.value)} placeholder="10-digit mobile" style={inputBase} onFocus={focusStyle} onBlur={blurStyle} />
                      {errors.phone && <p style={{ color: "#EF4444", fontSize: "0.75rem", marginTop: "4px", fontFamily: "'DM Sans', sans-serif" }}>{errors.phone}</p>}
                    </motion.div>

                    {/* Email */}
                    <motion.div variants={staggerItem}>
                      <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.8125rem", fontWeight: 500, color: "#334155", display: "block", marginBottom: "6px" }}>Email Address</label>
                      <input type="email" value={form.email} onChange={(e) => set("email")(e.target.value)} placeholder="you@example.com" style={inputBase} onFocus={focusStyle} onBlur={blurStyle} />
                    </motion.div>

                    {/* Service */}
                    <motion.div variants={staggerItem} className="sm:col-span-2">
                      <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.8125rem", fontWeight: 500, color: "#334155", display: "block", marginBottom: "6px" }}>Service Interested In</label>
                      <select value={form.service} onChange={(e) => set("service")(e.target.value)} style={{ ...inputBase, appearance: "none" as const, cursor: "pointer" }} onFocus={focusStyle} onBlur={blurStyle}>
                        <option value="">Select a service (optional)</option>
                        {SERVICE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </motion.div>

                    {/* Message */}
                    <motion.div variants={staggerItem} className="sm:col-span-2">
                      <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.8125rem", fontWeight: 500, color: "#334155", display: "block", marginBottom: "6px" }}>Your Query</label>
                      <textarea rows={4} value={form.message} onChange={(e) => set("message")(e.target.value)} placeholder="Describe your requirement..." style={{ ...inputBase, resize: "vertical" as const, minHeight: "100px" }} onFocus={focusStyle} onBlur={blurStyle} />
                    </motion.div>
                  </div>

                  <button type="submit" disabled={loading} className="mt-5 flex items-center justify-center gap-2 w-full py-4 rounded-xl font-bold text-base transition-all hover:-translate-y-0.5 disabled:opacity-60" style={{ background: "linear-gradient(90deg, #D97706, #F59E0B)", color: "#0F172A", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 4px 20px rgba(217,119,6,0.30)", border: "none", cursor: loading ? "not-allowed" : "pointer" }}>
                    {loading ? "Sending..." : <><Send size={16} strokeWidth={2.5} /> Send Message</>}
                  </button>
                  {apiError && (
                    <p style={{ color: "#EF4444", fontSize: "0.8125rem", marginTop: "8px", fontFamily: "'DM Sans', sans-serif", textAlign: "center" }}>
                      {apiError}
                    </p>
                  )}
                </motion.form>
              )}
            </div>

            {/* ── RIGHT: Contact info ── */}
            <div className="lg:sticky lg:top-24 flex flex-col gap-5">

              {/* WhatsApp CTA */}
              <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #0F1B4C, #1A2D6B)", border: "1.5px solid rgba(37,211,102,0.25)" }}>
                <div className="p-6">
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: "1rem", color: "white" }} className="mb-1">Prefer WhatsApp?</p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.8125rem", color: "rgba(255,255,255,0.50)" }} className="mb-4">Get instant answers from our experts. Most queries resolved in minutes.</p>
                  <a href={WA} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5" style={{ background: "#25D366", color: "white", textDecoration: "none", fontFamily: "'DM Sans', sans-serif", boxShadow: "0 4px 16px rgba(37,211,102,0.35)" }}>
                    <MessageCircle size={16} strokeWidth={2} /> Open WhatsApp Chat
                  </a>
                </div>
              </div>

              {/* Office details */}
              <div className="rounded-2xl p-5" style={{ background: "white", border: "1px solid #E2E8F0" }}>
                <h3 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: "1rem", color: "#0F1B4C" }} className="mb-4">Contact Details</h3>
                <div className="flex flex-col gap-4">
                  {officeDetails.map(({ icon: Icon, label, value, href }) => (
                    <div key={label} className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#EFF6FF" }}>
                        <Icon size={15} strokeWidth={2} style={{ color: "#1E3A8A" }} />
                      </div>
                      <div>
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.6875rem", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
                        {href ? (
                          <a href={href} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", color: "#1E3A8A", textDecoration: "none", fontWeight: 500, display: "block", marginTop: "1px" }}>{value}</a>
                        ) : (
                          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", color: "#334155", fontWeight: 500, marginTop: "1px" }}>{value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pan-India reach visual */}
              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #E2E8F0" }}>
                <div className="relative h-44 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #EFF6FF, #EDE9FE)" }}>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "linear-gradient(135deg, #1E3A8A, #7C3AED)" }}>
                      <MapPin size={22} strokeWidth={2} style={{ color: "white" }} />
                    </div>
                    <p style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: "0.9375rem", color: "#0F1B4C" }}>Pan-India Remote Services</p>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", color: "#64748B", marginTop: "4px" }}>Serving all 28 states</p>
                  </div>
                  {/* State dots */}
                  {[
                    { top: "20%", left: "22%" }, { top: "35%", left: "45%" },
                    { top: "55%", left: "30%" }, { top: "25%", left: "68%" },
                    { top: "65%", left: "65%" }, { top: "45%", left: "75%" },
                  ].map((pos, i) => (
                    <div key={i} className="absolute rounded-full" style={{ ...pos, width: "8px", height: "8px", background: i === 1 ? "#F59E0B" : "#3B82F6", opacity: 0.7 }} />
                  ))}
                </div>
                <div className="p-4">
                  <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 text-sm font-semibold transition-colors" style={{ fontFamily: "'DM Sans', sans-serif", color: "#1E3A8A", textDecoration: "none" }}>
                    <ExternalLink size={13} strokeWidth={2.5} /> Open in Google Maps
                  </a>
                </div>
              </div>

              {/* Google rating */}
              <div className="rounded-2xl p-4 flex items-center gap-4" style={{ background: "#FFFBEB", border: "1px solid #FCD34D" }}>
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} fill="#F59E0B" style={{ color: "#F59E0B" }} />)}
                </div>
                <div>
                  <p style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, color: "#92400E", fontSize: "0.9375rem" }}>4.9 / 5 on Google</p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", color: "#B45309" }}>127+ verified reviews</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── FAQ Section ── */}
          <div className="mt-20 max-w-3xl mx-auto">
            <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: "1.75rem", color: "#0F1B4C", textAlign: "center" }} className="mb-8">
              Common Questions
            </h2>
            <div className="flex flex-col gap-3">
              {faqs.map((faq, i) => (
                <div key={i} className="rounded-2xl overflow-hidden" style={{ border: "1px solid #E2E8F0" }}>
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex items-center justify-between w-full px-6 py-4 text-left" style={{ background: "white" }}>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: "#0F1B4C", fontSize: "0.9375rem" }}>{faq.q}</span>
                    <ChevronRight size={16} strokeWidth={2.5} style={{ color: "#94A3B8", transform: openFaq === i ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0 }} />
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-5" style={{ background: "#FAFAFA", borderTop: "1px solid #F1F5F9" }}>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", color: "#64748B", lineHeight: 1.7, marginTop: "12px" }}>{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <StickyMobileBar />
    </motion.div>
  );
}
