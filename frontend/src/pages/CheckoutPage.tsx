/**
 * CheckoutPage — Batch 4.3
 *
 * Changes:
 * - Uses hydrateFromToken() from AuthContext after payment success
 *   so the client is seamlessly logged in for /dashboard access
 * - Stores orderData.clientId for the verify payload
 * - Drops stale setStoredToken direct call (now done via hydrateFromToken)
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { shake, checkmarkAnim, pageTransition, slideStep } from "@/lib/motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import StickyMobileBar from "@/components/shared/StickyMobileBar";
import SEO from "@/components/shared/SEO";
import { useCheckoutStore } from "@/store/useCheckoutStore";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/lib/utils";
import { resolveCheckoutService, DEFAULT_CHECKOUT_SERVICE } from "@/lib/services";
import {
  createPaymentOrder,
  verifyPayment,
  getErrorMessage,
} from "@/lib/api";
import {
  Shield, CheckCircle2, MessageCircle, LayoutDashboard,
  FileText, Lock, Clock, Headphones, ChevronLeft,
  Loader2, BadgeCheck, CreditCard, Wallet, ArrowRight, CircleDot,
  Smartphone, Phone,
} from "lucide-react";

const CONTACT_PHONE   = "917387731313";
const CONTACT_DISPLAY = "+91 73877 31313";
const CONTACT_EMAIL   = "info@klawtax.online";

const steps = ["Details", "Payment", "Confirmation"];

const trustItems = [
  { icon: Shield,      label: "Secure Payment",    sub: "256-bit SSL" },
  { icon: BadgeCheck,  label: "Legal Experts",      sub: "CS & CA team" },
  { icon: Clock,       label: "48hr Start",          sub: "Fast processing" },
  { icon: Headphones,  label: "WhatsApp Support",   sub: "Post-payment" },
];

function buildUpiLink(amount: number, name: string): string {
  const pa = "7387731313@hdfc";
  const pn = "KlawTax";
  const tn = encodeURIComponent("Payment for " + name);
  const am = amount.toFixed(2);
  return `upi://pay?pa=${pa}&pn=${pn}&tn=${tn}&am=${am}&cu=INR`;
}

function buildWaOrderLink(orderId: string, serviceName: string): string {
  const msg = encodeURIComponent(
    `Hi KlawTax! Payment confirmed.\nOrder ID: ${orderId}\nService: ${serviceName}\nPlease guide me on the next steps.`
  );
  return `https://wa.me/${CONTACT_PHONE}?text=${msg}`;
}

function buildWaHelpLink(serviceName: string): string {
  const msg = encodeURIComponent(`Hi KlawTax! I have a question about: ${serviceName}`);
  return `https://wa.me/${CONTACT_PHONE}?text=${msg}`;
}

export default function CheckoutPage() {
  const [searchParams]  = useSearchParams();
  const store           = useCheckoutStore();
  const { hydrateFromToken } = useAuth();

  const [errors, setErrors]           = useState<Record<string, string>>({});
  const [loading, setLoading]         = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const slugParam    = searchParams.get("service") ?? "";
  const advanceParam = searchParams.get("advance") === "true";

  useEffect(() => {
    const info     = slugParam ? resolveCheckoutService(slugParam) : DEFAULT_CHECKOUT_SERVICE;
    const resolved = info ?? DEFAULT_CHECKOUT_SERVICE;
    store.setService(resolved.id, resolved.name, resolved.price);
    if (advanceParam) store.setPaymentType("advance");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slugParam, advanceParam]);

  const serviceInfo   = (slugParam ? resolveCheckoutService(slugParam) : null) ?? DEFAULT_CHECKOUT_SERVICE;
  const serviceName   = store.serviceName  || serviceInfo.name;
  const servicePrice  = store.servicePrice > 0 ? store.servicePrice : serviceInfo.price;
  const advanceAmount = Math.ceil(servicePrice / 2);
  const payableAmount = store.paymentType === "advance" ? advanceAmount : servicePrice;

  function validateStep0() {
    const e: Record<string, string> = {};
    if (!store.userName.trim())
      e.name = "Name is required";
    if (!store.userPhone.trim() || store.userPhone.replace(/\D/g, "").length < 10)
      e.phone = "Valid 10-digit mobile required";
    if (!store.userEmail.trim() || !store.userEmail.includes("@"))
      e.email = "Valid email required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handlePayment() {
    setLoading(true);
    setPaymentError(null);

    // ── Step 1: Create order on backend ──────────────────────
    let orderData: {
      razorpayOrderId: string;
      invoiceId:       string;
      amount:          number;
      clientId?:       string;
    } | null = null;

    try {
      orderData = await createPaymentOrder({
        serviceId:   store.serviceId,
        serviceName: serviceName,
        amount:      payableAmount,
        paymentType: store.paymentType,
        customer: {
          name:  store.userName,
          email: store.userEmail,
          phone: store.userPhone,
          city:  store.userCity || undefined,
        },
      });
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn("[KlawTax Checkout] Backend order creation failed — fallback mode.", err);
      }
    }

    // ── Step 2: Open Razorpay modal ───────────────────────────
    if (typeof (window as unknown as { Razorpay?: unknown }).Razorpay !== "undefined") {
      const options: Record<string, unknown> = {
        key:         (import.meta.env.VITE_RAZORPAY_KEY_ID as string) || "",
        amount:      (orderData?.amount ?? payableAmount) * 100,
        currency:    "INR",
        name:        "KlawTax.online",
        description: serviceName,
        image:       "/favicon.png",
        ...(orderData?.razorpayOrderId ? { order_id: orderData.razorpayOrderId } : {}),

        handler: async (response: {
          razorpay_order_id?:  string;
          razorpay_payment_id: string;
          razorpay_signature?: string;
        }) => {
          // ── Step 3: Verify on backend ───────────────────────
          if (orderData?.razorpayOrderId && response.razorpay_signature) {
            try {
              const verified = await verifyPayment({
                razorpayOrderId:   response.razorpay_order_id ?? orderData.razorpayOrderId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                invoiceId:         orderData.invoiceId,
                clientId:          orderData.clientId,
              });

              // ── Hydrate client auth session ─────────────────
              if (verified.clientAccessToken) {
                hydrateFromToken(verified.clientAccessToken, {
                  email:     store.userEmail,
                  firstName: store.userName.split(" ")[0] ?? store.userName,
                  lastName:  store.userName.split(" ").slice(1).join(" ") ?? "",
                });
              }

              store.completeCheckout(verified.orderId);
            } catch (verifyErr) {
              // Webhook will reconcile — still show success
              if (import.meta.env.DEV) {
                console.warn("[KlawTax] Verify call failed — webhook will reconcile.", verifyErr);
              }
              store.completeCheckout();
            }
          } else {
            store.completeCheckout();
          }
          setLoading(false);
          store.setStep(2);
        },

        prefill: {
          name:    store.userName,
          email:   store.userEmail,
          contact: "91" + store.userPhone,
        },
        notes: { service: serviceName, service_id: store.serviceId },
        theme: { color: "#1E3A8A" },
        modal: {
          ondismiss: () => { setLoading(false); },
        },
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", (res: { error: { description: string } }) => {
        setLoading(false);
        setPaymentError(res.error?.description ?? "Payment failed. Please try again.");
      });
      rzp.open();
      return;
    }

    // ── Fallback: Razorpay SDK unavailable (dev / test) ───────
    setTimeout(() => {
      setLoading(false);
      store.completeCheckout();
      store.setStep(2);
    }, 1800);
  }

  function handleNext() {
    if (store.currentStep === 0) {
      if (validateStep0()) store.setStep(1);
    } else if (store.currentStep === 1) {
      handlePayment();
    }
  }

  // ── Confirmation screen ──────────────────────────────────────
  if (store.isComplete) {
    const waOrderLink = buildWaOrderLink(store.orderId, serviceName);
    return (
      <div className="min-h-screen flex flex-col">
        <SEO title="Payment Successful | KlawTax" noindex={true} />
        <Navbar />
        <main
          id="main-content" role="main"
          className="pt-28 pb-16 flex-1 flex items-center justify-center px-4"
        >
          <motion.div
            variants={pageTransition}
            initial="hidden"
            animate="visible"
            className="max-w-lg w-full text-center premium-card p-10"
          >
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
                <motion.svg
                  className="w-12 h-12 text-success"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <motion.path
                    variants={checkmarkAnim}
                    initial="hidden"
                    animate="visible"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </motion.svg>
              </div>
            </div>

            <h1 className="page-title text-foreground mb-1">Payment Successful!</h1>
            <p className="text-sm text-muted-foreground mb-1">
              Order ID:{" "}
              <span className="font-mono font-bold text-primary">{store.orderId}</span>
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              Thank you, {store.userName}! Our team will contact you on WhatsApp within 2
              hours.
            </p>

            <div className="space-y-3">
              <a
                href={waOrderLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-success text-white font-bold hover:opacity-90 transition-opacity"
              >
                <MessageCircle className="w-4 h-4" /> Open WhatsApp Chat
              </a>
              <Link
                to="/submit-documents"
                className="flex items-center justify-center gap-2 w-full py-3.5 btn-premium"
              >
                <FileText className="w-4 h-4" /> Submit Documents{" "}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/dashboard"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-border font-medium hover:bg-muted transition-colors text-foreground"
              >
                <LayoutDashboard className="w-4 h-4" /> View Dashboard
              </Link>
            </div>

            <p className="mt-6 text-xs text-muted-foreground">
              Need help?{" "}
              <a
                href={"tel:+" + CONTACT_PHONE}
                className="font-semibold text-primary hover:underline"
              >
                {CONTACT_DISPLAY}
              </a>
              {" · "}
              <a
                href={"mailto:" + CONTACT_EMAIL}
                className="font-semibold text-primary hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
            </p>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  const waHelpLink = buildWaHelpLink(serviceName);
  const upiLink    = buildUpiLink(payableAmount, serviceName);

  return (
    <div className="min-h-screen flex flex-col">
      <SEO
        title={`Checkout — ${serviceName} | KlawTax`}
        description={`Complete your payment for ${serviceName}. Secure checkout via Razorpay. Pay ₹${payableAmount.toLocaleString("en-IN")}.`}
        noindex={true}
      />
      <Navbar />
      <main id="main-content" role="main" className="pt-28 pb-24 flex-1">
        <div className="container mx-auto px-4 max-w-6xl">

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-10">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                      i < store.currentStep
                        ? "bg-success text-white"
                        : i === store.currentStep
                        ? "bg-primary text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i < store.currentStep ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium hidden sm:inline ${
                      i <= store.currentStep ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {s}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`w-10 h-0.5 mx-1 transition-colors ${
                      i < store.currentStep ? "bg-success" : "bg-border"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col lg:flex-row gap-8 max-w-5xl mx-auto">

            {/* Form area */}
            <div className="flex-1 min-w-0">
              <AnimatePresence mode="wait">

                {store.currentStep === 0 && (
                  <motion.div
                    key="step0"
                    variants={slideStep}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <div className="premium-card p-5 sm:p-8">
                      <h2 className="section-heading text-foreground mb-1">
                        Your Details
                      </h2>
                      <p className="text-sm text-muted-foreground mb-8">
                        We'll assign a dedicated manager and send updates via WhatsApp.
                      </p>

                      <div className="space-y-5">
                        {/* Name */}
                        <motion.div
                          variants={shake}
                          animate={errors.name ? "error" : "visible"}
                        >
                          <label
                            htmlFor="checkout-name"
                            className="form-label block mb-1.5"
                          >
                            Full Name <span className="text-destructive">*</span>
                          </label>
                          <input
                            id="checkout-name"
                            value={store.userName}
                            onChange={(e) =>
                              store.setUserDetails({
                                name:  e.target.value,
                                email: store.userEmail,
                                phone: store.userPhone,
                                city:  store.userCity,
                              })
                            }
                            className={`w-full px-4 py-3.5 input-premium ${
                              errors.name ? "border-destructive" : ""
                            }`}
                            placeholder="Enter your full name"
                            autoComplete="name"
                          />
                          {errors.name && (
                            <p className="text-destructive text-xs mt-1.5 font-medium flex items-center gap-1">
                              <CircleDot className="w-3 h-3" />
                              {errors.name}
                            </p>
                          )}
                        </motion.div>

                        {/* Email */}
                        <motion.div
                          variants={shake}
                          animate={errors.email ? "error" : "visible"}
                        >
                          <label
                            htmlFor="checkout-email"
                            className="form-label block mb-1.5"
                          >
                            Email Address <span className="text-destructive">*</span>
                          </label>
                          <input
                            id="checkout-email"
                            type="email"
                            value={store.userEmail}
                            onChange={(e) =>
                              store.setUserDetails({
                                name:  store.userName,
                                email: e.target.value,
                                phone: store.userPhone,
                                city:  store.userCity,
                              })
                            }
                            className={`w-full px-4 py-3.5 input-premium ${
                              errors.email ? "border-destructive" : ""
                            }`}
                            placeholder="you@example.com"
                            autoComplete="email"
                          />
                          {errors.email && (
                            <p className="text-destructive text-xs mt-1.5 font-medium flex items-center gap-1">
                              <CircleDot className="w-3 h-3" />
                              {errors.email}
                            </p>
                          )}
                        </motion.div>

                        {/* Phone */}
                        <motion.div
                          variants={shake}
                          animate={errors.phone ? "error" : "visible"}
                        >
                          <label
                            htmlFor="checkout-phone"
                            className="form-label block mb-1.5"
                          >
                            Mobile Number <span className="text-destructive">*</span>
                          </label>
                          <div className="flex">
                            <span className="flex items-center px-3.5 py-3.5 border border-r-0 border-border rounded-l-lg bg-muted text-sm font-medium text-muted-foreground">
                              +91
                            </span>
                            <input
                              id="checkout-phone"
                              type="tel"
                              value={store.userPhone}
                              onChange={(e) =>
                                store.setUserDetails({
                                  name:  store.userName,
                                  email: store.userEmail,
                                  phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                                  city:  store.userCity,
                                })
                              }
                              className={`flex-1 px-4 py-3.5 input-premium rounded-l-none ${
                                errors.phone ? "border-destructive" : ""
                              }`}
                              placeholder="9876543210"
                              autoComplete="tel"
                              maxLength={10}
                              inputMode="numeric"
                            />
                          </div>
                          {errors.phone && (
                            <p className="text-destructive text-xs mt-1.5 font-medium flex items-center gap-1">
                              <CircleDot className="w-3 h-3" />
                              {errors.phone}
                            </p>
                          )}
                        </motion.div>

                        {/* City */}
                        <div>
                          <label
                            htmlFor="checkout-city"
                            className="form-label block mb-1.5"
                          >
                            City / State
                          </label>
                          <input
                            id="checkout-city"
                            value={store.userCity}
                            onChange={(e) =>
                              store.setUserDetails({
                                name:  store.userName,
                                email: store.userEmail,
                                phone: store.userPhone,
                                city:  e.target.value,
                              })
                            }
                            className="w-full px-4 py-3.5 input-premium"
                            placeholder="e.g. Mumbai, Maharashtra"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {store.currentStep === 1 && (
                  <motion.div
                    key="step1"
                    variants={slideStep}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <div className="premium-card p-5 sm:p-8">
                      <h2 className="section-heading text-foreground mb-1">
                        Choose Payment Option
                      </h2>
                      <p className="text-sm text-muted-foreground mb-8">
                        Both options include all government fees — no hidden charges.
                      </p>

                      <div className="space-y-4 mb-6">
                        {/* Full payment */}
                        <button
                          onClick={() => store.setPaymentType("full")}
                          className={`w-full p-5 rounded-xl border-2 text-left transition-all ${
                            store.paymentType === "full"
                              ? "border-primary bg-[#EFF6FF]"
                              : "border-border hover:border-primary/40"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                              <div
                                className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                                  store.paymentType === "full"
                                    ? "border-primary bg-primary"
                                    : "border-border"
                                }`}
                              >
                                {store.paymentType === "full" && (
                                  <div className="w-2 h-2 rounded-full bg-white" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                  <h3 className="font-heading font-semibold text-foreground">
                                    Pay Full Amount
                                  </h3>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success/10 text-success">
                                    RECOMMENDED
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Fastest processing — work starts immediately
                                </p>
                              </div>
                            </div>
                            <span className="font-mono font-bold text-xl text-primary flex-shrink-0">
                              {formatCurrency(servicePrice)}
                            </span>
                          </div>
                        </button>

                        {/* 50% advance */}
                        <button
                          onClick={() => store.setPaymentType("advance")}
                          className={`w-full p-5 rounded-xl border-2 text-left transition-all ${
                            store.paymentType === "advance"
                              ? "border-primary bg-[#EFF6FF]"
                              : "border-border hover:border-primary/40"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                              <div
                                className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                                  store.paymentType === "advance"
                                    ? "border-primary bg-primary"
                                    : "border-border"
                                }`}
                              >
                                {store.paymentType === "advance" && (
                                  <div className="w-2 h-2 rounded-full bg-white" />
                                )}
                              </div>
                              <div>
                                <h3 className="font-heading font-semibold text-foreground mb-0.5">
                                  Pay 50% Advance
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  Pay{" "}
                                  <span className="font-semibold text-foreground">
                                    {formatCurrency(advanceAmount)}
                                  </span>{" "}
                                  now · Balance after work begins
                                </p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <span className="font-mono font-bold text-xl text-primary">
                                {formatCurrency(advanceAmount)}
                              </span>
                              <p className="text-xs text-muted-foreground mt-0.5">due now</p>
                            </div>
                          </div>
                        </button>
                      </div>

                      {/* Payment methods */}
                      <div className="pt-5 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-3 flex items-center gap-2">
                          <Lock className="w-3.5 h-3.5" /> Secured by Razorpay — 256-bit SSL
                          encryption
                        </p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {[
                            { icon: CreditCard, label: "Cards" },
                            { icon: Smartphone, label: "UPI" },
                            { icon: Wallet,     label: "Net Banking" },
                            { icon: Wallet,     label: "Wallets" },
                          ].map(({ icon: Icon, label }) => (
                            <span
                              key={label}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-xs font-medium text-muted-foreground"
                            >
                              <Icon className="w-3.5 h-3.5" />
                              {label}
                            </span>
                          ))}
                        </div>

                        <div className="rounded-xl border border-border bg-muted/40 p-3.5">
                          <p className="text-xs font-semibold text-foreground mb-2.5">
                            Alternative payment options
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <a
                              href={upiLink}
                              className="flex items-center justify-center gap-2 flex-1 py-2.5 rounded-lg border border-border bg-white text-xs font-semibold text-foreground hover:border-primary/40 transition-colors"
                            >
                              <Smartphone className="w-3.5 h-3.5 text-primary" /> Pay via UPI App
                            </a>
                            <a
                              href={waHelpLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 flex-1 py-2.5 rounded-lg border border-border bg-white text-xs font-semibold text-[#15803D] hover:border-success/40 transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5" /> Pay via WhatsApp
                            </a>
                            <a
                              href={"tel:+" + CONTACT_PHONE}
                              className="flex items-center justify-center gap-2 flex-1 py-2.5 rounded-lg border border-border bg-white text-xs font-semibold text-foreground hover:border-primary/40 transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5 text-primary" /> Call to Pay
                            </a>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-2">
                            For WhatsApp / phone payments: mention your name and the service.
                            We'll send a payment link.
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* CTA */}
              <div className="mt-5 space-y-3">
                <button
                  onClick={handleNext}
                  disabled={loading}
                  className="w-full py-4 btn-premium disabled:opacity-50 flex items-center justify-center gap-2 text-base"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing…
                    </>
                  ) : store.currentStep === 1 ? (
                    <>
                      <Lock className="w-4 h-4" />
                      Pay {formatCurrency(payableAmount)} Securely
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {paymentError && (
                  <p className="text-destructive text-sm text-center font-medium flex items-center justify-center gap-1">
                    <CircleDot className="w-3.5 h-3.5 flex-shrink-0" />
                    {paymentError}
                  </p>
                )}

                {store.currentStep > 0 && (
                  <button
                    onClick={() => {
                      store.setStep(store.currentStep - 1);
                      setPaymentError(null);
                    }}
                    className="w-full py-3 text-muted-foreground text-sm hover:text-foreground transition-colors flex items-center justify-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                )}
              </div>

              {/* Trust grid */}
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {trustItems.map(({ icon: Icon, label, sub }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center text-center p-3 rounded-xl bg-muted/60 gap-1.5"
                  >
                    <Icon className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs font-semibold text-foreground leading-tight">
                        {label}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary sidebar */}
            <div className="lg:w-[380px] flex-shrink-0">
              <div className="lg:sticky lg:top-28 space-y-4">
                <div className="premium-card p-5 sm:p-7 shadow-xl">
                  <h3 className="font-heading font-bold text-lg text-foreground mb-5">
                    Order Summary
                  </h3>
                  <div className="flex items-start gap-3 pb-5 border-b border-border mb-5">
                    <div className="w-10 h-10 rounded-lg bg-[#DBEAFE] flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground leading-snug">
                        {serviceName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        One-time · All govt. fees included
                      </p>
                      {slugParam && slugParam !== "section8-complete" && (
                        <Link
                          to={"/services/" + slugParam}
                          className="text-xs text-primary hover:underline mt-1 inline-block"
                        >
                          View service details →
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2.5 text-sm mb-5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Service Price</span>
                      <span className="font-medium text-foreground">
                        {formatCurrency(servicePrice)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Govt. Fees</span>
                      <span className="font-medium text-success">Included</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment Type</span>
                      <span className="font-medium text-foreground">
                        {store.paymentType === "advance" ? "50% Advance" : "Full"}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-baseline pt-4 border-t border-border">
                    <span className="font-heading font-bold text-base text-foreground">
                      {store.paymentType === "advance" ? "Payable Now" : "Total"}
                    </span>
                    <span className="font-mono font-bold text-2xl text-primary">
                      {formatCurrency(payableAmount)}
                    </span>
                  </div>
                  {store.paymentType === "advance" && (
                    <p className="text-xs text-muted-foreground mt-1.5 text-right">
                      Balance {formatCurrency(servicePrice - payableAmount)} due after
                      processing starts
                    </p>
                  )}

                  <div className="mt-5 pt-5 border-t border-border space-y-2">
                    {[
                      "No hidden charges",
                      "All government fees included",
                      "Dedicated manager assigned",
                      "WhatsApp support post-payment",
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-2 text-xs text-muted-foreground"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                {/* WhatsApp help */}
                <div className="rounded-xl border border-border bg-muted/40 p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-5 h-5 text-success" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Have questions?</p>
                    <p className="text-xs text-muted-foreground">Chat with us on WhatsApp</p>
                  </div>
                  <a
                    href={waHelpLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-success hover:underline flex-shrink-0"
                  >
                    Chat →
                  </a>
                </div>

                {/* Phone */}
                <div className="rounded-xl border border-border bg-muted/40 p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Prefer a call?</p>
                    <p className="text-xs text-muted-foreground">Mon–Sat, 9 AM – 7 PM IST</p>
                  </div>
                  <a
                    href={"tel:+" + CONTACT_PHONE}
                    className="text-xs font-semibold text-primary hover:underline flex-shrink-0"
                  >
                    {CONTACT_DISPLAY}
                  </a>
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
