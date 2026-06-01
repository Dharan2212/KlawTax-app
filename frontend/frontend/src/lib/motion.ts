import { Variants } from "framer-motion";
import { useState, useEffect } from "react";

const easeSpring = [0.34, 1.56, 0.64, 1] as const;
const easeOut    = [0, 0, 0.2, 1]        as const;

export const fadeIn: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease: easeOut } },
  exit:    { opacity: 0, transition: { duration: 0.25 } },
};

export const fadeInUp: Variants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOut } },
};

export const fadeInDown: Variants = {
  hidden:  { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: easeOut } },
  exit:    { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

export const scaleIn: Variants = {
  hidden:  { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: easeSpring } },
};

export const slideInLeft: Variants = {
  hidden:  { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: easeOut } },
};

export const slideInRight: Variants = {
  hidden:  { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: easeOut } },
};

export const slideInFromRight = slideInRight;
export const slideInFromLeft  = slideInLeft;

export const slideStep: Variants = {
  hidden:  { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0,  transition: { duration: 0.4, ease: easeOut } },
  exit:    { opacity: 0, x: 20, transition: { duration: 0.3 } },
};

export const staggerContainer: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

export const staggerItem: Variants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOut } },
};

export const pageTransition: Variants = {
  hidden:  { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0,   transition: { duration: 0.4, ease: easeOut } },
  exit:    { opacity: 0, y: -10, transition: { duration: 0.3 } },
};

export const shake: Variants = {
  hidden:  { x: 0 },
  visible: { x: 0 },
  error:   { x: [-10, 10, -10, 10, -5, 5, 0], transition: { duration: 0.4 } },
};

export const checkmarkAnim = {
  hidden:  { pathLength: 0, opacity: 0 },
  visible: { pathLength: 1, opacity: 1, transition: { duration: 0.5, ease: easeOut } },
};

export const heightCollapse: Variants = {
  hidden:  { scaleY: 0, overflow: "hidden" },
  visible: { scaleY: 1, transition: { duration: 0.3, ease: easeOut } },
};

export const springTransition = { type: "spring" as const, stiffness: 300, damping: 20 };

export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check, { passive: true });
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return isMobile;
}
