import { Link } from "react-router-dom";
import {
  Phone, Mail, Clock, MapPin, MessageCircle,
  Scale, ShieldCheck, BadgeCheck, Star, ArrowRight, ExternalLink,
} from "lucide-react";

const WA_LINK = "https://wa.me/918793949471";
const WA_LINK_GENERAL = `${WA_LINK}?text=Hi%20KlawTax!%20I%27d%20like%20to%20know%20more%20about%20your%20services.`;

const footerLinks = {
  ngo: [
    { label: "12A Registration",     href: "/services/12a-registration"      },
    { label: "80G Registration",     href: "/services/80g-registration"      },
    { label: "NGO DARPAN",           href: "/services/darpan-registration"   },
    { label: "E-Anudan",             href: "/services/e-anudan-registration"  },
    { label: "Section 8 Company",    href: "/services/section-8-registration" },
    { label: "CSR Registration",     href: "/services/csr-registration"      },
    { label: "Udyam Registration",   href: "/services/udyam-registration"    },
  ],
  business: [
    { label: "Pvt Ltd / OPC / LLP",  href: "/services/pvt-ltd-opc-llp-registration" },
    { label: "GST Registration",     href: "/services/gst-registration"       },
    { label: "ISO Certification",    href: "/services/iso-certification"      },
    { label: "FSSAI Registration",   href: "/services/fssai-registration"     },
    { label: "ITR Filing",           href: "/services/itr-filing-compliance"  },
    { label: "Audit + UDIN",         href: "/services/audit-udin-balance-sheet"},
    { label: "Website Development",  href: "/services/website-development"    },
  ],
  company: [
    { label: "About Us",         href: "/contact"   },
    { label: "All Services",     href: "/services"  },
    { label: "Pricing",          href: "/pricing"   },
    { label: "Contact",          href: "/contact"   },
    { label: "Dashboard",        href: "/dashboard" },
    { label: "Privacy Policy",   href: "/contact"   },
  ],
};

const TRUST_ITEMS = [
  { icon: ShieldCheck, text: "Razorpay Secured" },
  { icon: BadgeCheck,  text: "MSME Certified"   },
  { icon: Star,        text: "4.9 / 5 Rated"    },
];

const contactItems: { icon: typeof Phone; text: string; href: string | null; external?: boolean }[] = [
  { icon: Phone,  text: "+91 87939 49471",           href: "tel:+918793949471"             },
  { icon: Mail,   text: "klawtaxindia@gmail.com",    href: "mailto:klawtaxindia@gmail.com" },
  { icon: Clock,  text: "Mon–Sat, 10 AM – 7 PM IST", href: null                            },
  {
    icon: MapPin,
    text: "Workshop Opp. Water Tank, Nanded 431601, MH",
    href: "https://maps.app.goo.gl/R2j9qv5kD2LfSQjP6?g_st=aw",
    external: true,
  },
];

