import { motion } from "framer-motion";
import { staggerContainer, fadeInUp } from "@/lib/motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import StickyMobileBar from "@/components/shared/StickyMobileBar";
import SEO from "@/components/shared/SEO";
import { useDashboardStore } from "@/store/useDashboardStore";
import { formatCurrency } from "@/lib/utils";
import {
  ClipboardList, CreditCard, Bell, MessageCircle,
  CheckCircle2, Clock, Phone, Mail, ArrowRight,
  TrendingUp, AlertCircle, User,
} from "lucide-react";

const statusSteps = ["payment_confirmed", "documents_received", "processing", "filed", "completed"] as const;
const statusLabels: Record<string, string> = {
  payment_confirmed: "Payment Confirmed",
  documents_received: "Documents Received",
  processing: "Processing",
  filed: "Filed",
  completed: "Completed",
};
const statusColors: Record<string, string> = {
  payment_confirmed: "text-primary bg-[hsl(var(--color-primary-100))]",
  documents_received: "text-[hsl(var(--color-secondary-700))] bg-[hsl(var(--color-secondary-100))]",
  processing: "text-warning bg-warning/10",
  filed: "text-info bg-info/10",
  completed: "text-success bg-success/10",
};

const sidebarItems = [
  { key: "orders", label: "My Orders", icon: ClipboardList },
  { key: "payments", label: "Payments", icon: CreditCard },
  { key: "updates", label: "Updates", icon: Bell },
  { key: "support", label: "Support", icon: MessageCircle },
];

