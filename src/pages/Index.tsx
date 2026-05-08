import { motion } from "framer-motion";
import { pageTransition } from "@/lib/motion";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import StickyMobileBar from "@/components/shared/StickyMobileBar";
import SEO from "@/components/shared/SEO";
import HeroSection from "@/components/sections/HeroSection";
import StatsBar from "@/components/sections/StatsBar";
import ServicesGrid from "@/components/sections/ServicesGrid";
import FeaturedPackage from "@/components/sections/FeaturedPackage";
import ProcessTimeline from "@/components/sections/ProcessTimeline";
import PricingTable from "@/components/sections/PricingTable";
import TestimonialsCarousel from "@/components/sections/TestimonialsCarousel";
import CTABanner from "@/components/sections/CTABanner";

export default function Index() {
  return (
    <motion.div variants={pageTransition} initial="hidden" animate="visible" exit="exit" className="min-h-screen">
      <SEO
        title="KlawTax.online | Premium Legal & NGO Services in India"
        description="Trusted legal, NGO, compliance, registration, audit, and digital services with transparent pricing and expert support."
        keywords="NGO registration, 12A, 80G, GST, Section 8 company, compliance, legal services"
        canonical="/"
      />
      <Navbar />
      <HeroSection />
      <StatsBar />
      <ServicesGrid />
      <FeaturedPackage />
      <ProcessTimeline />
      <PricingTable />
      <TestimonialsCarousel />
      <CTABanner />
      <Footer />
      <StickyMobileBar />
    </motion.div>
  );
}
