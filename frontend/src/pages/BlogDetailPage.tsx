/**
 * BlogDetailPage — /blogs/:slug
 * Full article view with structured content, FAQ accordion, related services,
 * related articles, breadcrumbs, and complete JSON-LD schema injection.
 * Batch D — SEO Blog System
 */

import { useMemo, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { pageTransition } from "@/lib/motion";
import {
  getBlogBySlug,
  getRelatedBlogs,
  formatPublishedDate,
  buildBlogPostingSchema,
  buildBlogFAQSchema,
  buildBreadcrumbSchema,
  BLOG_CATEGORIES,
} from "@/lib/blog";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/shared/SEO";
import {
  ChevronDown,
  Clock,
  ArrowRight,
  Home,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

/* ─── Light markdown renderer ────────────────────────────────────────────── */

/**
 * Converts a small markdown subset to JSX spans for use inside article body text.
 * Supported: **bold**, _italic_, newlines (\n), and [link text](/path).
 * No external dependency required.
 */
function MarkdownText({ text }: { text: string }) {
  // Split into paragraphs by double newline, then process each line
  const paragraphs = text.split(/\n{2,}/);

  return (
    <>
      {paragraphs.map((para, pi) => {
        // Handle list items starting with "- "
        if (para.trim().startsWith("- ") || para.trim().startsWith("* ")) {
          const items = para
            .split("\n")
            .filter((l) => l.trim().startsWith("- ") || l.trim().startsWith("* "));
          return (
            <ul
              key={pi}
              style={{
                paddingLeft: "1.25em",
                marginBottom: "1rem",
                listStyleType: "disc",
              }}
            >
              {items.map((item, ii) => (
                <li
                  key={ii}
                  style={{
                    marginBottom: "0.35rem",
                    color: "#334155",
                    lineHeight: 1.7,
                  }}
                >
                  <InlineMarkdown text={item.replace(/^[-*]\s/, "")} />
                </li>
              ))}
            </ul>
          );
        }

        // Numbered list — lines like "1. foo"
        if (/^\d+\.\s/.test(para.trim())) {
          const items = para.split("\n").filter((l) => /^\d+\.\s/.test(l.trim()));
          return (
            <ol
              key={pi}
              style={{
                paddingLeft: "1.25em",
                marginBottom: "1rem",
                listStyleType: "decimal",
              }}
            >
              {items.map((item, ii) => (
                <li
                  key={ii}
                  style={{
                    marginBottom: "0.35rem",
                    color: "#334155",
                    lineHeight: 1.7,
                  }}
                >
                  <InlineMarkdown text={item.replace(/^\d+\.\s/, "")} />
                </li>
              ))}
            </ol>
          );
        }

        // Handle table — | col | col |
        if (para.includes("|") && para.includes("---")) {
          const rows = para.split("\n").filter((l) => l.trim() !== "");
          const header = rows[0]
            .split("|")
            .filter((c) => c.trim() !== "");
          const body = rows.slice(2).map((r) =>
            r.split("|").filter((c) => c.trim() !== "")
          );
          return (
            <div
              key={pi}
              className="overflow-x-auto mb-5"
              style={{ borderRadius: "10px", border: "1px solid #E2E8F0" }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#F1F5F9" }}>
                    {header.map((h, hi) => (
                      <th
                        key={hi}
                        style={{
                          padding: "10px 14px",
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          color: "#0F1B4C",
                          textAlign: "left",
                          borderBottom: "1px solid #E2E8F0",
                        }}
                      >
                        {h.trim()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {body.map((row, ri) => (
                    <tr
                      key={ri}
                      style={{ borderBottom: "1px solid #F1F5F9" }}
                    >
                      {row.map((cell, ci) => (
                        <td
                          key={ci}
                          style={{
                            padding: "9px 14px",
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: "0.8rem",
                            color: "#334155",
                            verticalAlign: "top",
                          }}
                        >
                          <InlineMarkdown text={cell.trim()} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        // Normal paragraph
        return (
          <p
            key={pi}
            style={{
              marginBottom: "1.1rem",
              color: "#334155",
              lineHeight: 1.78,
            }}
          >
            <InlineMarkdown text={para} />
          </p>
        );
      })}
    </>
  );
}

function InlineMarkdown({ text }: { text: string }) {
  // Process bold (**text**), italic (_text_), and [label](/path) links
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|_[^_]+_|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    const token = match[0];
    if (token.startsWith("**")) {
      parts.push(
        <strong
          key={match.index}
          style={{ fontWeight: 600, color: "#0F1B4C" }}
        >
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("_")) {
      parts.push(
        <em key={match.index} style={{ fontStyle: "italic" }}>
          {token.slice(1, -1)}
        </em>
      );
    } else {
      // Link pattern [label](/path)
      const inner = token.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (inner) {
        const isExternal = inner[2].startsWith("http");
        parts.push(
          isExternal ? (
            <a
              key={match.index}
              href={inner[2]}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#1E3A8A", textDecoration: "underline", textUnderlineOffset: "3px" }}
            >
              {inner[1]}
              <ExternalLink size={11} className="inline ml-0.5 opacity-60" />
            </a>
          ) : (
            <Link
              key={match.index}
              to={inner[2]}
              style={{ color: "#1E3A8A", textDecoration: "underline", textUnderlineOffset: "3px" }}
            >
              {inner[1]}
            </Link>
          )
        );
      }
    }
    last = match.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));

  return <>{parts}</>;
}

/* ─── FAQ accordion item ────────────────────────────────────────────────── */

function FAQItem({ q, a, defaultOpen = false }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      style={{
        borderBottom: "1px solid #E2E8F0",
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start justify-between gap-4 py-4 text-left"
        style={{ background: "none", border: "none", cursor: "pointer", padding: "16px 0" }}
        aria-expanded={open}
      >
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 600,
            fontSize: "0.9375rem",
            color: "#0F1B4C",
            lineHeight: 1.45,
          }}
        >
          {q}
        </span>
        <ChevronDown
          size={18}
          strokeWidth={2}
          style={{
            color: "#64748B",
            flexShrink: 0,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.22s ease",
            marginTop: "2px",
          }}
        />
      </button>
      <div
        style={{
          overflow: "hidden",
          maxHeight: open ? "480px" : "0",
          transition: "max-height 0.3s cubic-bezier(0,0,0.2,1)",
        }}
      >
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.9rem",
            color: "#475569",
            lineHeight: 1.72,
            paddingBottom: "16px",
          }}
        >
          {a}
        </p>
      </div>
    </div>
  );
}

/* ─── Main detail page ─────────────────────────────────────────────────── */

export default function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const post = useMemo(() => getBlogBySlug(slug ?? ""), [slug]);

  if (!post) return <Navigate to="/blogs" replace />;

  const related = getRelatedBlogs(post);
  const cat = BLOG_CATEGORIES[post.category];

  const schemas = [
    buildBlogPostingSchema(post),
    buildBlogFAQSchema(post),
    buildBreadcrumbSchema(post),
  ];

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
        title={post.metaTitle}
        description={post.metaDescription}
        keywords={post.keywords.join(", ")}
        canonical={post.canonicalPath}
        ogTitle={post.ogTitle}
        ogDescription={post.ogDescription}
        ogType="article"
        schema={schemas}
      />

      <Navbar />

      <main id="main-content" role="main" className="flex-1">

        {/* ── Cover hero ── */}
        <div
          style={{
            background: post.coverGradient,
            padding: "clamp(48px, 8vw, 72px) 0 clamp(32px, 5vw, 48px)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            aria-hidden
            style={{
              position: "absolute",
              bottom: "-30%",
              right: "-5%",
              width: "350px",
              height: "350px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
            {/* Breadcrumb */}
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 mb-6 flex-wrap"
            >
              {[
                { label: "Home", href: "/" },
                { label: "Blog", href: "/blogs" },
                { label: post.title, href: post.canonicalPath },
              ].map((crumb, i, arr) => (
                <span
                  key={crumb.href}
                  className="flex items-center gap-1.5"
                >
                  {i === arr.length - 1 ? (
                    <span
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: "0.75rem",
                        color: "rgba(255,255,255,0.50)",
                        maxWidth: "220px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        display: "inline-block",
                      }}
                    >
                      {crumb.label}
                    </span>
                  ) : (
                    <>
                      <Link
                        to={crumb.href}
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: "0.75rem",
                          color: "rgba(255,255,255,0.62)",
                          textDecoration: "none",
                        }}
                      >
                        {i === 0 ? <Home size={12} strokeWidth={2} className="inline" /> : crumb.label}
                      </Link>
                      <ChevronRight
                        size={11}
                        strokeWidth={2}
                        style={{ color: "rgba(255,255,255,0.32)", flexShrink: 0 }}
                      />
                    </>
                  )}
                </span>
              ))}
            </nav>

            {/* Category + reading time */}
            <div className="flex items-center gap-3 flex-wrap mb-4">
              <span
                className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  color: "white",
                  fontFamily: "'DM Sans', sans-serif",
                  border: "1px solid rgba(255,255,255,0.20)",
                  backdropFilter: "blur(6px)",
                }}
              >
                {cat.label}
              </span>
              <span
                className="flex items-center gap-1.5"
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.8125rem",
                  color: "rgba(255,255,255,0.58)",
                }}
              >
                <Clock size={13} strokeWidth={2} />
                {post.readingMinutes} min read
              </span>
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.8125rem",
                  color: "rgba(255,255,255,0.42)",
                }}
              >
                {formatPublishedDate(post.publishedAt)}
              </span>
            </div>

            {/* Title */}
            <h1
              style={{
                fontFamily: "'Sora', sans-serif",
                fontWeight: 800,
                fontSize: "clamp(1.5rem, 3.5vw, 2.375rem)",
                letterSpacing: "-0.025em",
                color: "white",
                lineHeight: 1.2,
                maxWidth: "740px",
              }}
            >
              {post.title}
            </h1>
          </div>
        </div>

        {/* ── Two-column layout ── */}
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="grid lg:grid-cols-[1fr_296px] xl:grid-cols-[1fr_320px] gap-10 xl:gap-12 items-start">

            {/* ── Main article ── */}
            <article>
              {/* Intro */}
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "clamp(0.95rem, 1.2vw, 1.0625rem)",
                  color: "#1E293B",
                  lineHeight: 1.82,
                  marginBottom: "2rem",
                  fontWeight: 400,
                  padding: "20px 22px",
                  borderLeft: "3px solid #1E3A8A",
                  background: "#EFF6FF",
                  borderRadius: "0 8px 8px 0",
                }}
              >
                {post.intro}
              </p>

              {/* Sections */}
              <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {post.sections.map((section, i) => (
                  <section key={i} className="mb-8">
                    <h2
                      style={{
                        fontFamily: "'Sora', sans-serif",
                        fontWeight: 700,
                        fontSize: "clamp(1.0625rem, 1.8vw, 1.25rem)",
                        color: "#0F1B4C",
                        letterSpacing: "-0.015em",
                        lineHeight: 1.35,
                        marginBottom: "14px",
                        paddingBottom: "10px",
                        borderBottom: "2px solid #F1F5F9",
                      }}
                    >
                      {section.heading}
                    </h2>
                    <div
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: "0.9375rem",
                        lineHeight: 1.78,
                      }}
                    >
                      <MarkdownText text={section.body} />
                    </div>
                  </section>
                ))}
              </div>

              {/* FAQ section */}
              {post.faqs.length > 0 && (
                <section className="mt-10">
                  <h2
                    style={{
                      fontFamily: "'Sora', sans-serif",
                      fontWeight: 700,
                      fontSize: "clamp(1.0625rem, 1.8vw, 1.25rem)",
                      color: "#0F1B4C",
                      letterSpacing: "-0.015em",
                      marginBottom: "20px",
                    }}
                  >
                    Frequently Asked Questions
                  </h2>
                  <div
                    style={{
                      background: "white",
                      borderRadius: "14px",
                      border: "1px solid #E2E8F0",
                      padding: "4px 20px",
                      boxShadow: "0 2px 10px rgba(15,27,76,0.05)",
                    }}
                  >
                    {post.faqs.map((faq, i) => (
                      <FAQItem
                        key={i}
                        q={faq.question}
                        a={faq.answer}
                        defaultOpen={i === 0}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Related articles */}
              {related.length > 0 && (
                <section className="mt-12">
                  <h2
                    style={{
                      fontFamily: "'Sora', sans-serif",
                      fontWeight: 700,
                      fontSize: "1.0625rem",
                      color: "#0F1B4C",
                      marginBottom: "16px",
                    }}
                  >
                    Related Articles
                  </h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {related.map((rPost) => {
                      const rCat = BLOG_CATEGORIES[rPost.category];
                      return (
                        <Link
                          key={rPost.slug}
                          to={`/blogs/${rPost.slug}`}
                          style={{ textDecoration: "none" }}
                        >
                          <div
                            className="group rounded-xl overflow-hidden border hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                            style={{
                              background: "white",
                              border: "1px solid #E2E8F0",
                            }}
                          >
                            <div
                              className="h-1.5 w-full"
                              style={{ background: rPost.coverGradient }}
                            />
                            <div className="p-4">
                              <span
                                className="text-xs font-semibold px-2 py-0.5 rounded-full mb-2 inline-block"
                                style={{
                                  background: rCat.bg,
                                  color: rCat.color,
                                  fontFamily: "'DM Sans', sans-serif",
                                }}
                              >
                                {rCat.label}
                              </span>
                              <p
                                className="group-hover:text-[#1E3A8A] transition-colors"
                                style={{
                                  fontFamily: "'Sora', sans-serif",
                                  fontWeight: 600,
                                  fontSize: "0.8125rem",
                                  color: "#0F1B4C",
                                  lineHeight: 1.45,
                                }}
                              >
                                {rPost.title}
                              </p>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              )}
            </article>

            {/* ── Sticky sidebar ── */}
            <aside
              className="lg:sticky"
              style={{ top: "88px" }}
            >
              {/* Related services card */}
              {post.relatedServices.length > 0 && (
                <div
                  className="rounded-2xl overflow-hidden mb-5"
                  style={{
                    background: "white",
                    border: "1px solid #E2E8F0",
                    boxShadow: "0 4px 16px rgba(15,27,76,0.07)",
                  }}
                >
                  <div
                    className="px-5 py-4"
                    style={{
                      background:
                        "linear-gradient(90deg, rgba(30,58,138,0.06) 0%, rgba(76,29,149,0.04) 100%)",
                      borderBottom: "1px solid #F1F5F9",
                    }}
                  >
                    <h3
                      style={{
                        fontFamily: "'Sora', sans-serif",
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        color: "#0F1B4C",
                      }}
                    >
                      Related Services
                    </h3>
                    <p
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: "0.75rem",
                        color: "#64748B",
                        marginTop: "2px",
                      }}
                    >
                      Let our experts handle the filing
                    </p>
                  </div>
                  <div className="p-4 flex flex-col gap-2">
                    {post.relatedServices.map((s) => (
                      <Link
                        key={s.href}
                        to={s.href}
                        className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl group hover:bg-[#EFF6FF] transition-colors duration-150"
                        style={{
                          textDecoration: "none",
                          border: "1px solid #F1F5F9",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor = "rgba(30,58,138,0.20)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.borderColor = "#F1F5F9";
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: "0.8125rem",
                            fontWeight: 500,
                            color: "#1E3A8A",
                            lineHeight: 1.3,
                          }}
                        >
                          {s.label}
                        </span>
                        <ArrowRight
                          size={13}
                          strokeWidth={2.5}
                          style={{
                            color: "#93C5FD",
                            flexShrink: 0,
                            transform: "translateX(0)",
                            transition: "transform 0.15s ease",
                          }}
                          className="group-hover:translate-x-0.5"
                        />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Free consultation card */}
              <div
                className="rounded-2xl p-5 text-center"
                style={{
                  background:
                    "linear-gradient(145deg, #0F1B4C 0%, #1A2D6B 60%, #2E1065 100%)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <span style={{ fontSize: "2rem" }} aria-hidden>
                  🎯
                </span>
                <h3
                  style={{
                    fontFamily: "'Sora', sans-serif",
                    fontWeight: 700,
                    fontSize: "0.9375rem",
                    color: "white",
                    marginTop: "8px",
                    marginBottom: "6px",
                  }}
                >
                  Need expert help?
                </h3>
                <p
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.8125rem",
                    color: "rgba(255,255,255,0.55)",
                    marginBottom: "14px",
                    lineHeight: 1.6,
                  }}
                >
                  Our CA &amp; CS team can handle your registration end-to-end — fast and affordable.
                </p>
                <Link
                  to="/contact"
                  className="block w-full text-center rounded-xl font-semibold py-2.5 transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.875rem",
                    color: "#0F172A",
                    background: "linear-gradient(90deg, #D97706 0%, #F59E0B 100%)",
                    boxShadow: "0 4px 16px rgba(217,119,6,0.35)",
                    textDecoration: "none",
                  }}
                >
                  Free Consultation
                </Link>
                <Link
                  to="/blogs"
                  className="block w-full text-center mt-2 py-2 rounded-xl transition-colors duration-150 hover:bg-white/10"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.8125rem",
                    color: "rgba(255,255,255,0.45)",
                    textDecoration: "none",
                  }}
                >
                  ← Back to all articles
                </Link>
              </div>

              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="mt-5">
                  <p
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                      letterSpacing: "0.09em",
                      textTransform: "uppercase",
                      color: "#94A3B8",
                      marginBottom: "10px",
                    }}
                  >
                    Tags
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-full text-xs"
                        style={{
                          background: "#F1F5F9",
                          color: "#475569",
                          fontFamily: "'DM Sans', sans-serif",
                          fontWeight: 500,
                          border: "1px solid #E2E8F0",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </motion.div>
  );
}
