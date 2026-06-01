import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ServicesGrid from "@/components/sections/ServicesGrid";
import CTABanner from "@/components/sections/CTABanner";
import StickyMobileBar from "@/components/shared/StickyMobileBar";
import SEO from "@/components/shared/SEO";
import { pageTransition, staggerContainer, staggerItem } from "@/lib/motion";
import { SERVICES_LIST } from "@/lib/services";
import { servicesPageSchema } from "@/lib/seo";

export default function ServicesPage() {
  return (
    <motion.div
      variants={pageTransition}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="min-h-screen flex flex-col"
    >
      <SEO
        title="All Legal & NGO Services | KlawTax"
        description={`Browse ${SERVICES_LIST.length}+ legal, NGO, compliance, audit, and digital services. Flat-fee pricing with CA/CS experts. NGO registration, GST, ISO, FSSAI and more — pan-India.`}
        keywords="NGO registration services India, Section 8 company, 12A 80G registration, GST registration, ISO certification, FSSAI license, company registration India, legal compliance services, KlawTax"
        canonical="/services"
        schema={servicesPageSchema}
      />
      <Navbar />
      <main id="main-content" role="main" className="flex-1">
        {/* Hero banner */}
        <section
          className="pt-28 pb-14 md:pt-36 md:pb-16"
          style={{
            background:
              "linear-gradient(135deg, #0F1B4C 0%, #1A2D6B 45%, #2E1065 100%)",
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="max-w-2xl"
            >
              <motion.div variants={staggerItem}>
                <span
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    background: "rgba(245,158,11,0.12)",
                    border: "1px solid rgba(245,158,11,0.25)",
                    color: "#FCD34D",
                    letterSpacing: "0.04em",
                  }}
                >
                  {SERVICES_LIST.length}+ SERVICES AVAILABLE
                </span>
              </motion.div>

              <motion.h1
                variants={staggerItem}
                style={{
                  fontFamily: "'Sora', sans-serif",
                  fontWeight: 800,
                  fontSize: "clamp(2rem, 5vw, 3rem)",
                  letterSpacing: "-0.025em",
                  color: "white",
                  lineHeight: 1.1,
                }}
                className="mb-4"
              >
                All Legal & NGO Services
              </motion.h1>

              <motion.p
                variants={staggerItem}
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "1.0625rem",
                  color: "rgba(255,255,255,0.60)",
                  lineHeight: 1.7,
                }}
              >
                From NGO registration to business compliance, digital services, and
                beyond — all at transparent flat fees with expert CA/CS support.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Services grid — reads ?category= from URL automatically */}
        <ServicesGrid />

        <CTABanner />
      </main>
      <Footer />
      <StickyMobileBar />
    </motion.div>
  );
}
