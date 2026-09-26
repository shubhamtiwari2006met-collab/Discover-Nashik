"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, FormEvent } from "react";
import { Menu, X, Users, Languages, ChevronDown, LogIn } from "lucide-react";
import { useTranslation, type Language } from "@/lib/i18n";
import { createClient } from "@/utils/supabase/client";
import logo from "@/assets/DN.logo.png"

const supabase = createClient();

export function NavBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [session, setSession] = useState<any>(null);
  const { language, setLanguage, t } = useTranslation();
  const languageLabels: Record<Language, string> = { en: "English", hi: "हिन्दी", mr: "मराठी" };

  // Manage session and fetch user role
  const [role, setRole] = useState<string | null>(null);
  const [hasGroupUnread, setHasGroupUnread] = useState(false);
  const [hasLostFoundUnread, setHasLostFoundUnread] = useState(false);

  useEffect(() => {
    // Check group tracker unread status
    const checkGroupUnread = () => {
      const activeCode = localStorage.getItem("active_group_code");
      if (activeCode) {
        const isUnread = localStorage.getItem(`group_unread_${activeCode}`) === "true";
        setHasGroupUnread(isUnread);
      } else {
        setHasGroupUnread(false);
      }
    };

    const checkLostFoundUnread = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const res = await fetch("/api/kumbh/lost-found/notifications/unread-count", {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setHasLostFoundUnread(data.unreadCount > 0);
          }
        } else {
          setHasLostFoundUnread(false);
        }
      } catch (err) {
        // Ignore silent fetch errors
      }
    };

    checkGroupUnread();
    checkLostFoundUnread();

    const interval = setInterval(() => {
      checkGroupUnread();
      checkLostFoundUnread();
    }, 30000);

    const handleRefreshEvent = () => {
      checkLostFoundUnread();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("refresh_lost_found_unread", handleRefreshEvent);
    }

    let bc: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      bc = new BroadcastChannel("discover_group_tracker");
      bc.onmessage = (event) => {
        const activeCode = localStorage.getItem("active_group_code");
        if (activeCode && event.data?.code === activeCode && (event.data?.type === "NEW_NOTE" || event.data?.type === "LOCATION_UPDATE")) {
          setHasGroupUnread(true);
        }
      };
    }

    // Get current session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        const userEmail = (data.session.user.email || '').toLowerCase().trim();
        if (userEmail === 'shubhamtiwari.2006.met@gmail.com') {
          setRole('admin');
        } else {
          // Fetch role from profiles table
          supabase
            .from('profiles')
            .select('role')
            .eq('id', data.session.user.id)
            .maybeSingle()
            .then(({ data: profileData, error }) => {
              if (!error && profileData?.role) {
                setRole(profileData.role.toLowerCase());
              } else {
                setRole('visitor');
              }
            });
        }
      } else {
        setRole(null);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        const userEmail = (session.user.email || '').toLowerCase().trim();
        if (userEmail === 'shubhamtiwari.2006.met@gmail.com') {
          setRole('admin');
        } else {
          supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .maybeSingle()
            .then(({ data: profileData, error }) => {
              if (!error && profileData?.role) {
                setRole(profileData.role.toLowerCase());
              } else {
                setRole('visitor');
              }
            });
        }
      } else {
        setRole(null);
      }
    });

    return () => {
      clearInterval(interval);
      if (typeof window !== "undefined") {
        window.removeEventListener("refresh_lost_found_unread", handleRefreshEvent);
      }
      if (bc) bc.close();
      subscription.unsubscribe();
    };
  }, []);

  const handleGroupTrackerClick = () => {
    const activeCode = localStorage.getItem("active_group_code");
    if (activeCode) {
      localStorage.removeItem(`group_unread_${activeCode}`);
    }
    setHasGroupUnread(false);
  };


  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = searchQuery.trim();
    window.location.href = query ? `/search?query=${encodeURIComponent(query)}` : "/search";
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-[#d8c4a3] bg-[#fffdf8]/95 shadow-[0_3px_18px_rgba(74,55,31,0.08)] backdrop-blur-md">
      <div className="mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center space-x-2 shrink-0">
          <Image
            src={logo}
            alt="Discover Nashik Logo"
            width={56}
            height={56}
            priority
            className="h-14 w-14 object-contain shrink-0"
          />
          <span className="text-lg font-bold tracking-tight text-[#173247] sm:text-xl">
            <span>Discover</span> <span className="text-[#e86f18]">Nashik</span>
          </span>
        </Link>


        <div className="hidden lg:flex flex-1" />

        <nav className="hidden items-center space-x-4 md:flex">
          <Link
            href="/kumbh/lost-found"
            className="relative flex items-center gap-1.5 rounded-full border border-[#e7b06d] bg-[#fff7ed] px-3 py-2 text-sm font-bold text-[#c9580f] transition-colors hover:bg-[#ffedd5]"
          >
            <span>{t("Lost & Found")}</span>
            {hasLostFoundUnread && (
              <span className="relative flex h-2.5 w-2.5 ml-0.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
              </span>
            )}
          </Link>

          <Link
            href="/group-tracker"
            onClick={handleGroupTrackerClick}
            className="relative flex items-center gap-1.5 rounded-full border border-[#e7b06d] bg-[#fff7ed] px-3 py-2 text-sm font-bold text-[#c9580f] transition-colors hover:bg-[#ffedd5]"
          >
            <Users className="h-4 w-4" />
            {t("Group Tracker")}
            {hasGroupUnread && (
              <span className="relative flex h-2.5 w-2.5 ml-0.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-600"></span>
              </span>
            )}
          </Link>

          {/* Show dashboard link appropriate to the logged‑in role */}
          {session?.user && role === 'admin' && (
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-1.5 rounded-full border border-[#e7b06d] bg-[#fff7ed] px-3 py-2 text-sm font-bold text-[#c9580f] hover:bg-[#ffedd5]"
            >
              <Users className="h-4 w-4" />
              {t("Admin Dashboard")}
            </Link>
          )}
          {session?.user && role === 'business' && (
            <Link
              href="/business/dashboard"
              className="ml-2 flex items-center gap-1.5 rounded-full border border-[#e7b06d] bg-[#fff7ed] px-3 py-2 text-sm font-bold text-[#c9580f] hover:bg-[#ffedd5]"
            >
              <Users className="h-4 w-4" />
              {t("Business Dashboard")}
            </Link>
          )}

          <div className="relative ml-1">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="rounded-full p-2 text-[#e86f18] transition-colors hover:bg-[#fff1e6] hover:text-[#c9580f]"
              aria-label="Open menu"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 min-w-52 overflow-hidden rounded-xl border border-[#f4b35f] bg-[#fffaf0] p-2 shadow-xl dark:border-orange-800 dark:bg-orange-950">
                <div className="relative mb-1 border-b border-[#f1d9b6] pb-2">
                  <button type="button" onClick={() => setIsLanguageOpen(!isLanguageOpen)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold text-[#c2410c] hover:bg-orange-100 dark:text-orange-300 dark:hover:bg-orange-900/50" aria-label="Language" aria-expanded={isLanguageOpen}>
                    <Languages className="h-4 w-4" />
                    <span className="flex-1">{t("Language")}</span>
                    <span className="flex items-center gap-1">{languageLabels[language]} <ChevronDown className={`h-4 w-4 transition-transform ${isLanguageOpen ? "rotate-180" : ""}`} /></span>
                  </button>
                  {isLanguageOpen && (
                    <div className="mt-1 overflow-hidden rounded-lg border border-[#f4b35f] bg-white p-1 dark:border-orange-800 dark:bg-orange-950">
                      {(Object.keys(languageLabels) as Language[]).map((option) => (
                        <button key={option} type="button" onClick={() => { setLanguage(option); setIsLanguageOpen(false); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm font-bold text-[#c2410c] hover:bg-orange-100 dark:text-orange-300 dark:hover:bg-orange-900/50">
                          {languageLabels[option]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {!session && (
                  <div className="relative mb-1 border-b border-[#f1d9b6] pb-2">
                    <button type="button" onClick={() => setIsLoginOpen(!isLoginOpen)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold text-[#c2410c] hover:bg-orange-100 dark:text-orange-300 dark:hover:bg-orange-900/50" aria-label="Login" aria-expanded={isLoginOpen}>
                      <LogIn className="h-4 w-4" />
                      <span className="flex-1">{t("Login")}</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${isLoginOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isLoginOpen && (
                      <div className="mt-1 overflow-hidden rounded-lg border border-[#f4b35f] bg-white p-1 dark:border-orange-800 dark:bg-orange-950">
                        <a href="/login?role=admin" onClick={() => { setIsLoginOpen(false); setIsMenuOpen(false); }} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-[#c2410c] hover:bg-orange-100 dark:text-orange-300 dark:hover:bg-orange-900/50">
                          <LogIn className="h-4 w-4" />
                          {t("Admin Login")}
                        </a>
                        <a href="/login?role=business" onClick={() => { setIsLoginOpen(false); setIsMenuOpen(false); }} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-[#c2410c] hover:bg-orange-100 dark:text-orange-300 dark:hover:bg-orange-900/50">
                          <LogIn className="h-4 w-4" />
                          {t("Business Login")}
                        </a>
                      </div>
                    )}
                  </div>
                )}
                {session?.user && (
                  <button type="button" onClick={async () => { await supabase.auth.signOut(); setIsMenuOpen(false); window.location.href = "/"; }} className="mt-1 w-full rounded-lg border-t border-[#f1d9b6] px-3 py-2 text-left text-sm font-bold text-[#667883] hover:bg-orange-100 dark:hover:bg-orange-900/50">
                    {t("Sign Out")}
                  </button>
                )}
              </div>
            )}
          </div>

        </nav>

        <button
          className="p-2 text-[#e86f18] transition-colors hover:text-[#c9580f] md:hidden"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-[#d8c4a3] bg-[#fffdf8] md:hidden">
          <nav className="container mx-auto flex flex-col space-y-4 px-4 py-4">
            <div className="relative flex items-center gap-2 rounded-xl border border-[#e7b06d] bg-[#fff7ed] px-4 py-3 text-base font-bold text-[#c9580f]">
              <Languages className="h-5 w-5" />
              <button type="button" onClick={() => setIsLanguageOpen(!isLanguageOpen)} className="flex flex-1 items-center justify-between text-left" aria-label="Language" aria-expanded={isLanguageOpen}>
                <span>{t("Language")}</span>
                <span className="flex items-center gap-1">{languageLabels[language]} <ChevronDown className={`h-4 w-4 transition-transform ${isLanguageOpen ? "rotate-180" : ""}`} /></span>
              </button>
              {isLanguageOpen && (
                <div className="absolute left-4 right-4 top-full z-50 mt-2 overflow-hidden rounded-xl border border-[#f4b35f] bg-[#fffaf0] p-1 shadow-xl dark:border-orange-800 dark:bg-orange-950">
                  {(Object.keys(languageLabels) as Language[]).map((option) => (
                    <button key={option} type="button" onClick={() => { setLanguage(option); setIsLanguageOpen(false); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm font-bold text-[#c2410c] hover:bg-orange-100 dark:text-[#f4b35f] dark:hover:bg-orange-900/50">
                      {languageLabels[option]}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Link
              href="/kumbh/lost-found"
              onClick={() => setIsOpen(false)}
              className="relative flex items-center justify-center gap-2 rounded-xl border border-[#e7b06d] bg-[#fff7ed] px-4 py-3 text-base font-bold text-[#c9580f] hover:bg-[#ffedd5]"
            >
              <span>{t("Lost & Found")}</span>
              {hasLostFoundUnread && (
                <span className="flex h-3 w-3 relative ml-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                </span>
              )}
            </Link>
            <Link
              href="/group-tracker"
              onClick={() => {
                handleGroupTrackerClick();
                setIsOpen(false);
              }}
              className="relative flex items-center justify-center gap-2 rounded-xl border border-[#e7b06d] bg-[#fff7ed] px-4 py-3 text-base font-bold text-[#c9580f] hover:bg-[#ffedd5]"
            >
              <Users className="h-5 w-5" />
              {t("Group Tracker")}
              {hasGroupUnread && (
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                </span>
              )}
            </Link>
            {session?.user && role === 'business' && (
              <Link
                href="/business/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl border border-[#e7b06d] bg-[#fff7ed] px-4 py-3 text-base font-bold text-[#c9580f] hover:bg-[#ffedd5]"
              >
                <Users className="h-5 w-5" />
                {t("Business Dashboard")}
              </Link>
            )}
            {session?.user && role === 'admin' && (
              <Link
                href="/admin/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl border border-[#e7b06d] bg-[#fff7ed] px-4 py-3 text-base font-bold text-[#c9580f] hover:bg-[#ffedd5]"
              >
                <Users className="h-5 w-5" />
                {t("Admin Dashboard")}
              </Link>
            )}
            {!session ? (
              <div className="rounded-xl border border-[#e7b06d] bg-[#fff7ed] p-2">
                <p className="px-3 pb-1 pt-2 text-xs font-bold uppercase tracking-wider text-[#a45317]">{t("Login")}</p>
                <a href="/login?role=admin" onClick={() => setIsOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-3 text-base font-bold text-[#c2410c] hover:bg-orange-100">
                  <LogIn className="h-5 w-5" />
                  {t("Admin Login")}
                </a>
                <a href="/login?role=business" onClick={() => setIsOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-3 text-base font-bold text-[#c2410c] hover:bg-orange-100">
                  <LogIn className="h-5 w-5" />
                  {t("Business Login")}
                </a>
              </div>
            ) : (
              <button type="button" onClick={async () => { await supabase.auth.signOut(); setIsOpen(false); window.location.href = "/"; }} className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-base font-bold text-red-600 hover:bg-red-100 hover:text-red-700">
                {t("Sign Out")}
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
