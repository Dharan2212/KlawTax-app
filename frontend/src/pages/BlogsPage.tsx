/**
 * BlogsPage — /blogs
 * Premium blog listing with category filter, featured article hero, and card grid.
 * Batch D — SEO Blog System
 */

import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem, pageTransition } from "@/lib/motion";
import {
  BLOG_POSTS,
  BLOG_CATEGORIES,
  type BlogCategory,
} from "@/lib/blog";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/shared/SEO";
import { Clock, ArrowRight, BookOpen, TrendingUp } from "lucide-react";
import { formatPublishedDate } from "@/lib/blog";

const ALL_CATS = Object.keys(BLOG_CATEGORIES) as BlogCategory[];

function CategoryPill({
  active,
  label,
  color,
  bg,
  border,
  onClick,
}: {
  active: boolean;
  label: string;
  color: string;
  bg: string;
  border: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 16px",
        borderRadius: "9999px",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "0.8125rem",
        fontWeight: active ? 600 : 500,
        cursor: "pointer",
        border: `1.5px solid ${active ? color : border}`,
        background: active ? bg : "transparent",
        color: active ? color : "#64748B",
        transition: "all 0.18s ease",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

function BlogCard({ post, featured = false }: { post: (typeof BLOG_POSTS)[0]; featured?: boolean }) {
  const cat = BLOG_CATEGORIES[post.category];

  if (featured) {
    return (
      <Link
        to={`/blogs/${post.slug}`}
        style={{ textDecoration: "none", display: "block" }}
      >
        <div
          className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
          style={{
            background: post.coverGradient,
            boxShadow: "0 8px 32px rgba(15,27,76,0.18)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {/* Gradient overlay for text legibility */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.82) 100%)",
            }}
          />

          <div className="relative z-10 p-7 sm:p-8 flex flex-col justify-end min-h-[300px] sm:min-h-[320px]">
            {/* Emoji + Category */}
            <div className="flex items-center gap-3 mb-4">
              <span
                style={{ fontSize: "2rem", lineHeight: 1 }}
                aria-hidden
              >
                {post.coverEmoji}
              </span>
              <span
                className="px-2.5 py-1 rounded-full text-white text-xs font-semibold"
                style={{
                  background: "rgba(255,255,255,0.16)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.20)",
                  fontFamily: "'DM Sans', sans-serif",
                  letterSpacing: "0.02em",
                }}
              >
                {cat.label}
              </span>
              <span
                className="ml-auto flex items-center gap-1 text-white/60 text-xs"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                <Clock size={11} strokeWidth={2} />
                {post.readingMinutes} min read
              </span>
            </div>

            <h2
              className="text-white mb-2 group-hover:text-[#FCD34D] transition-colors duration-200"
              style={{
                fontFamily: "'Sora', sans-serif",
                fontWeight: 700,
                fontSize: "clamp(1.1rem, 2.5vw, 1.4375rem)",
                letterSpacing: "-0.02em",
                lineHeight: 1.3,
              }}
            >
              {post.title}
            </h2>

            <p
              className="text-white/68 mb-5 line-clamp-2"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.875rem",
                lineHeight: 1.65,
                color: "rgba(255,255,255,0.68)",
              }}
            >
              {post.excerpt}
            </p>

            <div className="flex items-center justify-between">
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.75rem",
                  color: "rgba(255,255,255,0.48)",
                }}
              >
                {formatPublishedDate(post.publishedAt)}
              </span>
              <span
                className="flex items-center gap-1.5 text-[#FCD34D] font-semibold text-sm group-hover:gap-2.5 transition-all duration-200"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                Read Article
                <ArrowRight size={14} strokeWidth={2.5} />
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/blogs/${post.slug}`}
      style={{ textDecoration: "none", display: "block" }}
    >
      <div
        className="group h-full rounded-xl overflow-hidden border transition-all duration-250 hover:-translate-y-1 hover:shadow-lg"
        style={{
          background: "white",
          border: "1px solid rgba(203,213,225,0.60)",
          boxShadow: "0 2px 12px rgba(15,27,76,0.06)",
        }}
      >
        {/* Cover band */}
        <div
          className="h-2 w-full"
          style={{ background: post.coverGradient }}
        />

        <div className="p-5 sm:p-6 flex flex-col h-full">
          {/* Emoji + category row */}
          <div className="flex items-center gap-2 mb-3">
            <span style={{ fontSize: "1.25rem" }} aria-hidden>
              {post.coverEmoji}
            </span>
            <span
              className="px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{
                background: cat.bg,
                color: cat.color,
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: "0.02em",
              }}
            >
              {cat.label}
            </span>
          </div>

          <h3
            className="mb-2 group-hover:text-[#1E3A8A] transition-colors duration-150"
            style={{
              fontFamily: "'Sora', sans-serif",
              fontWeight: 600,
              fontSize: "0.9375rem",
              letterSpacing: "-0.01em",
              lineHeight: 1.4,
              color: "#0F1B4C",
            }}
          >
            {post.title}
          </h3>

          <p
            className="line-clamp-3 flex-1"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.8125rem",
              color: "#64748B",
              lineHeight: 1.65,
            }}
          >
            {post.excerpt}
          </p>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
            <span
              className="flex items-center gap-1"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.75rem",
                color: "#94A3B8",
              }}
            >
              <Clock size={11} strokeWidth={2} />
              {post.readingMinutes} min
            </span>
            <span
              className="flex items-center gap-1 font-medium text-xs group-hover:gap-2 transition-all duration-150"
              style={{ color: "#1E3A8A", fontFamily: "'DM Sans', sans-serif" }}
            >
              Read More <ArrowRight size={12} strokeWidth={2.5} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function BlogsPage() {
  const [activeCategory, setActiveCategory] = useState<BlogCategory | "all">("all");

  const filtered = useMemo(
    () =>
      activeCategory === "all"
        ? BLOG_POSTS
        : BLOG_POSTS.filter((p) => p.category === activeCategory),
    [activeCategory]
  );

  const featured = BLOG_POSTS.filter((p) => p.featured).slice(0, 2);
  const gridPosts = activeCategory === "all" ? BLOG_POSTS.filter((p) => !p.featured) : filtered;

  return (
    <motion.div
      variants={pageTransition}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="min-h-screen flex flex-col"
      style={{ background: "#F8FAFC" }}
    >
      <SEO
        title="Legal & NGO Guides — KlawTax Knowledge Hub"
        description="Expert guides on NGO registration, GST, company formation, compliance, and digital marketing in India. Written by CA and CS professionals."
        keywords="ngo registration guide india, section 8 company guide, 12a 80g registration, gst registration guide, company registration india, ngo compliance india"
        canonical="/blogs"
        ogTitle="KlawTax Knowledge Hub — India's Legal & NGO Resource Centre"
        ogDescription="In-depth guides on NGO registration, tax compliance, company formation, and digital growth — written by India's legal experts."
        ogType="website"
      />

      <Navbar />

      <main id="main-content" role="main" className="flex-1">

        {/* ── Page hero ── */}
        <section
          style={{
            background:
              "linear-gradient(140deg, #0F1B4C 0%, #1A2D6B 50%, #2E1065 100%)",
            padding: "80px 0 56px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: "-20%",
              right: "-5%",
              width: "420px",
              height: "420px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen size={15} strokeWidth={2} style={{ color: "#F59E0B" }} />
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#F59E0B",
                }}
              >
                Knowledge Hub
              </span>
            </div>
            <h1
              style={{
                fontFamily: "'Sora', sans-serif",
                fontWeight: 800,
                fontSize: "clamp(1.875rem, 4vw, 2.875rem)",
                letterSpacing: "-0.025em",
                color: "white",
                lineHeight: 1.15,
                marginBottom: "14px",
              }}
            >
              Legal & NGO Guides
              <br />
              <span
                style={{
                  background:
                    "linear-gradient(92deg, #F59E0B 0%, #FCD34D 55%, #FBBF24 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  fontWeight: 700,
                  fontSize: "0.82em",
                }}
              >
                Written by CA & CS Professionals
              </span>
            </h1>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "clamp(0.9rem, 1.3vw, 1rem)",
                color: "rgba(255,255,255,0.60)",
                lineHeight: 1.7,
                maxWidth: "500px",
              }}
            >
              In-depth, practical guides on NGO registration, company formation,
              tax compliance, and digital growth — for founders, NGO leaders, and
              compliance professionals.
            </p>
          </div>
        </section>

        {/* ── Category filter ── */}
        <div
          style={{
            background: "white",
            borderBottom: "1px solid rgba(203,213,225,0.50)",
            position: "sticky",
            top: 0,
            zIndex: 50,
          }}
        >
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
            <div
              className="flex items-center gap-2.5 py-3.5 overflow-x-auto"
              style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
            >
              <CategoryPill
                active={activeCategory === "all"}
                label="All Articles"
                color="#1E3A8A"
                bg="#DBEAFE"
                border="rgba(203,213,225,0.60)"
                onClick={() => setActiveCategory("all")}
              />
              {ALL_CATS.map((cat) => {
                const meta = BLOG_CATEGORIES[cat];
                return (
                  <CategoryPill
                    key={cat}
                    active={activeCategory === cat}
                    label={meta.label}
                    color={meta.color}
                    bg={meta.bg}
                    border={meta.border}
                    onClick={() => setActiveCategory(cat)}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-12 sm:py-14">

          {/* ── Featured row (all view only) ── */}
          {activeCategory === "all" && featured.length > 0 && (
            <motion.section
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className="mb-12"
            >
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp size={16} strokeWidth={2} style={{ color: "#F59E0B" }} />
                <h2
                  style={{
                    fontFamily: "'Sora', sans-serif",
                    fontWeight: 700,
                    fontSize: "1.0625rem",
                    color: "#0F1B4C",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Featured Guides
                </h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-5 sm:gap-6">
                {featured.map((post) => (
                  <motion.div key={post.slug} variants={staggerItem}>
                    <BlogCard post={post} featured />
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* ── All / filtered articles grid ── */}
          {gridPosts.length > 0 ? (
            <motion.section
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
            >
              {activeCategory === "all" && (
                <div className="flex items-center gap-2 mb-6">
                  <BookOpen size={16} strokeWidth={2} style={{ color: "#64748B" }} />
                  <h2
                    style={{
                      fontFamily: "'Sora', sans-serif",
                      fontWeight: 700,
                      fontSize: "1.0625rem",
                      color: "#0F1B4C",
                    }}
                  >
                    All Articles
                    <span
                      className="ml-2 text-sm font-normal"
                      style={{ color: "#94A3B8" }}
                    >
                      ({gridPosts.length})
                    </span>
                  </h2>
                </div>
              )}
              {activeCategory !== "all" && (
                <div className="mb-6">
                  <h2
                    style={{
                      fontFamily: "'Sora', sans-serif",
                      fontWeight: 700,
                      fontSize: "1.0625rem",
                      color: "#0F1B4C",
                    }}
                  >
                    {BLOG_CATEGORIES[activeCategory].label}
                    <span
                      className="ml-2 text-sm font-normal"
                      style={{ color: "#94A3B8" }}
                    >
                      ({filtered.length} articles)
                    </span>
                  </h2>
                  <p
                    className="mt-1"
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "0.875rem",
                      color: "#64748B",
                    }}
                  >
                    {BLOG_CATEGORIES[activeCategory].description}
                  </p>
                </div>
              )}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {(activeCategory === "all" ? gridPosts : filtered).map((post) => (
                  <motion.div key={post.slug} variants={staggerItem}>
                    <BlogCard post={post} />
                  </motion.div>
                ))}
              </div>
            </motion.section>
          ) : (
            <div
              className="text-center py-20"
              style={{ fontFamily: "'DM Sans', sans-serif", color: "#94A3B8" }}
            >
              No articles in this category yet.{" "}
              <button
                onClick={() => setActiveCategory("all")}
                style={{ color: "#1E3A8A", fontWeight: 600 }}
              >
                View all articles
              </button>
            </div>
          )}

          {/* ── CTA strip ── */}
          <div
            className="mt-16 rounded-2xl p-8 sm:p-10 text-center"
            style={{
              background:
                "linear-gradient(135deg, #0F1B4C 0%, #1A2D6B 50%, #2E1065 100%)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                color: "#F59E0B",
                marginBottom: "10px",
              }}
            >
              Ready to get started?
            </p>
            <h3
              style={{
                fontFamily: "'Sora', sans-serif",
                fontWeight: 700,
                fontSize: "clamp(1.2rem, 2.5vw, 1.625rem)",
                color: "white",
                letterSpacing: "-0.02em",
                marginBottom: "10px",
              }}
            >
              Let our experts handle your registration
            </h3>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.9375rem",
                color: "rgba(255,255,255,0.58)",
                marginBottom: "24px",
                maxWidth: "420px",
                margin: "0 auto 24px",
              }}
            >
              From NGO registration to GST filing — we manage every step so you can
              focus on your mission.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link
                to="/services"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-[#0F172A] hover:-translate-y-0.5 transition-transform duration-200"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.9375rem",
                  background: "linear-gradient(92deg, #D97706 0%, #F59E0B 100%)",
                  boxShadow: "0 4px 20px rgba(217,119,6,0.40)",
                  textDecoration: "none",
                }}
              >
                Explore Services <ArrowRight size={15} strokeWidth={2.5} />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white hover:bg-white/10 transition-colors duration-200"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.9375rem",
                  background: "rgba(255,255,255,0.08)",
                  border: "1.5px solid rgba(255,255,255,0.18)",
                  textDecoration: "none",
                }}
              >
                Free Consultation
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </motion.div>
  );
}
