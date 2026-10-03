"use client";

import React, { useState } from "react";
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  Copy,
  Check,
  Sparkles,
  LogOut,
  HelpCircle,
  CheckCircle2
} from "lucide-react";
import { useUserAuth } from "@/context/UserAuthContext";
import { useTranslation } from "@/lib/i18n";

type AuthTab = "platformId" | "emailMobile";
type AuthMode = "login" | "register" | "forgot" | "reset" | "registeredSuccess";

export function UserAuthModal() {
  const { user, isAuthenticated, isAuthModalOpen, closeAuthModal, login, register, logout } = useUserAuth();
  const { t } = useTranslation();

  // Platform ID is the mandatory DEFAULT tab
  const [activeTab, setActiveTab] = useState<AuthTab>("platformId");
  const [authMode, setAuthMode] = useState<AuthMode>("login");

  // Form Fields
  const [name, setName] = useState("");
  const [emailOrMobile, setEmailOrMobile] = useState("");
  const [platformIdInput, setPlatformIdInput] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [createdPlatformId, setCreatedPlatformId] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const resetForm = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(false);
  };

  const handleTabChange = (tab: AuthTab) => {
    setActiveTab(tab);
    resetForm();
  };

  const handleModeChange = (mode: AuthMode) => {
    setAuthMode(mode);
    resetForm();
  };

  const copyPlatformId = (idToCopy: string) => {
    navigator.clipboard.writeText(idToCopy);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleLogoutAndLoginAgain = async () => {
    setSubmitting(true);
    await logout();
    setSubmitting(false);
    setActiveTab("platformId");
    setAuthMode("login");
    resetForm();
  };

  const handleForgotPasswordRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const identifier = activeTab === "platformId" ? platformIdInput : emailOrMobile;
    if (!identifier.trim()) {
      setErrorMsg("Please enter your Email, Mobile Number, or Discover Nashik ID");
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ identifier }),
      });
      const data = await res.json();
      setSubmitting(false);
      if (res.ok) {
        setSuccessMsg(data.message || "If an account matches the information provided, instructions to reset your password have been issued.");
        setAuthMode("reset");
      } else {
        setErrorMsg(data.message || "Failed to process request");
      }
    } catch {
      setSubmitting(false);
      setErrorMsg("Failed to process request");
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const identifier = activeTab === "platformId" ? platformIdInput : emailOrMobile;
    if (!identifier.trim() || !otp.trim() || !newPassword) {
      setErrorMsg("Identifier, verification code, and new password are required");
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters long");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ identifier, otp, newPassword }),
      });
      const data = await res.json();
      setSubmitting(false);
      if (res.ok && data.success) {
        setSuccessMsg("Password updated successfully. You can now login with your new password.");
        setAuthMode("login");
      } else {
        setErrorMsg(data.message || "Failed to reset password");
      }
    } catch {
      setSubmitting(false);
      setErrorMsg("Failed to reset password");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (authMode === "forgot") {
      return handleForgotPasswordRequest(e);
    }

    if (authMode === "reset") {
      return handleResetPasswordSubmit(e);
    }

    // LOGIN FLOW
    if (authMode === "login") {
      if (activeTab === "platformId") {
        if (!platformIdInput.trim()) {
          setErrorMsg("Please enter your Discover Nashik ID (e.g. DN-7K4M92X)");
          return;
        }
        setSubmitting(true);
        // Passwordless Platform ID Login: Send only platformIdInput (NO PASSWORD!)
        const res = await login(platformIdInput.trim());
        setSubmitting(false);
        if (!res.success) {
          setErrorMsg(res.message || "The credentials you entered are incorrect.");
        }
        return;
      } else {
        // EMAIL / MOBILE + PASSWORD LOGIN
        if (!emailOrMobile.trim()) {
          setErrorMsg("Please enter your Email or Mobile Number");
          return;
        }
        if (!password) {
          setErrorMsg("Please enter your password");
          return;
        }
        setSubmitting(true);
        const res = await login(emailOrMobile.trim(), password);
        setSubmitting(false);
        if (!res.success) {
          setErrorMsg(res.message || "The credentials you entered are incorrect.");
        }
        return;
      }
    }

    // REGISTER FLOW
    if (authMode === "register") {
      if (!emailOrMobile.trim()) {
        setErrorMsg("Please enter an email or mobile number for your account");
        return;
      }
      if (password && password.length < 6) {
        setErrorMsg("Password must be at least 6 characters long");
        return;
      }

      const isEmail = emailOrMobile.includes("@");
      const reqData = {
        name: name.trim() || undefined,
        email: isEmail ? emailOrMobile.trim() : undefined,
        mobile: !isEmail ? emailOrMobile.trim() : undefined,
        password: password || undefined,
      };

      setSubmitting(true);
      const res = await register(reqData);
      setSubmitting(false);

      if (res.success && res.user) {
        setCreatedPlatformId(res.user.platformId || null);
        setAuthMode("registeredSuccess");
      } else {
        setErrorMsg(res.message || "Failed to create user account");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-opacity">
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#e7b06d] bg-[#fffdf8] p-6 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={closeAuthModal}
          className="absolute right-4 top-4 rounded-full p-2 text-[#667883] hover:bg-[#fff1e6] hover:text-[#c9580f] transition-colors"
          aria-label={t("Close")}
        >
          <X className="h-5 w-5" />
        </button>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* CASE 1: ALREADY LOGGED IN USER BEHAVIOR */}
        {/* ───────────────────────────────────────────────────────────── */}
        {isAuthenticated && user && authMode !== "registeredSuccess" ? (
          <div className="text-center space-y-4 pt-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fff7ed] border border-[#e7b06d] text-[#e86f18]">
              <ShieldCheck className="h-7 w-7" />
            </div>

            <div>
              <h3 className="text-xl font-bold font-serif text-[#173247]">You are already logged in.</h3>
              <p className="mt-1 text-xs text-[#667883]">
                You are currently using this account on Discover Nashik.
              </p>
            </div>

            {/* Platform ID Box */}
            <div className="rounded-2xl border border-[#e7b06d] bg-[#fff7ed] p-4 text-center space-y-1.5 shadow-inner">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#a45317] block">
                Discover Nashik ID
              </span>
              <div className="flex items-center justify-center gap-2 font-mono text-2xl font-extrabold text-[#173247]">
                <span>{user.platformId || "DN-7K4M92X"}</span>
                <button
                  type="button"
                  onClick={() => copyPlatformId(user.platformId || "")}
                  className="p-1.5 rounded-lg text-[#e86f18] hover:bg-orange-100 transition-colors"
                  title="Copy Discover Nashik ID"
                >
                  {copiedId ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              {user.name && <p className="text-xs font-bold text-[#173247] pt-1">{user.name}</p>}
              <p className="text-xs text-[#667883]">{user.email || user.mobile}</p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={closeAuthModal}
                className="w-full py-3 rounded-xl bg-[#e86f18] text-white font-bold text-sm shadow-md hover:bg-[#c9580f] transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Continue as current user
              </button>

              <button
                type="button"
                onClick={handleLogoutAndLoginAgain}
                disabled={submitting}
                className="w-full py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 font-bold text-xs hover:bg-red-100 transition-all flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Log Out &amp; Login Again
              </button>
            </div>
          </div>
        ) : authMode === "registeredSuccess" ? (
          /* ───────────────────────────────────────────────────────────── */
          /* CASE 2: NEW USER ACCOUNT CREATION SUCCESS SHOWCASE */
          /* ───────────────────────────────────────────────────────────── */
          <div className="text-center space-y-4 pt-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 border border-emerald-300 text-emerald-600">
              <Sparkles className="h-7 w-7" />
            </div>

            <div>
              <h3 className="text-xl font-bold font-serif text-[#173247]">Account Created Successfully 🎉</h3>
              <p className="mt-1 text-xs text-[#667883]">
                Welcome to Discover Nashik! Your unique account platform identifier is ready.
              </p>
            </div>

            <div className="rounded-2xl border border-[#e7b06d] bg-[#fff7ed] p-4 text-center space-y-2 shadow-inner">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#a45317] block">
                Your Discover Nashik ID
              </span>
              <div className="flex items-center justify-center gap-2 font-mono text-2xl font-extrabold text-[#173247]">
                <span>{createdPlatformId || user?.platformId || "DN-7K4M92X"}</span>
                <button
                  type="button"
                  onClick={() => copyPlatformId(createdPlatformId || user?.platformId || "")}
                  className="p-1.5 rounded-lg text-[#e86f18] hover:bg-orange-100 transition-colors"
                  title="Copy Discover Nashik ID"
                >
                  {copiedId ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-[#8a5323] pt-1">
                You can use your Discover Nashik ID for future passwordless login.
              </p>
            </div>

            <button
              type="button"
              onClick={closeAuthModal}
              className="w-full py-3 rounded-xl bg-[#e86f18] text-white font-bold text-sm shadow-md hover:bg-[#c9580f] transition-all flex items-center justify-center gap-2"
            >
              Continue to Discover Nashik <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* ───────────────────────────────────────────────────────────── */
          /* CASE 3: NORMAL AUTHENTICATION FORM (LOGIN / REGISTER / FORGOT) */
          /* ───────────────────────────────────────────────────────────── */
          <>
            {/* Modal Header */}
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#fff7ed] border border-[#e7b06d] text-[#e86f18]">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-[#173247]">
                {authMode === "login" && "Welcome back to Discover Nashik"}
                {authMode === "register" && "Create your Account"}
                {authMode === "forgot" && "Forgot Password"}
                {authMode === "reset" && "Reset Password"}
              </h2>
              <p className="mt-1 text-xs text-[#667883]">
                {authMode === "login" && activeTab === "platformId" && "Enter your Discover Nashik ID for passwordless login"}
                {authMode === "login" && activeTab === "emailMobile" && "Sign in using your Email or Mobile Number and password"}
                {authMode === "register" && "Create your account to save personalized Kumbh journeys"}
                {authMode === "forgot" && "Enter your Email or Mobile Number to reset password"}
                {authMode === "reset" && "Enter code and set a new password"}
              </p>
            </div>

            {/* Alert Messages */}
            {errorMsg && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-600">
                ⚠️ {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
                ✨ {successMsg}
              </div>
            )}

            {/* Login Method Toggle (Platform ID default vs Email/Mobile) */}
            {authMode === "login" && (
              <div className="mb-5 flex rounded-xl border border-[#e7b06d] bg-[#fff7ed] p-1">
                <button
                  type="button"
                  onClick={() => handleTabChange("platformId")}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-bold transition-all ${
                    activeTab === "platformId"
                      ? "bg-[#e86f18] text-white shadow-md"
                      : "text-[#8a5323] hover:bg-[#ffedd5]"
                  }`}
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Discover Nashik ID</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTabChange("emailMobile")}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-bold transition-all ${
                    activeTab === "emailMobile"
                      ? "bg-[#e86f18] text-white shadow-md"
                      : "text-[#8a5323] hover:bg-[#ffedd5]"
                  }`}
                >
                  <Mail className="h-4 w-4" />
                  <span>Email / Mobile</span>
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Optional Name for Registration */}
              {authMode === "register" && (
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#173247]">
                    Full Name <span className="text-[#a45317] font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-3 h-4 w-4 text-[#a45317]" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full rounded-xl border border-[#d8c4a3] bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-[#173247] placeholder:text-[#94a3b8] focus:border-[#e86f18] focus:outline-none focus:ring-2 focus:ring-[#e86f18]/20"
                    />
                  </div>
                </div>
              )}

              {/* PLATFORM ID INPUT (Default Method — NO PASSWORD FIELD!) */}
              {authMode === "login" && activeTab === "platformId" && (
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#173247]">Discover Nashik ID</label>
                  <div className="relative">
                    <Sparkles className="absolute left-3.5 top-3 h-4 w-4 text-[#a45317]" />
                    <input
                      type="text"
                      value={platformIdInput}
                      onChange={(e) => setPlatformIdInput(e.target.value)}
                      placeholder="e.g. DN-7K4M92X"
                      required
                      className="w-full rounded-xl border border-[#d8c4a3] bg-white py-2.5 pl-10 pr-4 text-sm font-bold uppercase font-mono tracking-wider text-[#173247] placeholder:normal-case placeholder:font-sans placeholder:font-normal placeholder:text-[#94a3b8] focus:border-[#e86f18] focus:outline-none focus:ring-2 focus:ring-[#e86f18]/20"
                    />
                  </div>
                  <div className="mt-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleTabChange("emailMobile")}
                      className="text-[11px] font-bold text-[#e86f18] hover:underline flex items-center justify-end gap-1 ml-auto"
                    >
                      <HelpCircle className="w-3.5 h-3.5" /> Forgot your Discover Nashik ID?
                    </button>
                  </div>
                </div>
              )}

              {/* EMAIL / MOBILE INPUT */}
              {(authMode === "register" || (authMode === "login" && activeTab === "emailMobile") || authMode === "forgot") && (
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#173247]">Email or Mobile Number</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-[#a45317]" />
                    <input
                      type="text"
                      value={emailOrMobile}
                      onChange={(e) => setEmailOrMobile(e.target.value)}
                      placeholder="you@example.com or 9876543210"
                      required
                      className="w-full rounded-xl border border-[#d8c4a3] bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-[#173247] placeholder:text-[#94a3b8] focus:border-[#e86f18] focus:outline-none focus:ring-2 focus:ring-[#e86f18]/20"
                    />
                  </div>
                </div>
              )}

              {/* PASSWORD INPUT (ONLY FOR EMAIL/MOBILE LOGIN & REGISTRATION) */}
              {(authMode === "register" || (authMode === "login" && activeTab === "emailMobile")) && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-[#173247]">Password</label>
                    {authMode === "login" && (
                      <button
                        type="button"
                        onClick={() => handleModeChange("forgot")}
                        className="text-[11px] font-bold text-[#e86f18] hover:underline"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-[#a45317]" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full rounded-xl border border-[#d8c4a3] bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-[#173247] placeholder:text-[#94a3b8] focus:border-[#e86f18] focus:outline-none focus:ring-2 focus:ring-[#e86f18]/20"
                    />
                  </div>
                </div>
              )}

              {/* NEW PASSWORD INPUT FOR RESET */}
              {authMode === "reset" && (
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#173247]">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-[#a45317]" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full rounded-xl border border-[#d8c4a3] bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-[#173247] placeholder:text-[#94a3b8] focus:border-[#e86f18] focus:outline-none focus:ring-2 focus:ring-[#e86f18]/20"
                    />
                  </div>
                </div>
              )}

              {/* OTP / VERIFICATION CODE INPUT */}
              {authMode === "reset" && (
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#173247]">Enter 6-Digit Verification Code</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-[#a45317]" />
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="e.g. 123456"
                      maxLength={6}
                      required
                      className="w-full rounded-xl border border-[#d8c4a3] bg-white py-2.5 pl-10 pr-4 text-sm font-bold text-[#173247] tracking-widest placeholder:normal-case placeholder:tracking-normal placeholder:font-normal placeholder:text-[#94a3b8] focus:border-[#e86f18] focus:outline-none focus:ring-2 focus:ring-[#e86f18]/20"
                    />
                  </div>
                </div>
              )}

              {/* Submit Action Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#e86f18] py-3 text-sm font-bold text-white shadow-md hover:bg-[#c9580f] transition-all disabled:opacity-60 hover:scale-[1.01]"
              >
                <span>
                  {submitting
                    ? "Please wait..."
                    : authMode === "login"
                    ? activeTab === "platformId"
                      ? "Continue"
                      : "Sign In"
                    : authMode === "register"
                    ? "Create Account"
                    : authMode === "forgot"
                    ? "Send Reset Code"
                    : "Update Password"}
                </span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            {/* Footer Navigation / Mode Switch */}
            <div className="mt-5 border-t border-[#f1d9b6] pt-4 text-center text-xs font-medium text-[#667883]">
              {authMode === "login" ? (
                <p>
                  New to Discover Nashik?{" "}
                  <button
                    type="button"
                    onClick={() => handleModeChange("register")}
                    className="font-bold text-[#e86f18] hover:underline"
                  >
                    Create Account
                  </button>
                </p>
              ) : authMode === "register" ? (
                <p>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => handleModeChange("login")}
                    className="font-bold text-[#e86f18] hover:underline"
                  >
                    Sign In
                  </button>
                </p>
              ) : (
                <p>
                  Back to{" "}
                  <button
                    type="button"
                    onClick={() => handleModeChange("login")}
                    className="font-bold text-[#e86f18] hover:underline"
                  >
                    Sign In
                  </button>
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
