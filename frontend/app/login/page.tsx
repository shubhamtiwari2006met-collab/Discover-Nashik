"use client";

import Link from "next/link";
import { FormEvent, Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useTranslation } from "@/lib/i18n";

type LoginRole = "visitor" | "admin" | "business";
type AuthMode = "signIn" | "signUp" | "reset";

// backendUrl removed; using Supabase client directly
const supabase = createClient();

function LoginContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const requestedRole = searchParams.get("role");
  const role: LoginRole = requestedRole === "admin" || requestedRole === "business" ? requestedRole : "visitor";
  const requestedMode = searchParams.get("mode");
  const [mode, setMode] = useState<AuthMode>(requestedMode === "reset" ? "reset" : "signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  // New state to know if a user is already logged in and their role
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Fetch role when session becomes available
  useEffect(() => {
    if (session?.user && !userRole) {
      supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle()
        .then(({ data: profileData, error }) => {
          if (error) {
            console.error('Failed to fetch profile role:', error);
          } else if (profileData?.role) {
            setUserRole(profileData.role.toLowerCase());
          }
        });
    }
  }, [session, userRole]);

  // Removed redundant redirect useEffect; business redirection handled in handleSubmit


  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authErrorCode = params.get("error_code");
    const authErrorDescription = params.get("error_description");

    if (authErrorCode === "otp_expired") {
      setError("This password reset link has expired. Request a new reset link and open it promptly.");
      void supabase.auth.signOut({ scope: "local" });
    } else if (authErrorDescription) {
      setError(authErrorDescription.replace(/\+/g, " "));
    }

    if (params.has("code")) {
      void (async () => {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError?.code === "refresh_token_not_found") {
          await supabase.auth.signOut({ scope: "local" });
          setError("Your saved session expired. Please sign in again.");
          return;
        }
        if (!session) return;
        try {
          const { data: { user } } = await supabase.auth.getUser(session.access_token);
          if (!user) throw new Error("Could not identify the signed-in user.");
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();
          if (profileError) throw profileError;
          const fetchedRole = profile?.role?.toLowerCase();
          // Determine destination based on role and business approval status
          let dest = '/';
          if (fetchedRole === 'admin') {
            dest = '/admin/dashboard';
          } else if (fetchedRole === 'business') {
            // Check business approval status to decide where to send them
            try {
              const { data: regData, error: regError } = await supabase
                .from('business_registrations')
                .select('verification_status')
                .eq('owner_id', user.id)
                .maybeSingle();
              if (regError) throw regError;
              dest = regData?.verification_status === 'approved' ? '/business/dashboard' : '/business/pending';
            } catch {
              dest = '/business/pending';
            }
          }
          // Small delay to let cookies propagate before navigating
          await new Promise(resolve => setTimeout(resolve, 100));
          if (window.location.pathname !== dest) {
            window.location.href = dest;
          }
        } catch (callbackError) {
          setError(callbackError instanceof Error ? callbackError.message : "Could not finish Google sign-in.");
        }
      })();
    }
  }, [requestedRole]);

  // Clear all fields when switching between admin/business roles
  useEffect(() => {
    setEmail("");
    setPassword("");
    setError("");
    setMessage("");
    // Reset the native form so autocomplete state is also cleared
    if (formRef.current) {
      formRef.current.reset();
    }
  }, [role]);

  // Clear error/message on mode change but keep email for convenience
  useEffect(() => {
    setPassword("");
    setError("");
    setMessage("");
  }, [mode]);



  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (mode === "reset") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/login?mode=reset` });
        if (resetError) throw resetError;
        setMessage("Check your email for a password reset link.");
      } else if (mode === "signUp") {
        const { error: signUpError } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: `${window.location.origin}/login` } });
        if (signUpError) throw signUpError;
        setMessage("Account created. Check your email to verify your address.");
        setMode("signIn");
      } else {
        let signInData;
        try {
          const result = await supabase.auth.signInWithPassword({ email: email.trim(), password });
          if (result.error) {
            // For Primary Admin first-time setup: if account does not exist yet in Supabase Auth, attempt sign-up
            if (result.error.message?.includes("Invalid login credentials") && email.trim().toLowerCase() === 'shubhamtiwari.2006.met@gmail.com') {
              console.log('[Login] Primary Admin first-time setup attempt via signUp...');
              const signUpRes = await supabase.auth.signUp({ email: email.trim(), password });
              if (signUpRes.data?.session) {
                signInData = signUpRes.data;
              } else if (signUpRes.data?.user) {
                const retrySignIn = await supabase.auth.signInWithPassword({ email: email.trim(), password });
                if (retrySignIn.data?.session) {
                  signInData = retrySignIn.data;
                } else {
                  throw result.error;
                }
              } else {
                throw result.error;
              }
            } else {
              throw result.error;
            }
          } else {
            signInData = result.data;
          }
        } catch (signInErr: any) {
          if (signInErr?.message?.includes("Failed to fetch") || signInErr?.message?.includes("NetworkError") || signInErr?.message?.includes("Load failed")) {
            throw new Error("Network error: Could not reach the authentication server. Please check your internet connection and try again.");
          }
          if (signInErr?.message?.includes("Invalid login credentials")) {
            throw new Error("Invalid email or password. Please check your credentials and try again.");
          }
          throw signInErr;
        }

        if (!signInData.session || !signInData.user) throw new Error("No active session was created.");
        const currentUser = signInData.user;
        // Set session state for redirects
        setSession(signInData.session);

        // Fetch or ensure profile in profiles table — wrapped in try-catch
        // so a transient network failure here doesn't block login
        let fetchedRole = 'visitor';
        try {
          let { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', currentUser.id)
            .maybeSingle();

          if (!profile && !profileError) {
            // Profile row missing (user created before trigger existed) — auto-create profile row
            console.log('[Login] Auto-creating missing profile row for user:', currentUser.id);
            const newRole = role === 'business' ? 'BUSINESS' : role === 'admin' ? 'ADMIN' : 'VISITOR';
            await supabase.from('profiles').upsert({
              id: currentUser.id,
              email: currentUser.email || '',
              role: newRole,
            });
            fetchedRole = newRole.toLowerCase();
          } else if (profile && profile.role) {
            fetchedRole = profile.role.toLowerCase();
          }
        } catch (profileFetchErr) {
          console.warn('[Login] Could not fetch/create profile, proceeding with requested role:', profileFetchErr);
          // Fallback: use the requested role so the user isn't stuck
          fetchedRole = role === 'admin' ? 'admin' : role === 'business' ? 'business' : 'visitor';
        }

        console.log('[Login] User ID:', currentUser.id, '| Profile role:', fetchedRole, '| Requested role:', role);
        setUserRole(fetchedRole);

        // Role handling for Business login
        if (role === 'business' && fetchedRole !== 'business') {
          try {
            await supabase.from('profiles').upsert({
              id: currentUser.id,
              email: currentUser.email || '',
              role: 'BUSINESS',
            });
            fetchedRole = 'business';
          } catch (e) {
            console.warn('[Login] Failed to set business role, continuing:', e);
          }
        }

        // Strict Admin Authorization Check
        if (role === 'admin') {
          const userEmail = (currentUser.email || '').toLowerCase().trim();
          const isPrimary = userEmail === 'shubhamtiwari.2006.met@gmail.com';

          if (isPrimary) {
            fetchedRole = 'admin';
            setUserRole('admin');
            try {
              await supabase.from('profiles').upsert({
                id: currentUser.id,
                email: userEmail,
                role: 'ADMIN',
              });
            } catch (pErr) {
              console.warn('[Login] Error syncing primary admin profile role:', pErr);
            }
          } else {
            // Verify non-primary admin authorization with backend DB via /api/admin/verify
            let isAdminApproved = false;

            try {
              const verifyRes = await fetch('/api/admin/verify', {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${signInData.session.access_token}`,
                },
              });

              if (verifyRes.ok) {
                const verifyData = await verifyRes.json();
                if (verifyData?.user?.role === 'admin' && verifyData?.user?.adminStatus === 'active') {
                  isAdminApproved = true;
                } else if (verifyData?.user?.adminStatus === 'revoked') {
                  isAdminApproved = false;
                }
              } else {
                // If backend check returned error status, fallback to Supabase profile role if admin
                console.warn('[Login] Backend verify returned status:', verifyRes.status);
                if (fetchedRole === 'admin') {
                  isAdminApproved = true;
                }
              }
            } catch (verifyErr: any) {
              console.warn('[Login] Backend verify exception:', verifyErr);
              if (fetchedRole === 'admin') {
                isAdminApproved = true;
              }
            }

            if (isAdminApproved) {
              fetchedRole = 'admin';
              setUserRole('admin');
              try {
                await supabase.from('profiles').upsert({
                  id: currentUser.id,
                  email: userEmail,
                  role: 'ADMIN',
                });
              } catch (pErr) {
                console.warn('[Login] Error syncing admin profile role:', pErr);
              }
            } else {
              await supabase.auth.signOut({ scope: 'local' });
              throw new Error("You do not have permission to access the Admin Dashboard.");
            }
          }
        }

        // Determine destination based on role and business approval status
        let destination = '/';
        if (fetchedRole === 'admin') {
          destination = '/admin/dashboard';
        } else if (fetchedRole === 'business') {
          // Fetch approval status via Supabase
          try {
            const { data: regData, error: regError } = await supabase
              .from('business_registrations')
              .select('verification_status')
              .eq('owner_id', currentUser.id)
              .maybeSingle();
            if (regError) throw regError;
            destination = regData?.verification_status === 'approved' ? '/business/dashboard' : '/business/pending';
          } catch (e) {
            console.error('[Login] Failed to fetch application status', e);
            destination = '/business/pending';
          }
        }
        console.log('[Login] Redirecting to:', destination);
        // Small delay to let cookies propagate before navigating
        await new Promise(resolve => setTimeout(resolve, 150));
        // Use href for a full page navigation that goes through middleware
        window.location.href = destination;
        return;
      }
    } catch (submitError: any) {
      console.error('[Login] Submit error:', submitError);
      let message = "Authentication failed. Please try again.";
      const rawMsg = submitError?.message || (typeof submitError === 'string' ? submitError : '');
      if (rawMsg) {
        if (rawMsg.includes("Failed to fetch") || rawMsg.includes("NetworkError") || rawMsg.includes("Load failed")) {
          message = "Network error: Could not connect to the server. Please check your internet connection and try again.";
        } else if (rawMsg.includes("Invalid login credentials")) {
          message = "Invalid email or password. Please check your credentials and try again.";
        } else {
          message = rawMsg;
        }
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setLoading(true);
    setError("");
    const { error: oauthError } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/login?role=${role}` } });
    if (oauthError) {
      setError(oauthError.message.includes("provider is not enabled")
        ? "Google sign-in is not enabled in Supabase yet. Enable the Google provider in Supabase Authentication settings, then try again."
        : oauthError.message);
      setLoading(false);
    }
  }

  const title = role === "admin" ? t("Admin Login") : role === "business" ? t("Business Login") : t("Welcome back");

  const emailFieldName = `email-${role}`;
  const passwordFieldName = `password-${role}`;

  return (
    <div className="container mx-auto flex min-h-[75vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-[#e1cfb0] bg-[#fffdf8] p-7 shadow-[0_20px_60px_rgba(77,58,30,0.12)] sm:p-9">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600"><LogIn className="h-7 w-7" /></div>
          <h1 className="text-3xl font-bold text-[#173247]">{title}</h1>
          <p className="mt-2 text-sm text-[#667883]">{mode === "signUp" ? t("Create your Discover Nashik account") : mode === "reset" ? t("Reset your account password") : t("Sign in securely to continue")}</p>
        </div>
        {/* If already logged in as admin, show direct dashboard button */}
        {session?.user && userRole === 'admin' && (
          <div className="mb-4 text-center">
            <Link href="/admin/dashboard" className="inline-block rounded-full bg-[#e86f18] px-4 py-2 font-bold text-white hover:bg-[#c9580f]">
              {t("Go to Admin Dashboard")}
            </Link>
          </div>
        )}

        {mode !== "reset" && <button type="button" onClick={handleGoogleLogin} disabled={loading} className="mb-5 w-full rounded-xl border border-[#d8c4a3] bg-white px-4 py-3 font-semibold text-[#173247] hover:bg-orange-50 disabled:opacity-60">{t("Continue with Google")}</button>}
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
          <label className="block text-sm font-semibold text-[#173247]">
            {t("Email Address")}
            <input
              type="email"
              required
              name={emailFieldName}
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-[#d8c4a3] bg-white px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
            />
          </label>
          {mode !== "reset" && (
            <label className="block text-sm font-semibold text-[#173247]">
              {t("Password")}
              <input
                type="password"
                required
                minLength={6}
                name={passwordFieldName}
                autoComplete={mode === "signUp" ? "new-password" : "current-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#d8c4a3] bg-white px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </label>
          )}
          {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{t(error)}</p>}
          {message && <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{t(message)}</p>}
          <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#e86f18] px-4 py-3 font-bold text-white hover:bg-[#c9580f] disabled:opacity-60">{loading && <Loader2 className="h-4 w-4 animate-spin" />}{mode === "signUp" ? t("Create account") : mode === "reset" ? t("Send reset email") : t("Sign in")}</button>
        </form>
        <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-[#c9580f]">
          {mode === "signIn" && <button type="button" onClick={() => setMode("reset")} className="font-semibold hover:underline">{t("Forgot password?")}</button>}
          {mode === "reset" && <button type="button" onClick={() => setMode("signIn")} className="font-semibold hover:underline">{t("Back to sign in")}</button>}
          {mode !== "reset" && <button type="button" onClick={() => setMode(mode === "signUp" ? "signIn" : "signUp")} className="font-semibold hover:underline">{mode === "signUp" ? t("Already have an account? Sign in") : t("Create an account")}</button>}
        </div>
        {role === "business" && <Link href="/business/register" className="mt-5 block text-center text-xs text-[#667883] hover:text-[#c9580f]">{t("Register your business after signing in")}</Link>}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
