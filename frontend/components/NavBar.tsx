"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef, FormEvent } from "react";
import { Menu, X, Users, Languages, ChevronDown, Check, LogIn, Sparkles, User as UserIcon, LogOut, Search } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import type { Language } from "@/lib/locale";
import { createClient } from "@/utils/supabase/client";
import { useUserAuth } from "@/context/UserAuthContext";
import NotificationBell from "@/components/NotificationBell";
import type { Session } from "@supabase/supabase-js";
import logo from "@/assets/DN.logo.png";

const supabase = createClient();

export function NavBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isUserAccountOpen, setIsUserAccountOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const { language, setLanguage, t } = useTranslation();
  const languageLabels: Record<Language, string> = { en: "English", hi: "हिन्दी", mr: "मराठी" };

  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const handleLanguageChange = (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    setIsLanguageOpen(false);
    setIsLoginOpen(false);
  };

  // Close menu dropdown when clicking anywhere outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !menuRef.current?.contains(target) &&
        !mobileMenuRef.current?.contains(target)
      ) {
        setIsMenuOpen(false);
        setIsLoginOpen(false);
        setIsLanguageOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    if (isOpen) document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);



  // Normal user auth state
  const { user, isAuthenticated, openAuthModal, logout: normalUserLogout } = useUserAuth();

  // Manage session and fetch user role for admin/business
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
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
      subscription.unsubscribe();
    };
  }, []);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = searchQuery.trim();
    window.location.href = query ? `/search?query=${encodeURIComponent(query)}` : "/search";
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-[#d8c4a3] bg-[#fffdf8] shadow-[0_3px_18px_rgba(74,55,31,0.08)]">
      <div className="relative z-50 mx-auto flex h-16 items-center justify-between px-4 md:px-8">
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

        {/* Compact Navbar Search */}
        <form
          onSubmit={handleSearch}
          className="hidden sm:flex flex-1 max-w-xs lg:max-w-sm mx-3 items-center gap-1.5 rounded-full border border-[#e1cfb0] bg-[#f8f2e8] px-3 py-1.5 transition-colors focus-within:border-[#e86f18] focus-within:bg-white focus-within:shadow-sm"
        >
          <Search className="h-3.5 w-3.5 text-[#667883] shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("Search places, temples...")}
            className="flex-1 min-w-0 bg-transparent text-[#173247] placeholder-[#667883] outline-none text-xs"
          />
          <button
            type="submit"
            className="rounded-full bg-[#e86f18] px-2.5 py-1 text-[10px] font-bold text-white hover:bg-[#c9580f] shrink-0 transition-colors"
          >
            {t("Go")}
          </button>
        </form>

        <nav className="ml-auto flex items-center gap-2 md:ml-0 md:gap-0 md:space-x-4">
          <Link
            href="/kumbh"
            className="relative hidden items-center gap-1.5 rounded-full border border-[#e7b06d] bg-[#fff7ed] px-3.5 py-2 text-sm font-bold text-[#c9580f] transition-all hover:bg-[#ffedd5] shadow-sm hover:scale-[1.02] md:flex"
          >
            <Sparkles className="h-4 w-4 text-[#e86f18]" />
            <span>{t("Kumbh Mela")}</span>
          </Link>
          <NotificationBell />
          {/* Mobile Search Icon — next to hamburger */}
          <Link
            href="/search"
            className="p-2 text-[#667883] hover:text-[#e86f18] transition-colors sm:hidden"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </Link>
          <button
            className="p-2 text-[#e86f18] transition-colors hover:text-[#c9580f] md:hidden"
            onClick={() => {
              setIsLanguageOpen(false);
              setIsLoginOpen(false);
              setIsOpen((previous) => !previous);
            }}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* Show dashboard link appropriate to logged-in admin/business role */}
          {session?.user && role === 'admin' && (
            <Link
              href="/admin/dashboard"
              className="hidden items-center gap-1.5 rounded-full border border-[#e7b06d] bg-[#fff7ed] px-3 py-2 text-sm font-bold text-[#c9580f] hover:bg-[#ffedd5] md:flex"
            >
              <Users className="h-4 w-4" />
              {t("Admin Dashboard")}
            </Link>
          )}
          {session?.user && role === 'business' && (
            <Link
              href="/business/dashboard"
              className="ml-2 hidden items-center gap-1.5 rounded-full border border-[#e7b06d] bg-[#fff7ed] px-3 py-2 text-sm font-bold text-[#c9580f] hover:bg-[#ffedd5] md:flex"
            >
              <Users className="h-4 w-4" />
              {t("Business Dashboard")}
            </Link>
          )}

          {/* Menu Dropdown (User Auth, Languages & Admin/Business Login options) */}
          <div ref={menuRef} className="relative ml-1 hidden md:block">
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
              <div className="absolute right-0 top-full z-50 mt-2 min-w-56 overflow-hidden rounded-xl border border-[#f4b35f] bg-[#fffaf0] p-2 shadow-xl dark:border-orange-800 dark:bg-orange-950">
                {/* Language Selector */}
                <div className="relative mb-1 border-b border-[#f1d9b6] pb-2">
                  <button type="button" onClick={() => setIsLanguageOpen(!isLanguageOpen)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold text-[#c2410c] hover:bg-orange-100 dark:text-orange-300 dark:hover:bg-orange-900/50" aria-label="Language" aria-expanded={isLanguageOpen}>
                    <Languages className="h-4 w-4" />
                    <span className="flex-1">{t("Language")}</span>
                    <span className="flex items-center gap-1">{languageLabels[language]} <ChevronDown className={`h-4 w-4 transition-transform ${isLanguageOpen ? "rotate-180" : ""}`} /></span>
                  </button>
                  {isLanguageOpen && (
                    <div className="mt-1 overflow-hidden rounded-lg border border-[#f4b35f] bg-white p-1 dark:border-orange-800 dark:bg-orange-950">
                      {(Object.keys(languageLabels) as Language[]).map((option) => (
                        <button key={option} type="button" onClick={() => handleLanguageChange(option)} className="block w-full rounded-lg px-3 py-2 text-left text-sm font-bold text-[#c2410c] hover:bg-orange-100 dark:text-orange-300 dark:hover:bg-orange-900/50">
                          {languageLabels[option]}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Login Dropdown (User Login, Admin Login, Business Login) */}
                {!session && (
                  <div className="relative mb-1 border-b border-[#f1d9b6] pb-2">
                    <button type="button" onClick={() => setIsLoginOpen(!isLoginOpen)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold text-[#c2410c] hover:bg-orange-100 dark:text-orange-300 dark:hover:bg-orange-900/50" aria-label="Login" aria-expanded={isLoginOpen}>
                      <LogIn className="h-4 w-4" />
                      <span className="flex-1">{t("Login")}</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${isLoginOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isLoginOpen && (
                      <div className="mt-1 overflow-hidden rounded-lg border border-[#f4b35f] bg-white p-1 dark:border-orange-800 dark:bg-orange-950">
                        <a href="/login?role=business" onClick={() => { setIsLoginOpen(false); setIsMenuOpen(false); }} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-[#c2410c] hover:bg-orange-100 dark:text-orange-300 dark:hover:bg-orange-900/50">
                          <LogIn className="h-4 w-4" />
                          {t("Business Login")}
                        </a>
                        {isAuthenticated && user ? (
                          <div className="mt-1 border-t border-[#f1d9b6] pt-2">
                            <p className="px-3 py-2 text-xs font-semibold text-[#667883]">
                              Signed in as {user.name || user.email || user.mobile || user.platformId}
                            </p>
                            <button
                              type="button"
                              onClick={async () => {
                                await normalUserLogout();
                                setIsLoginOpen(false);
                                setIsMenuOpen(false);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold text-red-600 hover:bg-red-50"
                            >
                              <LogOut className="h-4 w-4" />
                              {t("Sign Out")}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setIsLoginOpen(false);
                              setIsMenuOpen(false);
                              openAuthModal();
                            }}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold text-[#c2410c] hover:bg-orange-100 dark:text-orange-300 dark:hover:bg-orange-900/50"
                          >
                            <UserIcon className="h-4 w-4" />
                            {t("User Login")}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {session?.user && (
                  <button type="button" onClick={async () => { await supabase.auth.signOut(); setIsMenuOpen(false); window.location.href = "/"; }} className="mt-1 w-full rounded-lg border-t border-[#f1d9b6] px-3 py-2 text-left text-sm font-bold text-[#667883] hover:bg-orange-100 dark:hover:bg-orange-900/50">
                    {t("Sign Out Admin/Business")}
                  </button>
                )}
              </div>
            )}
          </div>
        </nav>

      </div>

      {/* Mobile Pop-up Window */}
      {isOpen && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px] md:hidden"
            onClick={() => {
              setIsOpen(false);
              setIsLanguageOpen(false);
              setIsLoginOpen(false);
            }}
          />
          <div
            ref={mobileMenuRef}
            className="absolute right-3 top-[calc(100%+0.35rem)] z-50 w-72 sm:w-80 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-[#f4b35f] bg-[#fffaf0] p-3.5 shadow-[0_12px_36px_rgba(74,55,31,0.22)] md:hidden max-h-[85vh] overflow-y-auto"
          >
            {/* Pop-up pointer triangle */}
            <div className="absolute -top-1.5 right-4 h-3 w-3 rotate-45 border-l border-t border-[#f4b35f] bg-[#fffaf0]" />

            <nav className="relative z-10 flex flex-col space-y-3" onClick={(event) => event.stopPropagation()}>
              {/* Language Selector */}
              <div className="relative flex min-w-0 items-center justify-between gap-2 rounded-xl border border-[#e7b06d] bg-[#fff7ed] px-3.5 py-2.5 text-sm font-bold text-[#c9580f]">
                <div className="flex items-center gap-2 min-w-0">
                  <Languages className="h-4 w-4 shrink-0 text-[#e86f18]" />
                  <span className="min-w-0 truncate">{t("Language")}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLanguageOpen((open) => !open)}
                  aria-label={t("Language")}
                  aria-expanded={isLanguageOpen}
                  aria-haspopup="listbox"
                  className="flex shrink-0 items-center gap-1 rounded-lg bg-[#ffedd5] px-2.5 py-1 text-xs font-bold text-[#c9580f] transition-colors hover:bg-[#fed7aa]"
                >
                  {languageLabels[language]}
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isLanguageOpen ? "rotate-180" : ""}`} />
                </button>
                {isLanguageOpen && (
                  <div
                    role="listbox"
                    aria-label={t("Language")}
                    className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-[#e7b06d] bg-[#fffaf0] p-1 shadow-lg"
                  >
                    {(Object.keys(languageLabels) as Language[]).map((option) => (
                      <button
                        key={option}
                        type="button"
                        role="option"
                        aria-selected={language === option}
                        onClick={() => handleLanguageChange(option)}
                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors ${
                          language === option
                            ? "bg-[#ffedd5] text-[#9a3412]"
                            : "text-[#c9580f] hover:bg-[#fff1e6]"
                        }`}
                      >
                        {languageLabels[option]}
                        {language === option && <Check aria-hidden="true" className="h-3.5 w-3.5" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile User Auth Button */}
              {isAuthenticated && user && (
                <div className="rounded-xl border border-[#e7b06d] bg-[#fff7ed] p-2.5">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-[#f1d9b6] mb-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e86f18] text-white text-xs font-bold shrink-0">
                      {(user.name ? user.name.charAt(0) : user.email ? user.email.charAt(0) : user.mobile ? user.mobile.charAt(0) : "U").toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#173247] truncate">{user.name || "Discover Nashik User"}</p>
                      <p className="text-[11px] text-[#667883] truncate">{user.email || user.mobile}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await normalUserLogout();
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-50 py-2 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>{t("Sign Out")}</span>
                  </button>
                </div>
              )}

              <Link
                href="/kumbh"
                onClick={() => setIsOpen(false)}
                className="relative flex items-center justify-center gap-2 rounded-xl border border-[#e7b06d] bg-[#fff7ed] px-3.5 py-2.5 text-xs font-bold text-[#c9580f] hover:bg-[#ffedd5] transition-colors"
              >
                <Sparkles className="h-4 w-4 text-[#e86f18]" />
                <span>{t("Kumbh Mela 2027")}</span>
              </Link>

              {session?.user && role === 'business' && (
                <Link
                  href="/business/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-[#e7b06d] bg-[#fff7ed] px-3.5 py-2.5 text-xs font-bold text-[#c9580f] hover:bg-[#ffedd5] transition-colors"
                >
                  <Users className="h-4 w-4" />
                  {t("Business Dashboard")}
                </Link>
              )}
              {session?.user && role === 'admin' && (
                <Link
                  href="/admin/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-[#e7b06d] bg-[#fff7ed] px-3.5 py-2.5 text-xs font-bold text-[#c9580f] hover:bg-[#ffedd5] transition-colors"
                >
                  <Users className="h-4 w-4" />
                  {t("Admin Dashboard")}
                </Link>
              )}

              {!session && (
                <div className="rounded-xl border border-[#e7b06d] bg-[#fff7ed] p-2">
                  <p className="px-2.5 pb-1 pt-1 text-[11px] font-bold uppercase tracking-wider text-[#a45317]">{t("Login")}</p>
                  <a href="/login?role=business" onClick={() => setIsOpen(false)} className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-bold text-[#c2410c] hover:bg-orange-100 transition-colors">
                    <LogIn className="h-4 w-4" />
                    {t("Business Login")}
                  </a>
                  {!isAuthenticated && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        openAuthModal();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-bold text-[#c2410c] hover:bg-orange-100 transition-colors"
                    >
                      <UserIcon className="h-4 w-4" />
                      {t("User Login")}
                    </button>
                  )}
                </div>
              )}
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
