// components/BusinessHeader.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { LogOut, User, Menu, Building2, FileText } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useTranslation } from "@/lib/i18n";

interface BusinessHeaderProps {
  onToggleMobileMenu?: () => void;
  businessName?: string;
  category?: string;
}

export default function BusinessHeader({ onToggleMobileMenu, businessName, category }: BusinessHeaderProps) {
  const supabase = createClient();
  const { t } = useTranslation();
  const [userEmail, setUserEmail] = useState<string>("");
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      }
    })();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const toggleMenu = () => setMenuOpen(!menuOpen);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-16 left-0 right-0 z-20 flex h-16 items-center justify-between border-b border-[#c5924d]/30 bg-gradient-to-r from-[#102232] via-[#173247] to-[#122434] text-white shadow-[0_4px_20px_rgba(16,34,50,0.18)] transition-all duration-300 px-4 md:px-6">
      <div className="flex items-center w-full justify-between pr-2 sm:pr-4">
        <div className="flex items-center gap-2.5 min-w-0">
          {onToggleMobileMenu && (
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="rounded-xl p-1.5 text-[#f4ebd9] hover:bg-white/10 hover:text-[#f4b35f] border border-white/10 focus:outline-none lg:hidden cursor-pointer transition-colors"
              aria-label="Toggle navigation menu"
            >
              <Menu className="h-5 w-5 shrink-0" />
            </button>
          )}
          <div className="flex items-center gap-2 truncate">
            <Building2 className="h-5 w-5 text-[#f4b35f] shrink-0" />
            <h1 className="font-display text-lg sm:text-2xl font-bold tracking-wide text-[#fbf6ec] mb-0 truncate flex items-center gap-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
              <span className="truncate">{businessName || t("Business Portal")}</span>
              {category && (
                <span className="hidden sm:inline-flex items-center rounded-full bg-[#c5924d]/20 px-2.5 py-0.5 text-[10px] font-sans font-extrabold uppercase tracking-widest text-[#f4b35f] border border-[#c5924d]/40 shrink-0">
                  {category}
                </span>
              )}
            </h1>
          </div>
        </div>

      </div>
      <div className="flex items-center gap-3">
        <div className="relative" ref={containerRef}>
          <button
            onClick={toggleMenu}
            className="flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 px-3 py-1.5 text-xs sm:text-sm font-semibold text-[#fbf6ec] border border-[#c5924d]/40 transition-all cursor-pointer backdrop-blur-sm"
          >
            <User className="h-4 w-4 text-[#f4b35f]" />
            <span className="hidden sm:inline">{userEmail ? userEmail.split("@")[0] : t("Business Account")}</span>
            <span className="sm:hidden">{t("Account")}</span>
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 mt-2.5 w-52 overflow-hidden rounded-xl border border-[#c5924d]/40 bg-[#132636] p-1.5 shadow-2xl z-50 divide-y divide-white/10 backdrop-blur-xl"
            >
              {userEmail && (
                <div className="px-3 py-1.5 text-[11px] font-medium text-[#f4b35f]/90 truncate mb-1">
                  {userEmail}
                </div>
              )}
              <div className="pt-1 space-y-0.5">
                <Link
                  href="/business/register"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium text-[#e2e8f0] hover:bg-white/10 hover:text-white transition-colors"
                >
                  <FileText className="h-4 w-4 text-[#f4b35f]" />
                  {t("Edit Profile")}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 text-left rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-colors mt-1"
                >
                  <LogOut className="h-4 w-4 text-red-400" />
                  {t("Sign Out")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
