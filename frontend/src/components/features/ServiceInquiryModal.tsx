/**
 * ServiceInquiryModal
 *
 * A portal-rendered dialog that wraps InquiryForm.
 * Can be triggered from any page (pricing cards, CTA banners, etc.)
 *
 * Usage:
 *   const [open, setOpen] = useState(false);
 *   <ServiceInquiryModal open={open} onClose={() => setOpen(false)} serviceTitle="12A Registration" serviceSlug="12a-registration" />
 */

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import InquiryForm from "./InquiryForm";

export interface ServiceInquiryModalProps {
  open: boolean;
  onClose: () => void;
  serviceTitle?: string;
  serviceSlug?: string;
}

export default function ServiceInquiryModal({
  open,
  onClose,
  serviceTitle,
  serviceSlug,
}: ServiceInquiryModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          ref={overlayRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleOverlayClick}
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{
            background: "rgba(15,23,42,0.60)",
            backdropFilter: "blur(4px)",
            zIndex: 2000,
          }}
          role="dialog"
          aria-modal="true"
          aria-label={`Inquiry form${serviceTitle ? ` for ${serviceTitle}` : ""}`}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
            className="w-full max-w-md relative"
            style={{
              background: "white",
              borderRadius: "20px",
              boxShadow: "0 24px 64px rgba(15,27,76,0.22)",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-5"
              style={{
                background: "linear-gradient(135deg, #0F1B4C, #1E3A8A)",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div>
                <p
                  style={{
                    fontFamily: "'Sora', sans-serif",
                    fontWeight: 700,
                    fontSize: "1rem",
                    color: "white",
                  }}
                >
                  {serviceTitle ? `Enquire: ${serviceTitle}` : "Request a Callback"}
                </p>
                <p
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.8125rem",
                    color: "rgba(255,255,255,0.50)",
                    marginTop: "2px",
                  }}
                >
                  Free consultation — no commitment
                </p>
              </div>
              <button
                onClick={onClose}
                className="flex items-center justify-center w-8 h-8 rounded-full transition-all"
                style={{
                  background: "rgba(255,255,255,0.10)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  cursor: "pointer",
                }}
                aria-label="Close inquiry form"
              >
                <X size={14} strokeWidth={2.5} style={{ color: "white" }} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-6">
              <InquiryForm
                serviceTitle={serviceTitle}
                serviceSlug={serviceSlug}
                heading=""
                subheading="We'll call you back within 2 hours during business hours."
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
