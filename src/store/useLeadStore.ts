import { create } from "zustand";

interface LeadState {
  name: string;
  phone: string;
  email: string;
  service: string;
  message: string;
  submitted: boolean;
  setField: (field: string, value: string) => void;
  submit: () => void;
  reset: () => void;
}

export const useLeadStore = create<LeadState>((set) => ({
  name: "",
  phone: "",
  email: "",
  service: "",
  message: "",
  submitted: false,
  setField: (field, value) => set({ [field]: value }),
  submit: () => set({ submitted: true }),
  reset: () => set({ name: "", phone: "", email: "", service: "", message: "", submitted: false }),
}));
