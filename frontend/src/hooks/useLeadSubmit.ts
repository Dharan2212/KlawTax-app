// ============================================================
// useLeadSubmit — Reusable hook for submitting a lead to the backend
// Falls back gracefully if the backend is not reachable.
// ============================================================

import { useState, useCallback } from "react";
import { submitLead, type LeadPayload, getErrorMessage } from "@/lib/api";

interface UseLeadSubmitReturn {
  submit: (payload: LeadPayload) => Promise<boolean>;
  loading: boolean;
  success: boolean;
  error: string | null;
  reset: () => void;
}

/**
 * Hook for submitting a lead to POST /api/v1/leads.
 *
 * Usage:
 *   const { submit, loading, success, error } = useLeadSubmit();
 *   await submit({ name, phone, email, service, message });
 */
export function useLeadSubmit(): UseLeadSubmitReturn {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const submit = useCallback(async (payload: LeadPayload): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await submitLead(payload);
      setSuccess(true);
      return true;
    } catch (err) {
      const msg = getErrorMessage(err);
      // Network errors: treat as success — WhatsApp is the primary fallback channel
      const isNetwork = msg.toLowerCase().includes("fetch") || msg.toLowerCase().includes("network");
      if (isNetwork) {
        setSuccess(true);
        return true;
      }
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setSuccess(false);
    setError(null);
  }, []);

  return { submit, loading, success, error, reset };
}
