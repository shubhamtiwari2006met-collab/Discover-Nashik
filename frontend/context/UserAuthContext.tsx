"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface AppUser {
  id: string;
  platformId?: string | null;
  email: string | null;
  mobile: string | null;
  name: string | null;
  emailVerified?: boolean;
  mobileVerified?: boolean;
  authProvider?: string;
  createdAt?: string;
  lastLoginAt?: string;
}

interface UserAuthContextType {
  user: AppUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  login: (identifier: string, password?: string) => Promise<{ success: boolean; message?: string; user?: AppUser }>;
  register: (data: { email?: string; mobile?: string; password?: string; name?: string }) => Promise<{ success: boolean; message?: string; user?: AppUser }>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined);

// Helper function to safely parse JSON response and prevent HTML parsing crashes
async function parseJsonResponse(res: Response) {
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return {
      success: false,
      message: `Server returned non-JSON response (${res.status}). Please restart your backend server.`,
    };
  }
  try {
    return await res.json();
  } catch (err) {
    return {
      success: false,
      message: "Failed to parse response from server.",
    };
  }
}

export function UserAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  const refetchUser = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/me", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (res.ok) {
        const data = await parseJsonResponse(res);
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Error fetching current user:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refetchUser();
  }, []);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const login = async (identifier: string, password?: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ identifier, password }),
      });
      const data = await parseJsonResponse(res);
      if (res.ok && data.success) {
        setUser(data.user);
        closeAuthModal();
        return { success: true, message: data.message || "Logged in successfully", user: data.user };
      }
      return { success: false, message: data.message || `Login failed (${res.status})` };
    } catch (err: any) {
      return { success: false, message: err?.message || "Failed to log in" };
    }
  };

  const register = async (reqData: { email?: string; mobile?: string; password?: string; name?: string }) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(reqData),
      });
      const data = await parseJsonResponse(res);
      if (res.ok && data.success) {
        setUser(data.user);
        return { success: true, message: data.message || "Registered successfully", user: data.user };
      }
      return { success: false, message: data.message || `Registration failed (${res.status})` };
    } catch (err: any) {
      return { success: false, message: err?.message || "Failed to register" };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
    }
  };

  return (
    <UserAuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        logout,
        refetchUser,
      }}
    >
      {children}
    </UserAuthContext.Provider>
  );
}

export function useUserAuth() {
  const context = useContext(UserAuthContext);
  if (!context) {
    throw new Error("useUserAuth must be used within a UserAuthProvider");
  }
  return context;
}
