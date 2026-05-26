"use client";

import { createContext, useCallback, useState, useContext, type ReactNode } from "react";
import { saveAuth, clearAuth } from "../lib/auth";

interface AuthContextValue {
  email: string | null;
  token: string | null;
  sub_id: number | null;
  bill: number | null;
  max_profiles: number | null;
  num_profiles: number | null;
  ptbd: number | null;
  profile: string | null;
  isLoggedIn: boolean;
  login: (email: string, token: string) => void;
  logout: () => void;
  set_sub_id: (id: number) => void;
  set_bill: (b: number) => void;
  set_max_profiles: (mp: number) => void;
  set_num_profiles: (np: number) => void;
  set_ptbd: (d: number) => void;
  set_profile: (id: string | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [sub_id, set_Sub_Id] = useState<number | null>(null);
  const [bill, set_Bill] = useState<number | null>(null);
  const [max_profiles, set_MaxProfiles] = useState<number | null>(null);
  const [num_profiles, set_NumProfiles] = useState<number | null>(null);
  const [ptbd, set_PTBD] = useState<number | null>(null);
  const [profile, setProfile] = useState<string | null>(null);

  const login = useCallback((email: string, token: string) => {
    setEmail(email);
    setToken(token);
    saveAuth({ email, token });
  }, []);

  const logout = useCallback(() => {
    setEmail(null);
    setToken(null);
    setProfile(null);
    clearAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        email,
        token,
        sub_id,
        bill,
        max_profiles,
        num_profiles,
        ptbd,
        profile,
        isLoggedIn: !!token,
        login,
        logout,
        set_sub_id: set_Sub_Id,
        set_bill: set_Bill,
        set_max_profiles: set_MaxProfiles,
        set_num_profiles: set_NumProfiles,
        set_ptbd: set_PTBD,
        set_profile: setProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
