import { create } from "zustand";

interface Order {
  id: string;
  service: string;
  status: "payment_confirmed" | "documents_received" | "processing" | "filed" | "completed";
  date: string;
  amount: number;
  paidAmount: number;
  pendingAmount: number;
}

interface Update {
  id: string;
  orderId: string;
  message: string;
  date: string;
}

interface DashboardState {
  orders: Order[];
  updates: Update[];
  activeSection: string;
  setActiveSection: (s: string) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  orders: [
    { id: "KT-ABC123", service: "Section 8 NGO Complete Package", status: "processing", date: "2026-04-28", amount: 13500, paidAmount: 6750, pendingAmount: 6750 },
    { id: "KT-DEF456", service: "12A + 80G Registration", status: "documents_received", date: "2026-05-01", amount: 3000, paidAmount: 3000, pendingAmount: 0 },
  ],
  updates: [
    { id: "u1", orderId: "KT-ABC123", message: "Documents verified successfully", date: "2026-05-02" },
    { id: "u2", orderId: "KT-ABC123", message: "Application submitted to MCA", date: "2026-05-03" },
    { id: "u3", orderId: "KT-DEF456", message: "Documents received and under review", date: "2026-05-01" },
  ],
  activeSection: "orders",
  setActiveSection: (s) => set({ activeSection: s }),
}));
