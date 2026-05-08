export interface PricingPlan {
  id: string;
  name: string;
  category: "ngo" | "business" | "compliance";
  price: number;
  originalPrice?: number;
  features: string[];
  popular?: boolean;
  slug: string;
}

export const featuredPackage = {
  name: "Complete NGO Starter Package",
  description: "Everything you need to start and run your NGO legally in India",
  price: 29999,
  originalPrice: 54999,
  savings: 25000,
  features: [
    "Section 8 Company Registration",
    "12A & 80G Registration",
    "GST Registration",
    "PAN & TAN",
    "Bank Account Setup",
    "Compliance Calendar",
    "Dedicated Manager",
    "1 Year Free Advisory",
  ],
};

export const pricingPlans: PricingPlan[] = [
  { id: "p1", name: "Trust Registration", category: "ngo", price: 9999, originalPrice: 14999, features: ["Trust Deed", "Registration", "PAN", "Bank Help"], slug: "trust-registration" },
  { id: "p2", name: "Society Registration", category: "ngo", price: 11999, originalPrice: 17999, features: ["MOA", "Registration", "PAN", "Bank Help"], slug: "society-registration" },
  { id: "p3", name: "Section 8 Company", category: "ngo", price: 14999, originalPrice: 24999, features: ["DSC", "DIN", "Incorporation", "PAN & TAN", "GST"], popular: true, slug: "section-8-company" },
  { id: "p4", name: "12A & 80G", category: "compliance", price: 7999, originalPrice: 12999, features: ["12A Filing", "80G Filing", "Follow-up", "Certificate"], slug: "12a-80g-registration" },
  { id: "p5", name: "GST Registration", category: "business", price: 2999, originalPrice: 4999, features: ["Application", "GSTIN", "Certificate"], slug: "gst-registration" },
  { id: "p6", name: "Pvt Ltd Company", category: "business", price: 12999, originalPrice: 19999, features: ["DSC & DIN", "SPICe+", "PAN & TAN", "GST"], slug: "private-limited-company" },
];

export const comparisonData = {
  features: [
    "Company Registration",
    "12A Registration",
    "80G Registration",
    "GST Registration",
    "PAN & TAN",
    "Bank Account Help",
    "Compliance Calendar",
    "Dedicated Manager",
  ],
  plans: [
    { name: "Section 8 Only", price: 14999, availability: [true, false, false, false, true, true, false, false] },
    { name: "Complete Package", price: 29999, availability: [true, true, true, true, true, true, true, true] },
  ],
};
