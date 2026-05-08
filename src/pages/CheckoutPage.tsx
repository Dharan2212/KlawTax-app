import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { shake, checkmarkAnim, pageTransition, slideStep } from "@/lib/motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import StickyMobileBar from "@/components/shared/StickyMobileBar";
import SEO from "@/components/shared/SEO";
import { useCheckoutStore } from "@/store/useCheckoutStore";
import { formatCurrency } from "@/lib/utils";
import {
  Shield, CheckCircle2, MessageCircle, LayoutDashboard,
  FileText, Lock, Clock, Headphones, ChevronLeft,
  Loader2, BadgeCheck, CreditCard, Wallet, ArrowRight, CircleDot,
} from "lucide-react";

const steps = ["Details", "Payment", "Confirmation"];

const trustItems = [
  { icon: Shield, label: "Secure Payment", sub: "256-bit SSL" },
  { icon: BadgeCheck, label: "Legal Experts", sub: "CS & CA team" },
  { icon: Clock, label: "48hr Start", sub: "Fast processing" },
  { icon: Headphones, label: "WhatsApp Support", sub: "Post-payment" },
];

export default function CheckoutPage() {
  const store = useCheckoutStore();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const serviceName = store.serviceName || "Complete NGO Package";
  const servicePrice = store.servicePrice || 13500;
  const payableAmount = store.paymentType === "advance" ? Math.ceil(servicePrice / 2) : servicePrice;

  function validateStep0() {
    const e: Record<string, string> = {};
    if (!store.userName.trim()) e.name = "Name is required";
    if (!store.userPhone.trim() || store.userPhone.length < 10) e.phone = "Valid phone required";
    if (!store.userEmail.trim() || !store.userEmail.includes("@")) e.email = "Valid email required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleNext() {
    if (store.currentStep === 0) {
      if (validateStep0()) store.setStep(1);
    } else if (store.currentStep === 1) {
      setLoading(true);
      setTimeout(() => { setLoading(false); store.completeCheckout(); store.setStep(2); }, 2000);
    }
  }

  if (store.isComplete) {
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
            <h1 className="page-title text-foreground mb-1">Payment Successful!</h1>
            <p className="text-sm text-muted-foreground mb-1">Order ID: <span className="font-mono font-bold text-primary">{store.orderId}</span></p>
            <p className="text-sm text-muted-foreground mb-8">Thank you, {store.userName}! Our team will contact you within 2 hours.</p>
            <div className="space-y-3">
              <Link to="/submit-documents" className="flex items-center justify-center gap-2 w-full py-3.5 btn-premium">
                <FileText className="w-4 h-4" /> Submit Documents <ArrowRight className="w-4 h-4" />
              </Link>
              <a href={`https://wa.me/919999999999?text=Order%20${store.orderId}%20confirmed%20for%20${encodeURIComponent(serviceName)}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-success/10 text-success font-semibold hover:bg-success/20 transition-colors">
                <MessageCircle className="w-4 h-4" /> Open WhatsApp Chat
              </a>
              <Link to="/dashboard" className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-border font-medium hover:bg-muted transition-colors text-foreground">
                <LayoutDashboard className="w-4 h-4" /> View Dashboard
              </Link>
            </div>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SEO title="Checkout | KlawTax" noindex={true} />
      <Navbar />
      <main role="main" className="pt-28 pb-24 flex-1">
        <div className="container mx-auto px-4 max-w-6xl">

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 mb-10">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${i < store.currentStep ? "bg-success text-white" : i === store.currentStep ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                    {i < store.currentStep ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-sm font-medium hidden sm:inline ${i <= store.currentStep ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
                </div>
                {i < steps.length - 1 && <div className={`w-10 h-0.5 mx-1 transition-colors ${i < store.currentStep ? "bg-success" : "bg-border"}`} />}
              </div>
            ))}
          </div>

          <div className="flex flex-col lg:flex-row gap-8 max-w-5xl mx-auto">
            {/* Form */}
            <div className="flex-1 min-w-0">
              <AnimatePresence mode="wait">
                {store.currentStep === 0 && (
                  <motion.div key="step0" variants={slideStep} initial="hidden" animate="visible" exit="exit">
                    <div className="premium-card p-8">
                      <h2 className="section-heading text-foreground mb-1">Your Details</h2>
                      <p className="text-sm text-muted-foreground mb-8">We'll use this to send updates and assign your dedicated manager.</p>
                      <div className="space-y-5">
                        <motion.div variants={shake} animate={errors.name ? "error" : "visible"}>
                          <label htmlFor="checkout-name" className="form-label block mb-1.5">Full Name <span className="text-destructive">*</span></label>
                          <input id="checkout-name" value={store.userName} onChange={(e) => store.setUserDetails({ name: e.target.value, email: store.userEmail, phone: store.userPhone, city: store.userCity })} className={`w-full px-4 py-3.5 input-premium ${errors.name ? "border-destructive focus-visible:ring-destructive" : ""}`} placeholder="Enter your full name" autoComplete="name" />
                          {errors.name && <p className="text-destructive text-xs mt-1.5 font-medium flex items-center gap-1"><CircleDot className="w-3 h-3" />{errors.name}</p>}
                        </motion.div>
                        <motion.div variants={shake} animate={errors.email ? "error" : "visible"}>
                          <label htmlFor="checkout-email" className="form-label block mb-1.5">Email Address <span className="text-destructive">*</span></label>
                          <input id="checkout-email" type="email" value={store.userEmail} onChange={(e) => store.setUserDetails({ name: store.userName, email: e.target.value, phone: store.userPhone, city: store.userCity })} className={`w-full px-4 py-3.5 input-premium ${errors.email ? "border-destructive focus-visible:ring-destructive" : ""}`} placeholder="you@example.com" autoComplete="email" />
                          {errors.email && <p className="text-destructive text-xs mt-1.5 font-medium flex items-center gap-1"><CircleDot className="w-3 h-3" />{errors.email}</p>}
                        </motion.div>
                        <motion.div variants={shake} animate={errors.phone ? "error" : "visible"}>
                          <label htmlFor="checkout-phone" className="form-label block mb-1.5">Mobile Number <span className="text-destructive">*</span></label>
                          <div className="flex">
                            <span className="flex items-center px-3.5 py-3.5 border border-r-0 border-border rounded-l-lg bg-muted text-sm font-medium text-muted-foreground">+91</span>
                            <input id="checkout-phone" type="tel" value={store.userPhone} onChange={(e) => store.setUserDetails({ name: store.userName, email: store.userEmail, phone: e.target.value, city: store.userCity })} className={`flex-1 px-4 py-3.5 input-premium rounded-l-none ${errors.phone ? "border-destructive focus-visible:ring-destructive" : ""}`} placeholder="9876543210" autoComplete="tel" maxLength={10} />
                          </div>
                          {errors.phone && <p className="text-destructive text-xs mt-1.5 font-medium flex items-center gap-1"><CircleDot className="w-3 h-3" />{errors.phone}</p>}
                        </motion.div>
                        <div>
                          <label htmlFor="checkout-city" className="form-label block mb-1.5">City / State</label>
                          <input id="checkout-city" value={store.userCity} onChange={(e) => store.setUserDetails({ name: store.userName, email: store.userEmail, phone: store.userPhone, city: e.target.value })} className="w-full px-4 py-3.5 input-premium" placeholder="e.g. Mumbai, Maharashtra" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {store.currentStep === 1 && (
                  <motion.div key="step1" variants={slideStep} initial="hidden" animate="visible" exit="exit">
                    <div className="premium-card p-8">
                      <h2 className="section-heading text-foreground mb-1">Choose Payment Option</h2>
                      <p className="text-sm text-muted-foreground mb-8">Both options include all government fees — no hidden charges.</p>
                      <div className="space-y-4">
                        {/* Full Payment */}
                        <button onClick={() => store.setPaymentType("full")} className={`w-full p-5 rounded-xl border-2 text-left transition-all ${store.paymentType === "full" ? "border-primary bg-[hsl(var(--color-primary-50))]" : "border-border hover:border-primary/40"}`}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${store.paymentType === "full" ? "border-primary bg-primary" : "border-border"}`}>
                                {store.paymentType === "full" && <div className="w-2 h-2 rounded-full bg-white" />}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                  <h3 className="font-heading font-semibold text-foreground">Pay Full Amount</h3>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success/10 text-success">RECOMMENDED</span>
                                </div>
                                <p className="text-sm text-muted-foreground">Fastest processing — work starts immediately</p>
                              </div>
                            </div>
                            <span className="font-mono font-bold text-xl text-primary flex-shrink-0">{formatCurrency(servicePrice)}</span>
                          </div>
                        </button>

                        {/* 50% Advance */}
                        <button onClick={() => store.setPaymentType("advance")} className={`w-full p-5 rounded-xl border-2 text-left transition-all ${store.paymentType === "advance" ? "border-primary bg-[hsl(var(--color-primary-50))]" : "border-border hover:border-primary/40"}`}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${store.paymentType === "advance" ? "border-primary bg-primary" : "border-border"}`}>
                                {store.paymentType === "advance" && <div className="w-2 h-2 rounded-full bg-white" />}
                              </div>
                              <div>
                                <h3 className="font-heading font-semibold text-foreground mb-0.5">Pay 50% Advance</h3>
                                <p className="text-sm text-muted-foreground">Pay <span className="font-semibold text-foreground">{formatCurrency(Math.ceil(servicePrice / 2))}</span> now · Balance after work begins</p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <span className="font-mono font-bold text-xl text-primary">{formatCurrency(Math.ceil(servicePrice / 2))}</span>
                              <p className="text-xs text-muted-foreground mt-0.5">due now</p>
                            </div>
                          </div>
                        </button>
                      </div>

                      {/* Payment methods */}
                      <div className="mt-6 pt-6 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-3 flex items-center gap-2">
                          <Lock className="w-3.5 h-3.5" /> Secured by Razorpay — 256-bit SSL encryption
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {[{ icon: CreditCard, label: "Cards" }, { icon: Wallet, label: "UPI" }, { icon: Wallet, label: "Net Banking" }, { icon: Wallet, label: "Wallets" }].map(({ icon: Icon, label }) => (
                            <span key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-xs font-medium text-muted-foreground">
                              <Icon className="w-3.5 h-3.5" />{label}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* CTA */}
              <div className="mt-5 space-y-3">
                <button onClick={handleNext} disabled={loading} className="w-full py-4 btn-premium disabled:opacity-50 flex items-center justify-center gap-2 text-base">
                  {loading ? (<><Loader2 className="w-5 h-5 animate-spin" />Processing…</>) : store.currentStep === 1 ? (<><Lock className="w-4 h-4" />Pay {formatCurrency(payableAmount)} Securely</>) : (<>Continue<ArrowRight className="w-4 h-4" /></>)}
                </button>
                {store.currentStep > 0 && (
                  <button onClick={() => store.setStep(store.currentStep - 1)} className="w-full py-3 text-muted-foreground text-sm hover:text-foreground transition-colors flex items-center justify-center gap-1">
                    <ChevronLeft className="w-4 h-4" />Back
                  </button>
                )}
              </div>

              {/* Trust Grid */}
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {trustItems.map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="flex flex-col items-center text-center p-3 rounded-xl bg-muted/60 gap-1.5">
                    <Icon className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs font-semibold text-foreground leading-tight">{label}</p>
                      <p className="text-[10px] text-muted-foreground">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:w-[380px] flex-shrink-0">
              <div className="lg:sticky lg:top-28 space-y-4">
                <div className="premium-card p-7 shadow-xl">
                  <h3 className="font-heading font-bold text-lg text-foreground mb-5">Order Summary</h3>
                  <div className="flex items-start gap-3 pb-5 border-b border-border mb-5">
                    <div className="w-10 h-10 rounded-lg bg-[hsl(var(--color-primary-100))] flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground leading-snug">{serviceName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">One-time · All govt. fees included</p>
                    </div>
                  </div>
                  <div className="space-y-2.5 text-sm mb-5">
                    <div className="flex justify-between"><span className="text-muted-foreground">Service Price</span><span className="font-medium text-foreground">{formatCurrency(servicePrice)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Govt. Fees</span><span className="font-medium text-success">Included</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Payment Type</span><span className="font-medium text-foreground">{store.paymentType === "advance" ? "50% Advance" : "Full"}</span></div>
                  </div>
                  <div className="flex justify-between items-baseline pt-4 border-t border-border">
                    <span className="font-heading font-bold text-base text-foreground">{store.paymentType === "advance" ? "Payable Now" : "Total"}</span>
                    <span className="font-mono font-bold text-2xl text-primary">{formatCurrency(payableAmount)}</span>
                  </div>
                  {store.paymentType === "advance" && (
                    <p className="text-xs text-muted-foreground mt-1.5 text-right">Balance {formatCurrency(servicePrice - payableAmount)} due after processing starts</p>
                  )}
                  <div className="mt-5 pt-5 border-t border-border space-y-2">
                    {["No hidden charges", "All government fees included", "Dedicated manager assigned", "WhatsApp support post-payment"].map((item) => (
                      <div key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0" />{item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-muted/40 p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-5 h-5 text-success" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Have questions?</p>
                    <p className="text-xs text-muted-foreground">Chat with us on WhatsApp</p>
                  </div>
                  <a href="https://wa.me/919999999999?text=I%20have%20a%20checkout%20question" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-success hover:underline flex-shrink-0">Chat →</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <StickyMobileBar />
    </div>
  );
}