export default function Footer() {
  return (
    <footer
      style={{
        background: "linear-gradient(180deg, #0F1B4C 0%, #070D26 100%)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* ── Top CTA strip ─────────────────────────────────── */}
      <div
        style={{
          background: "linear-gradient(90deg, rgba(30,58,138,0.65) 0%, rgba(76,29,149,0.55) 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div className="container mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.9375rem",
              color: "rgba(255,255,255,0.70)",
            }}
          >
            Ready to register your NGO?{" "}
            <span style={{ color: "#FCD34D", fontWeight: 600 }}>
              Start with just ₹6,750 advance.
            </span>
          </p>
          <a
            href="/checkout"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm flex-shrink-0 transition-all duration-200 hover:-translate-y-0.5"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              color: "#0F172A",
              background: "linear-gradient(90deg, #D97706 0%, #F59E0B 100%)",
              boxShadow: "0 4px 16px rgba(217,119,6,0.38)",
              textDecoration: "none",
            }}
          >
            Get Started Today
            <ArrowRight size={14} strokeWidth={2.5} />
          </a>
        </div>
      </div>

      {/* ── Main grid ─────────────────────────────────────── */}
      <div className="container mx-auto px-4 pt-14 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-10 mb-12">

          {/* Brand + contact */}
          <div className="lg:col-span-2">

            {/* Logo */}
            <a href="/" className="flex items-center gap-2.5 mb-5" style={{ textDecoration: "none" }}>
              <span
                className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0"
                style={{ background: "#1E3A8A", border: "1px solid rgba(255,255,255,0.12)" }}
              >
                <Scale size={17} className="text-white" strokeWidth={2} />
              </span>
              <span
                style={{
                  fontFamily: "'Sora', sans-serif",
                  fontWeight: 800,
                  fontSize: "1.25rem",
                  letterSpacing: "-0.02em",
                  color: "#FFFFFF",
                }}
              >
                Klaw<span style={{ color: "#F59E0B" }}>Tax</span>
              </span>
            </a>

            <p
              className="mb-6 leading-relaxed"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.875rem",
                color: "rgba(255,255,255,0.40)",
                maxWidth: "272px",
              }}
            >
              India's trusted platform for NGO registration, business compliance,
              and legal services — fast, transparent, and affordable.
            </p>

            {/* Contact details */}
            <div className="flex flex-col gap-3 mb-6">
              {contactItems.map(({ icon: Icon, text, href, external }) => {
                const inner = (
                  <div className="flex items-start gap-2.5">
                    <span
                      className="flex items-center justify-center w-6 h-6 rounded-md flex-shrink-0 mt-0.5"
                      style={{ background: "rgba(245,158,11,0.10)" }}
                    >
                      <Icon size={12} strokeWidth={2} style={{ color: "#F59E0B" }} />
                    </span>
                    <span
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: "0.8125rem",
                        lineHeight: 1.5,
                        color: href ? "rgba(255,255,255,0.52)" : "rgba(255,255,255,0.38)",
                      }}
                    >
                      {text}
                      {external && <ExternalLink size={10} className="inline ml-1 opacity-50" />}
                    </span>
                  </div>
                );
                return href ? (
                  <a
                    key={text}
                    href={href}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noopener noreferrer" : undefined}
                    style={{ textDecoration: "none" }}
                    onMouseEnter={(e) => {
                      const span = e.currentTarget.querySelector("span:last-child") as HTMLElement;
                      if (span) span.style.color = "rgba(255,255,255,0.88)";
                    }}
                    onMouseLeave={(e) => {
                      const span = e.currentTarget.querySelector("span:last-child") as HTMLElement;
                      if (span) span.style.color = "rgba(255,255,255,0.52)";
                    }}
                  >
                    {inner}
                  </a>
                ) : (
                  <div key={text}>{inner}</div>
                );
              })}
            </div>

            {/* WhatsApp CTA */}
            <a
              href={WA_LINK_GENERAL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                color: "#22C55E",
                background: "rgba(34,197,94,0.10)",
                border: "1.5px solid rgba(34,197,94,0.22)",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(34,197,94,0.18)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "rgba(34,197,94,0.10)")}
            >
              <MessageCircle size={15} strokeWidth={2} />
              Chat on WhatsApp
            </a>
          </div>

          {/* NGO Services */}
          <FooterCol heading="NGO Services" links={footerLinks.ngo} />

          {/* Business Services */}
          <FooterCol heading="Business & Tax" links={footerLinks.business} />

          {/* Company */}
          <FooterCol heading="Company" links={footerLinks.company} />
        </div>

        {/* ── Bottom bar ─────────────────────────────────── */}
        <div
          className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.75rem",
              color: "rgba(255,255,255,0.26)",
            }}
          >
            © {new Date().getFullYear()} KlawTax.online — All rights reserved. | Nanded, Maharashtra, India
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            {TRUST_ITEMS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5">
                <Icon size={13} strokeWidth={2} style={{ color: "rgba(245,158,11,0.60)" }} />
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.75rem",
                    color: "rgba(255,255,255,0.30)",
                  }}
                >
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ heading, links }: { heading: string; links: { label: string; href: string }[] }) {
  return (
    <div className="lg:col-span-1">
      <h4
        className="mb-4 text-xs uppercase"
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 600,
          color: "rgba(255,255,255,0.28)",
          letterSpacing: "0.08em",
        }}
      >
        {heading}
      </h4>
      <ul className="flex flex-col gap-2.5">
        {links.map((l) => (
          <li key={l.href + l.label}>
            <Link
              to={l.href}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.875rem",
                color: "rgba(255,255,255,0.48)",
                textDecoration: "none",
                transition: "color 0.15s",
                display: "block",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.88)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.48)")}
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
