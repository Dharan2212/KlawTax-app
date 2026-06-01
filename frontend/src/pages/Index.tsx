/**
 * Homepage — Batch C
 *
 * Changes:
 *  - ProcessTimeline moved above ServicesGrid (narrative flow: hero → stats → how it works → services → package → pricing → testimonials → CTA)
 *  - Added semantic aria-labelledby on process section
 *  - Section order now matches the optimal conversion funnel
 *  - No business logic, pricing, or API changes
 */

import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/sections/HeroSection";
import ServicesGrid from "@/components/sections/ServicesGrid";
import StatsTicker from "@/components/sections/StatsTicker";
import TrustTicker from "@/components/sections/TrustTicker";
import FeaturedPackage from "@/components/sections/FeaturedPackage";
import ProcessTimeline from "@/components/sections/ProcessTimeline";
import PricingTable from "@/components/sections/PricingTable";
import CTABanner from "@/components/sections/CTABanner";
import StickyMobileBar from "@/components/shared/StickyMobileBar";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import SEO from "@/components/shared/SEO";
import { pageTransition } from "@/lib/motion";
import { homepageFAQSchema, organizationSchema, websiteSchema } from "@/lib/seo";

export default function Index() {
  return (
    <motion.div
      variants={pageTransition}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="min-h-screen flex flex-col"
    >
      <SEO
        title="KlawTax.online | India's Trusted NGO & Legal Registration Platform"
        description="Register your NGO, Section 8 company, get 12A, 80G, DARPAN, GST, ISO certifications — managed by CA/CS experts. Transparent flat fees. 500+ clients served across India."
        keywords="NGO registration India, Section 8 company, 12A registration, 80G registration, NGO DARPAN registration, GST registration, legal services India, NGO compliance experts"
        canonical="/"
        schema={[organizationSchema, websiteSchema, homepageFAQSchema]}
      />
      <Navbar />
      <main id="main-content" role="main" className="flex-1">

        {/* 1. Hero — primary hook */}
        <section aria-labelledby="hero-heading">
          <HeroSection />
        </section>

        {/* 2. Stats ticker — immediate social proof */}
        <StatsTicker />

        {/* 3. Trust ticker — credibility reinforcement */}
        <TrustTicker />

        {/* 4. How It Works — process clarity before service discovery */}
        <section aria-labelledby="process-heading">
          <ProcessTimeline />
        </section>

        {/* 5. Services grid — discovery */}
        <section aria-labelledby="services-heading">
          <ServicesGrid limit={12} />
        </section>

        {/* 6. Featured package — conversion push */}
        <FeaturedPackage />

        {/* 7. Pricing — commitment enabler */}
        <PricingTable />

        {/* 8. Testimonials — final trust */}
        <TestimonialsSection />

        {/* 9. CTA banner — last-chance conversion */}
        <CTABanner />

      </main>
      <Footer />
      <StickyMobileBar />
    </motion.div>
  );
}
