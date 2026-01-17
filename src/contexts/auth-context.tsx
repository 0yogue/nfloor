"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { SessionUser, Feature } from "@/types/rbac";
import { FeatureGate } from "@/lib/rbac/features.client";

interface AuthContextType {
  user: SessionUser | null;
  is_loading: boolean;
  is_authenticated: boolean;
  feature_gate: FeatureGate | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh_user: () => Promise<void>;
  has_feature: (feature: Feature) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, set_user] = useState<SessionUser | null>(null);
  const [is_loading, set_is_loading] = useState(true);
  const [feature_gate, set_feature_gate] = useState<FeatureGate | null>(null);
  const router = useRouter();
  const has_checked = useRef(false);

  const refresh_user = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          set_user(data.user);
          set_feature_gate(new FeatureGate(data.user.license_type));
        } else {
          set_user(null);
          set_feature_gate(null);
        }
      } else {
        set_user(null);
        set_feature_gate(null);
      }
    } catch {
      set_user(null);
      set_feature_gate(null);
    } finally {
      set_is_loading(false);
    }
  }, []);

  useEffect(() => {
    if (has_checked.current) return;
    has_checked.current = true;
    refresh_user();
  }, [refresh_user]);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        await refresh_user();
        router.push("/dashboard");
        return { success: true };
      }

      return { success: false, error: data.error };
    } catch {
      return { success: false, error: "Erro de conexão" };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      set_user(null);
      set_feature_gate(null);
      router.push("/login");
    }
  };

  const has_feature = (feature: Feature): boolean => {
    return feature_gate?.has(feature) ?? false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        is_loading,
        is_authenticated: !!user,
        feature_gate,
        login,
        logout,
        refresh_user,
        has_feature,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
