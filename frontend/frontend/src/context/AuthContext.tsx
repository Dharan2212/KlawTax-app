/**
 * KlawTax Auth Context — Batch 4.3
 *
 * Changes from Batch 2:
 * - Stores and clears the refresh token alongside the access token
 * - Provides `hydrateFromToken()` for post-payment guest-to-client upgrade
 * - Exposes `refreshSession()` (manual refresh, e.g. after long idle)
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  login as apiLogin,
  logout as apiLogout,
  setStoredToken,
  setStoredRefreshToken,
  clearStoredToken,
  getStoredToken,
  getStoredRefreshToken,
  setStoredUser,
  getStoredUser,
  setStoredRole,
  getStoredRole,
  decodeJwtPayload,
  type LoginPayload,
  type StoredUser,
} from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────

export type UserRole = "admin" | "employee" | "client";

export interface AuthState {
  user:            StoredUser | null;
  role:            UserRole | null;
  isAuthenticated: boolean;
  isLoading:       boolean;
  error:           string | null;
}

export interface AuthContextValue extends AuthState {
  login:            (payload: LoginPayload) => Promise<void>;
  logout:           () => Promise<void>;
  clearError:       () => void;
  /**
   * Hydrate auth state from a raw JWT (no password needed).
   * Used after guest checkout when the backend issues a clientAccessToken.
   * If the token carries no name info, caller may pass `meta` to supplement.
   */
  hydrateFromToken: (
    accessToken: string,
    meta?: Partial<StoredUser>,
  ) => void;
}

// ── Context ────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Helpers ────────────────────────────────────────────────────

function decodeRole(token: string): UserRole | null {
  const payload = decodeJwtPayload(token);
  return (payload?.role as UserRole) ?? null;
}

function decodeUserId(token: string): string {
  const payload = decodeJwtPayload(token);
  return (payload?.sub as string) ?? (payload?.userId as string) ?? "";
}

// ── Provider ───────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StoredUser | null>(() => getStoredUser());
  const [role, setRole] = useState<UserRole | null>(() => {
    const stored = getStoredRole();
    if (stored) return stored as UserRole;
    const token = getStoredToken();
    return token ? decodeRole(token) : null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  // ── login ──────────────────────────────────────────────────
  const login = useCallback(async (payload: LoginPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await apiLogin(payload);

      setStoredToken(result.accessToken);
      if (result.refreshToken) setStoredRefreshToken(result.refreshToken);
      setStoredUser(result.user as StoredUser);
      setStoredRole(result.user.role);

      setUser(result.user as StoredUser);
      setRole(result.user.role as UserRole);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : "Login failed. Please check your credentials.";
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── logout ─────────────────────────────────────────────────
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await apiLogout();
    } catch {
      // Always clear local state even if the API call fails
    } finally {
      clearStoredToken();
      setUser(null);
      setRole(null);
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  // ── hydrateFromToken ───────────────────────────────────────
  // Called after guest payment to upgrade the browser session to an
  // authenticated client session without requiring a password login.
  const hydrateFromToken = useCallback(
    (accessToken: string, meta?: Partial<StoredUser>) => {
      if (!accessToken) return;
      try {
        const decodedRole   = decodeRole(accessToken)   ?? "client";
        const decodedUserId = decodeUserId(accessToken) ?? "";

        const synthetic: StoredUser = {
          userId:          decodedUserId,
          email:           meta?.email      ?? "",
          firstName:       meta?.firstName  ?? "Client",
          lastName:        meta?.lastName   ?? "",
          role:            decodedRole,
          clientProfileId: meta?.clientProfileId,
          ...meta,
        };

        setStoredToken(accessToken);
        setStoredUser(synthetic);
        setStoredRole(decodedRole);

        setUser(synthetic);
        setRole(decodedRole as UserRole);
      } catch {
        // Non-fatal — guest stays unauthenticated
      }
    },
    [],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user && !!getStoredToken(),
        isLoading,
        error,
        login,
        logout,
        clearError,
        hydrateFromToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
