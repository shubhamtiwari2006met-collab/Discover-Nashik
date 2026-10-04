"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Lock, Loader2, KeyRound } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkExistingAdminSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const res = await fetch("/api/admin/verify", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
          });

          if (res.ok) {
            const data = await res.json().catch(() => null);
            if (data?.user?.role === "admin" && data?.user?.adminStatus === "active") {
              router.replace("/admin/dashboard");
              return;
            }
          }
        }
      } catch (err) {
        console.warn("[Admin Login] Session verify error:", err);
      } finally {
        setVerifying(false);
      }
    }

    void checkExistingAdminSession();
  }, [router, supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const cleanId = adminId.trim();
      if (!cleanId || !password) {
        throw new Error("Please enter both your Admin ID and password.");
      }

      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: cleanId, password }),
      });

      const data = await res.json().catch(() => ({
        success: false,
        message: "Invalid Admin ID or password.",
      }));

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Invalid Admin ID or password.");
      }

      // Sync Supabase Auth session in browser client if session returned
      if (data.session?.access_token && data.session?.refresh_token) {
        const { error: sessionErr } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });

        if (sessionErr) {
          console.warn("[Admin Login] setSession warning:", sessionErr.message);
        }
      }

      // Navigate to existing Admin Dashboard
      await new Promise((resolve) => setTimeout(resolve, 100));
      window.location.href = "/admin/dashboard";
    } catch (err: any) {
      console.error("[Admin Login] Authentication error:", err);
      setError(err.message || "Invalid Admin ID or password.");
    } finally {
      setLoading(false);
    }
  }

  if (verifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f2e8]">
        <div className="flex items-center gap-3 font-semibold text-[#e86f18]">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Verifying admin session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f2e8] px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-[#e1cfb0] bg-[#fffdf8] p-8 shadow-[0_20px_60px_rgba(77,58,30,0.12)]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#192f42] text-[#f8f2e8] shadow-md">
            <Shield className="h-8 w-8 text-[#e86f18]" />
          </div>
          <h1 className="text-3xl font-bold text-[#192f42]">Admin Portal</h1>
          <p className="mt-2 text-xs font-semibold text-[#667883]">
            Discover Nashik Management & Moderation Entry
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#192f42]">
              Admin ID
            </label>
            <div className="relative mt-1.5">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#667883]">
                <KeyRound className="h-4 w-4" />
              </div>
              <input
                type="text"
                required
                autoComplete="username"
                placeholder="Enter Admin ID"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                className="w-full rounded-xl border border-[#d8c4a3] bg-white py-3 pl-10 pr-4 text-sm text-[#192f42] placeholder-[#a0aab0] outline-none transition-all focus:border-[#e86f18] focus:ring-2 focus:ring-[#e86f18]/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#192f42]">
              Password
            </label>
            <div className="relative mt-1.5">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#667883]">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="Enter Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-[#d8c4a3] bg-white py-3 pl-10 pr-4 text-sm text-[#192f42] placeholder-[#a0aab0] outline-none transition-all focus:border-[#e86f18] focus:ring-2 focus:ring-[#e86f18]/20"
              />
            </div>
          </div>

          {error && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-bold text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#192f42] py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-[#25425c] active:scale-[0.99] disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In to Admin Portal</span>
            )}
          </button>
        </form>

        <div className="mt-8 border-t border-[#e1cfb0] pt-4 text-center">
          <p className="text-[11px] font-semibold text-[#8898a3]">
            Authorized System Access Only • Discover Nashik Platform
          </p>
        </div>
      </div>
    </div>
  );
}
