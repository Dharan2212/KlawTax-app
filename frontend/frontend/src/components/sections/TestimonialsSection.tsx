import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { staggerContainer, staggerItem } from "@/lib/motion";

const testimonials = [
  {
    id: 1,
    name: "Ramesh Kumar",
    role: "Founder",
    org: "HopeForAll NGO",
    city: "Mumbai, Maharashtra",
    rating: 5,
    text: "KlawTax registered our Section 8 NGO in just 3 weeks. The process was completely transparent and the team was responsive throughout.",
    initials: "RK",
  },
  {
    id: 2,
    name: "Priya Sharma",
    role: "Secretary",
    org: "GreenEarth Foundation",
    city: "Delhi",
    rating: 5,
    text: "Got our 12A and 80G done together at an excellent price. Very professional team. Our donors are now claiming tax deductions with zero issues.",
    initials: "PS",
  },
  {
    id: 3,
    name: "Anwar Khan",
    role: "Director",
    org: "Rural Upliftment Society",
    city: "Hyderabad, Telangana",
    rating: 5,
    text: "The complete NGO package was a great deal. All 7 services handled without any hassle. Got DARPAN ID within 7 days of document submission.",
    initials: "AK",
  },
  {
    id: 4,
    name: "Sunita Patel",
    role: "CEO",
    org: "ChildFirst India",
    city: "Ahmedabad, Gujarat",
    rating: 5,
    text: "Excellent service! WhatsApp support was very helpful. Our CSR registration was done quickly and we received our first CSR grant within months.",
    initials: "SP",
  },
  {
    id: 5,
    name: "Mohammed Rashid",
    role: "Treasurer",
    org: "Urban Welfare Trust",
    city: "Pune, Maharashtra",
    rating: 5,
    text: "KlawTax handled our annual audit, UDIN, and balance sheet preparation. Very thorough and the CA team was knowledgeable about NGO compliance.",
    initials: "MR",
  },
  {
    id: 6,
    name: "Kavitha Nair",
    role: "Founder",
    org: "TechForGood Society",
    city: "Bengaluru, Karnataka",
    rating: 5,
    text: "Our ISO certification was done at half the cost compared to other consultants. KlawTax team really knows what they're doing.",
    initials: "KN",
  },
];

function TestimonialCard({ testimonial }: { testimonial: typeof testimonials[0] }) {
  return (
    <div
      className="flex-shrink-0 w-[340px] md:w-[380px] flex flex-col rounded-2xl p-6"
      style={{
        background: "white",
        border: "1px solid #E8EDF3",
        boxShadow: "0 4px 24px rgba(15,27,76,0.07)",
      }}
    >
      {/* Rating stars */}
      <div className="flex items-center gap-0.5 mb-4">
        {Array.from({ length: testimonial.rating }).map((_, i) => (
          <Star key={i} size={14} fill="#F59E0B" style={{ color: "#F59E0B" }} />
        ))}
      </div>

      {/* Quote */}
      <div className="relative flex-1 mb-5">
        <Quote
          size={28}
          className="absolute -top-1 -left-1 opacity-10"
          style={{ color: "#1E3A8A" }}
        />
        <p
          className="pl-5 leading-relaxed"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.9rem",
            color: "#334155",
            lineHeight: 1.7,
          }}
        >
          {testimonial.text}
        </p>
      </div>

      {/* Author */}
      <div className="flex items-center gap-3 pt-4" style={{ borderTop: "1px solid #F1F5F9" }}>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, #1E3A8A, #7C3AED)",
            color: "white",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {testimonial.initials}
        </div>
        <div>
          <div
            className="font-semibold leading-none mb-0.5"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.875rem",
              color: "#0F1B4C",
              fontWeight: 600,
            }}
          >
            {testimonial.name}
          </div>
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.75rem",
              color: "#94A3B8",
            }}
          >
            {testimonial.role} · {testimonial.org}
          </div>
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.6875rem",
              color: "#CBD5E1",
              marginTop: "1px",
            }}
          >
            {testimonial.city}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const autoRef = useRef<ReturnType<typeof setInterval>>();

  const itemWidth = 400;
  const visibleCount = Math.min(3, testimonials.length);
  const maxIndex = testimonials.length - visibleCount;

  const scrollTo = (index: number) => {
    const clamped = Math.max(0, Math.min(index, maxIndex));
    setCurrentIndex(clamped);
  };

  // Auto-advance
  useEffect(() => {
    autoRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(autoRef.current);
  }, [maxIndex]);

  return (
    <section className="py-16 md:py-24" style={{ background: "white" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="text-center mb-12"
        >
          <motion.div variants={staggerItem} className="flex justify-center mb-4">
            <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full" style={{ background: "rgba(245,158,11,0.10)", border: "1px solid rgba(245,158,11,0.20)" }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={12} fill="#F59E0B" style={{ color: "#F59E0B" }} />
              ))}
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", fontWeight: 600, color: "#D97706", marginLeft: "4px" }}>
                4.9 / 5 — Google Rating
              </span>
            </div>
          </motion.div>

          <motion.h2
            variants={staggerItem}
            style={{
              fontFamily: "'Sora', sans-serif",
              fontWeight: 700,
              fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
              letterSpacing: "-0.015em",
              color: "#1A2D6B",
            }}
            className="mb-3"
          >
            Trusted by NGOs &{" "}
            <span style={{ background: "linear-gradient(135deg, #1E3A8A, #7C3AED)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Businesses Across India
            </span>
          </motion.h2>

          <motion.p
            variants={staggerItem}
            style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "1.0625rem", color: "#64748B", lineHeight: 1.7 }}
          >
            500+ satisfied clients who trust KlawTax for their legal and compliance needs.
          </motion.p>
        </motion.div>

        {/* Carousel */}
        <div className="relative overflow-hidden">
          <div
            ref={trackRef}
            className="flex gap-5 transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentIndex * (itemWidth + 20)}px)` }}
          >
            {testimonials.map((t) => (
              <TestimonialCard key={t.id} testimonial={t} />
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={() => { scrollTo(currentIndex - 1); clearInterval(autoRef.current); }}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200"
            style={{
              background: currentIndex === 0 ? "#F1F5F9" : "#EFF6FF",
              color: currentIndex === 0 ? "#CBD5E1" : "#1E3A8A",
              border: "1px solid",
              borderColor: currentIndex === 0 ? "#E2E8F0" : "#BFDBFE",
            }}
            disabled={currentIndex === 0}
          >
            <ChevronLeft size={16} strokeWidth={2.5} />
          </button>

          {/* Dots */}
          <div className="flex items-center gap-2">
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={() => { scrollTo(i); clearInterval(autoRef.current); }}
                className="rounded-full transition-all duration-200"
                style={{
                  width: i === currentIndex ? "20px" : "6px",
                  height: "6px",
                  background: i === currentIndex ? "#1E3A8A" : "#CBD5E1",
                }}
              />
            ))}
          </div>

          <button
            onClick={() => { scrollTo(currentIndex + 1); clearInterval(autoRef.current); }}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200"
            style={{
              background: currentIndex >= maxIndex ? "#F1F5F9" : "#EFF6FF",
              color: currentIndex >= maxIndex ? "#CBD5E1" : "#1E3A8A",
              border: "1px solid",
              borderColor: currentIndex >= maxIndex ? "#E2E8F0" : "#BFDBFE",
            }}
            disabled={currentIndex >= maxIndex}
          >
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </section>
  );
}
