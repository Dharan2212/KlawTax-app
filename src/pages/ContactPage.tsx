import { motion } from "framer-motion";
import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import StickyMobileBar from "@/components/shared/StickyMobileBar";
import { useLeadStore } from "@/store/useLeadStore";
import { services } from "@/lib/services";
import {
  Phone, Mail, Clock, MapPin, CheckCircle2,
  MessageCircle, ArrowRight, Loader2, CircleDot,
  Star, Shield, Users,
} from "lucide-react";
import { shake, checkmarkAnim, pageTransition, fadeInUp } from "@/lib/motion";

const trustPoints = [
  { icon: Star, label: "4.9/5 Rated", sub: "On Google Reviews" },
  { icon: Shield, label: "100% Confidential", sub: "Secure & private" },
  { icon: Users, label: "500+ Clients", sub: "Pan India served" },
  { icon: Clock, label: "2hr Response", sub: "Business hours" },
];

export default function ContactPage() {
  const store = useLeadStore();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (store.submitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main role="main" className="pt-28 pb-16 flex-1 flex items-center justify-center px-4">
          <motion.div variants={pageTransition} initial="hidden" animate="visible" className="max-w-lg w-full text-center premium-card p-10">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
                <motion.svg className="w-12 h-12 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <motion.path variants={checkmarkAnim} initial="hidden" animate="visible" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </motion.svg>
              </div>
            </div>
            <h1 className="page-title text-foreground mb-2">Message Sent!</h1>
            <p className="text-muted-foreground mb-2">We'll get back to you within 2 hours during business hours.</p>
            <p className="text-sm text-muted-foreground mb-8">For faster assistance, reach us on WhatsApp.</p>
            <a href="https://wa.me/918793949471" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-4 btn-premium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <MessageCircle className="w-4 h-4" />Get Instant Reply on WhatsApp<ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const eMap: Record<string, string> = {};
    if (!store.name.trim()) eMap.name = "Name is required";
    if (!store.phone.trim() || store.phone.length < 10) eMap.phone = "Valid phone is required";
    setErrors(eMap);
    if (Object.keys(eMap).length === 0) {
      setIsSubmitting(true);
      setTimeout(() => { setIsSubmitting(false); store.submit(); }, 1500);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main role="main" className="flex-1">

        {/* Hero */}
        <section className="pt-28 pb-16 bg-[image:var(--gradient-mesh-light)]">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <motion.div variants={fadeInUp} initial="hidden" animate="visible">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[hsl(var(--color-primary-100))] text-primary text-sm font-semibold mb-5">
                <MessageCircle className="w-4 h-4" />Free Consultation
              </span>
              <h1 className="page-title text-foreground mb-4">
                Talk to a Legal Expert — <span className="gradient-text">Free</span>
              </h1>
              <p className="body-lg text-muted-foreground max-w-xl mx-auto mb-8">
                Get expert guidance on NGO registration, compliance, or any legal service. No commitment required.
              </p>
              {/* Trust strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
                {trustPoints.map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/70 border border-border/60 backdrop-blur-sm">
                    <Icon className="w-4 h-4 text-primary" />
                    <p className="text-xs font-semibold text-foreground">{label}</p>
                    <p className="text-[10px] text-muted-foreground">{sub}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Form + Info */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row gap-10 max-w-5xl mx-auto">

              {/* Form */}
              <motion.form
                variants={fadeInUp} initial="hidden" animate="visible"
                onSubmit={handleSubmit}
                noValidate
                className="flex-1 premium-card p-8 md:p-10"
              >
                <h2 className="section-heading text-foreground mb-2">Send Your Enquiry</h2>
                <p className="text-sm text-muted-foreground mb-8">Fill in the form and we'll match you with the right expert.</p>

                <div className="space-y-5">
                  <motion.div variants={shake} animate={errors.name ? "error" : "visible"}>
                    <label htmlFor="contact-name" className="form-label block mb-1.5">
                      Full Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="contact-name" value={store.name}
                      onChange={(e) => { store.setField("name", e.target.value); setErrors((p) => ({ ...p, name: "" })); }}
                      className={`w-full px-4 py-3.5 input-premium ${errors.name ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      placeholder="Your full name" autoComplete="name"
                    />
                    {errors.name && (
                      <p className="text-destructive text-xs mt-1.5 font-medium flex items-center gap-1">
                        <CircleDot className="w-3 h-3" />{errors.name}
                      </p>
                    )}
                  </motion.div>

                  <motion.div variants={shake} animate={errors.phone ? "error" : "visible"}>
                    <label htmlFor="contact-phone" className="form-label block mb-1.5">
                      Mobile Number <span className="text-destructive">*</span>
                    </label>
                    <div className="flex">
                      <span className="flex items-center px-3.5 py-3.5 border border-r-0 border-border rounded-l-lg bg-muted text-sm font-medium text-muted-foreground">+91</span>
                      <input
                        id="contact-phone" type="tel" value={store.phone}
                        onChange={(e) => { store.setField("phone", e.target.value); setErrors((p) => ({ ...p, phone: "" })); }}
                        className={`flex-1 px-4 py-3.5 input-premium rounded-l-none ${errors.phone ? "border-destructive focus-visible:ring-destructive" : ""}`}
                        placeholder="9876543210" autoComplete="tel" maxLength={10}
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-destructive text-xs mt-1.5 font-medium flex items-center gap-1">
                        <CircleDot className="w-3 h-3" />{errors.phone}
                      </p>
                    )}
                  </motion.div>

                  <div>
                    <label htmlFor="contact-email" className="form-label block mb-1.5">Email Address</label>
                    <input
                      id="contact-email" type="email" value={store.email}
                      onChange={(e) => store.setField("email", e.target.value)}
                      className="w-full px-4 py-3.5 input-premium"
                      placeholder="you@example.com" autoComplete="email"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-service" className="form-label block mb-1.5">Service Interested In</label>
                    <select
                      id="contact-service" value={store.service}
                      onChange={(e) => store.setField("service", e.target.value)}
                      className="w-full px-4 py-3.5 input-premium hover:cursor-pointer"
                    >
                      <option value="">Select a service (optional)</option>
                      {services.map((s) => <option key={s.id} value={s.title}>{s.title}</option>)}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="contact-message" className="form-label block mb-1.5">Your Message</label>
                    <textarea
                      id="contact-message" value={store.message}
                      onChange={(e) => store.setField("message", e.target.value)}
                      rows={4} className="w-full px-4 py-3.5 input-premium resize-none"
                      placeholder="Tell us about your requirements, questions, or concerns…"
                    />
                  </div>
                </div>

                <button
                  type="submit" disabled={isSubmitting}
                  className="mt-8 w-full py-4 btn-premium disabled:opacity-50 flex items-center justify-center gap-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-5 h-5 animate-spin" />Sending…</>
                  ) : (
                    <>Send Enquiry<ArrowRight className="w-4 h-4" /></>
                  )}
                </button>

                <p className="text-center text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />Your information is 100% confidential and secure.
                </p>
              </motion.form>

              {/* Right side */}
              <div className="lg:w-96 space-y-5">
                {/* WhatsApp — primary */}
                <div className="premium-card p-6 border-l-4 border-l-success">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-6 h-6 text-success" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-heading font-semibold text-foreground mb-1">Instant Response via WhatsApp</h3>
                      <p className="text-sm text-muted-foreground mb-4">Skip the form — reach us directly for the fastest support.</p>
                      <a
                        href="https://wa.me/918793949471?text=Hi%2C%20I%20need%20help%20with%20legal%20services"
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-2 w-full justify-center py-3 rounded-xl bg-success text-white font-semibold hover:opacity-90 transition-opacity text-sm"
                      >
                        <MessageCircle className="w-4 h-4" />Open WhatsApp Chat
                      </a>
                    </div>
                  </div>
                </div>

                {/* Contact info */}
                <div className="premium-card p-7">
                  <h3 className="font-heading font-semibold text-foreground mb-5">Contact Information</h3>
                  <div className="space-y-4">
                    {[
                      { icon: Phone, label: "+91 99999 99999", sub: "Mon–Sat, 10AM–7PM", href: "tel:+918793949471" },
                      { icon: Mail, label: "klawtaxindia@gmail.com", sub: "Email support", href: "mailto:klawtaxindia@gmail.com" },
                      { icon: Clock, label: "Response within 2 hours", sub: "During business hours", href: null },
                      { icon: MapPin, label: "Pan India Services", sub: "All 28 states covered", href: null },
                    ].map(({ icon: Icon, label, sub, href }) => (
                      <div key={label} className="flex items-start gap-3.5">
                        <div className="w-9 h-9 rounded-lg bg-[hsl(var(--color-primary-100))] flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          {href ? (
                            <a href={href} className="text-sm font-semibold text-foreground hover:text-primary transition-colors">{label}</a>
                          ) : (
                            <p className="text-sm font-semibold text-foreground">{label}</p>
                          )}
                          <p className="text-xs text-muted-foreground">{sub}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Included in free consult */}
                <div className="rounded-xl bg-[hsl(var(--color-primary-50))] border border-[hsl(var(--color-primary-100))] p-5">
                  <h4 className="text-sm font-semibold text-primary mb-3">Your free consultation includes:</h4>
                  <div className="space-y-2">
                    {[
                      "Service recommendation based on your needs",
                      "Transparent pricing with no hidden fees",
                      "Timeline and document checklist",
                      "Ongoing WhatsApp support",
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-muted-foreground">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <StickyMobileBar />
    </div>
  );
}
