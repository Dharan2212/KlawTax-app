import { create } from "zustand";

interface CheckoutState {
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  paymentType: "full" | "advance";
  userName: string;
  userEmail: string;
  userPhone: string;
  userCity: string;
  currentStep: number;
  isComplete: boolean;
  orderId: string;
  setService: (id: string, name: string, price: number) => void;
  setPaymentType: (type: "full" | "advance") => void;
  setUserDetails: (details: { name: string; email: string; phone: string; city: string }) => void;
  setStep: (step: number) => void;
  /**
   * Mark checkout as complete.
   * @param backendOrderId  Order ID returned by the backend verify endpoint.
   *                        Falls back to a locally-generated ID if absent.
   */
  completeCheckout: (backendOrderId?: string) => void;
  reset: () => void;
}

export const useCheckoutStore = create<CheckoutState>((set) => ({
  serviceId: "",
  serviceName: "",
  servicePrice: 0,
  paymentType: "full",
  userName: "",
  userEmail: "",
  userPhone: "",
  userCity: "",
  currentStep: 0,
  isComplete: false,
  orderId: "",
  setService: (id, name, price) => set({ serviceId: id, serviceName: name, servicePrice: price }),
  setPaymentType: (type) => set({ paymentType: type }),
  setUserDetails: (d) =>
    set({ userName: d.name, userEmail: d.email, userPhone: d.phone, userCity: d.city }),
  setStep: (step) => set({ currentStep: step }),
  completeCheckout: (backendOrderId?: string) =>
    set({
      isComplete: true,
      orderId: backendOrderId ?? `KT-${Date.now().toString(36).toUpperCase()}`,
    }),
  reset: () =>
    set({
      serviceId: "",
      serviceName: "",
      servicePrice: 0,
      paymentType: "full",
      userName: "",
      userEmail: "",
      userPhone: "",
      userCity: "",
      currentStep: 0,
      isComplete: false,
      orderId: "",
    }),
}));