export default function DashboardPage() {
  const { orders, updates, activeSection, setActiveSection } = useDashboardStore();

  return (
    <div className="min-h-screen bg-[hsl(var(--color-neutral-50))]">
      <SEO title="My Dashboard | KlawTax" noindex={true} />
      <Navbar />
      <main role="main" className="pt-28 pb-24">
        <div className="container mx-auto px-4 max-w-6xl">

          {/* Page header */}
          <div className="mb-8">
            <h1 className="page-title text-foreground mb-1">Client Dashboard</h1>
            <p className="text-muted-foreground text-sm">Track your registrations, payments, and updates in real-time.</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <aside className="lg:w-60 flex-shrink-0">
              <div className="premium-card p-3 lg:p-4">
                {/* User pill */}
                <div className="flex items-center gap-3 px-3 py-3 mb-3 border-b border-border">
                  <div className="w-9 h-9 rounded-full bg-[hsl(var(--color-primary-100))] flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">My Account</p>
                    <p className="text-xs text-muted-foreground">Client Portal</p>
                  </div>
                </div>

                <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0">
                  {sidebarItems.map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setActiveSection(key)}
                      aria-label={label}
                      aria-pressed={activeSection === key}
                      className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all w-full text-left ${
                        activeSection === key
                          ? "bg-primary text-white shadow-sm"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                      {label}
                    </button>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Content */}
            <div className="flex-1 min-w-0">

              {/* ── Orders ───────────────────────────────── */}
              {activeSection === "orders" && (
                <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-5">
                  {orders.map((o, index) => {
                    const stepIndex = statusSteps.indexOf(o.status as typeof statusSteps[number]);
                    return (
                      <motion.div
                        key={o.id}
                        variants={fadeInUp}
                        transition={{ delay: index * 0.08 }}
                        className="premium-card p-6 md:p-8 hover-lift"
                      >
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
                          <div>
                            <h3 className="card-title text-foreground mb-1">{o.service}</h3>
                            <p className="text-xs text-muted-foreground font-mono">
                              Order #{o.id} &nbsp;·&nbsp; {o.date}
                            </p>
                          </div>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 ${statusColors[o.status] || "text-muted-foreground bg-muted"}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {statusLabels[o.status]}
                          </span>
                        </div>

                        {/* Progress Timeline */}
                        <div className="relative">
                          {/* Desktop: horizontal */}
                          <div className="hidden sm:flex items-center">
                            {statusSteps.map((s, i) => (
                              <div key={s} className="flex items-center flex-1 last:flex-none">
                                <div className="flex flex-col items-center gap-1">
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors flex-shrink-0 ${
                                    i < stepIndex ? "bg-success text-white" :
                                    i === stepIndex ? "bg-primary text-white ring-2 ring-primary ring-offset-2" :
                                    "bg-muted text-muted-foreground"
                                  }`}>
                                    {i < stepIndex ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
                                  </div>
                                  <span className="text-[9px] text-muted-foreground text-center leading-tight max-w-[60px]">
                                    {statusLabels[s]}
                                  </span>
                                </div>
                                {i < statusSteps.length - 1 && (
                                  <div className={`flex-1 h-0.5 mx-2 mb-4 transition-colors ${i < stepIndex ? "bg-success" : "bg-border"}`} />
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Mobile: compact badge row */}
                          <div className="flex sm:hidden gap-1.5 flex-wrap">
                            {statusSteps.map((s, i) => (
                              <span key={s} className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                                i < stepIndex ? "bg-success/10 text-success" :
                                i === stepIndex ? "bg-primary text-white" :
                                "bg-muted text-muted-foreground"
                              }`}>
                                {statusLabels[s]}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Payment summary strip */}
                        <div className="mt-6 pt-5 border-t border-border flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                          <div className="flex gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground text-xs block">Total</span>
                              <span className="font-mono font-bold text-foreground">{formatCurrency(o.amount)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-xs block">Paid</span>
                              <span className="font-mono font-bold text-success">{formatCurrency(o.paidAmount)}</span>
                            </div>
                            {o.pendingAmount > 0 && (
                              <div>
                                <span className="text-muted-foreground text-xs block">Pending</span>
                                <span className="font-mono font-bold text-warning">{formatCurrency(o.pendingAmount)}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <a href="https://wa.me/919999999999" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-success/10 text-success text-xs font-semibold hover:bg-success/20 transition-colors">
                              <MessageCircle className="w-3.5 h-3.5" />Chat with Manager
                            </a>
                            {o.pendingAmount > 0 && (
                              <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:opacity-90 transition-opacity">
                                <CreditCard className="w-3.5 h-3.5" />Pay Balance
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}

              {/* ── Payments ─────────────────────────────── */}
              {activeSection === "payments" && (
                <div className="space-y-5">
                  {orders.map((o, index) => (
                    <motion.div
                      key={o.id}
                      variants={fadeInUp}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: index * 0.08 }}
                      className="premium-card p-6 md:p-8 hover-lift"
                    >
                      <div className="flex items-start justify-between mb-5">
                        <div>
                          <h3 className="card-title text-foreground mb-0.5">{o.service}</h3>
                          <p className="text-xs font-mono text-muted-foreground">{o.id}</p>
                        </div>
                        {o.pendingAmount > 0 ? (
                          <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-warning/10 text-warning">
                            <AlertCircle className="w-3 h-3" />Balance Due
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-success/10 text-success">
                            <CheckCircle2 className="w-3 h-3" />Fully Paid
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-5">
                        <div className="p-4 rounded-xl bg-muted/60 text-center">
                          <p className="text-xs text-muted-foreground mb-1">Total</p>
                          <p className="font-mono font-bold text-foreground text-sm">{formatCurrency(o.amount)}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-success/5 border border-success/20 text-center">
                          <p className="text-xs text-muted-foreground mb-1">Paid</p>
                          <p className="font-mono font-bold text-success text-sm">{formatCurrency(o.paidAmount)}</p>
                        </div>
                        <div className={`p-4 rounded-xl text-center ${o.pendingAmount > 0 ? "bg-warning/5 border border-warning/20" : "bg-muted/60"}`}>
                          <p className="text-xs text-muted-foreground mb-1">Pending</p>
                          <p className={`font-mono font-bold text-sm ${o.pendingAmount > 0 ? "text-warning" : "text-muted-foreground"}`}>{formatCurrency(o.pendingAmount)}</p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mb-5">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                          <span>Payment progress</span>
                          <span>{Math.round((o.paidAmount / o.amount) * 100)}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-success rounded-full transition-all" style={{ width: `${(o.paidAmount / o.amount) * 100}%` }} />
                        </div>
                      </div>

                      {o.pendingAmount > 0 && (
                        <button className="w-full py-3.5 btn-premium flex items-center justify-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          Pay Remaining {formatCurrency(o.pendingAmount)}
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}

              {/* ── Updates ──────────────────────────────── */}
              {activeSection === "updates" && (
                <div className="space-y-3">
                  {updates.length === 0 ? (
                    <div className="premium-card p-12 text-center">
                      <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">No updates yet</p>
                    </div>
                  ) : (
                    updates.map((u, index) => (
                      <motion.div
                        key={u.id}
                        variants={fadeInUp}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: index * 0.08 }}
                        className="flex gap-4 p-5 premium-card hover-lift"
                      >
                        <div className="mt-1.5 flex-shrink-0">
                          <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground font-medium">{u.message}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs font-mono text-muted-foreground">{u.orderId}</span>
                            <span className="text-muted-foreground text-xs">·</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />{u.date}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              )}

              {/* ── Support ──────────────────────────────── */}
              {activeSection === "support" && (
                <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="space-y-4">
                  {/* WhatsApp — primary */}
                  <div className="premium-card p-6 md:p-8 border-l-4 border-l-success">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center flex-shrink-0">
                        <MessageCircle className="w-6 h-6 text-success" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-heading font-semibold text-foreground mb-1">WhatsApp Support</h3>
                        <p className="text-sm text-muted-foreground mb-4">Fastest way to reach us — typically replies within 30 minutes.</p>
                        <a href="https://wa.me/919999999999" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-success text-white text-sm font-semibold hover:opacity-90 transition-opacity">
                          <MessageCircle className="w-4 h-4" />Open WhatsApp<ArrowRight className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Other channels */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="premium-card p-6">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-[hsl(var(--color-primary-100))] flex items-center justify-center flex-shrink-0">
                          <Phone className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-heading font-semibold text-foreground text-sm">Call Us</h4>
                          <p className="text-xs text-muted-foreground">Mon–Sat, 10AM–7PM IST</p>
                        </div>
                      </div>
                      <a href="tel:+919999999999" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
                        +91 99999 99999 <ArrowRight className="w-3 h-3" />
                      </a>
                    </div>

                    <div className="premium-card p-6">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-[hsl(var(--color-primary-100))] flex items-center justify-center flex-shrink-0">
                          <Mail className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-heading font-semibold text-foreground text-sm">Email</h4>
                          <p className="text-xs text-muted-foreground">Response within 4 business hours</p>
                        </div>
                      </div>
                      <a href="mailto:hello@klawtax.online" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
                        hello@klawtax.online <ArrowRight className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <div className="rounded-xl bg-muted/60 p-5 flex items-center gap-3 border border-border">
                    <TrendingUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">Our team is available <strong className="text-foreground">Monday to Saturday, 10AM–7PM IST</strong>. We aim to respond to all queries within 2 hours.</p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <StickyMobileBar />
    </div>
  );
}
