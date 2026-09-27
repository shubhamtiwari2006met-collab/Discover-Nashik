// components/AdminHeader.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Loader2, LogOut, User, Menu, Settings } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useTranslation } from "@/lib/i18n";

export default function AdminHeader({ onToggleMobileMenu }: { onToggleMobileMenu?: () => void }) {
  const supabase = createClient();
  const { t } = useTranslation();
  const [admin, setAdmin] = useState<{ name?: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Load admin profile
  useEffect(() => {
    async function fetchProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("name,email")
        .eq("id", session.user.id)
        .maybeSingle();
      if (!error && profile) setAdmin(profile);
      setLoading(false);
    }
    void fetchProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login?role=admin";
  };

  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-16 left-0 right-0 z-20 flex h-14 sm:h-16 items-center justify-between border-b border-[#c5924d]/30 bg-gradient-to-r from-[#102232] via-[#173247] to-[#122434] text-white shadow-[0_4px_20px_rgba(16,34,50,0.18)] transition-all duration-300 px-3 sm:px-4 md:px-6">
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 mr-2">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="rounded-xl p-1.5 text-[#f4ebd9] hover:bg-white/10 hover:text-[#f4b35f] border border-white/10 focus:outline-none lg:hidden cursor-pointer transition-colors shrink-0"
            aria-label="Toggle navigation menu"
          >
            <Menu className="h-5 w-5 shrink-0" />
          </button>
        )}
        <h1 className="font-display text-sm sm:text-xl md:text-2xl font-bold tracking-wide text-[#fbf6ec] mb-0 truncate flex items-center gap-1.5 sm:gap-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] min-w-0">
          <span className="truncate">{t("Discover Nashik Admin")}</span>
          <span className="hidden sm:inline-flex items-center rounded-full bg-[#c5924d]/20 px-2.5 py-0.5 text-[10px] font-sans font-extrabold uppercase tracking-widest text-[#f4b35f] border border-[#c5924d]/40 shrink-0">
            Portal
          </span>
        </h1>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-[#f4b35f]" />
        ) : (
          <div className="relative" ref={containerRef}>
            <button
              onClick={toggleMenu}
              className="flex items-center gap-1.5 sm:gap-2 rounded-xl bg-white/10 hover:bg-white/15 px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold text-[#fbf6ec] border border-[#c5924d]/40 transition-all cursor-pointer backdrop-blur-sm shrink-0"
            >
              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#f4b35f] shrink-0" />
              <span className="hidden sm:inline">{admin?.name || t("Admin Account")}</span>
              <span className="sm:hidden text-xs">{t("Account")}</span>
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 mt-2 w-48 sm:w-52 overflow-hidden rounded-xl border border-[#c5924d]/40 bg-[#132636] p-1.5 shadow-2xl z-50 divide-y divide-white/10 backdrop-blur-xl"
                id="admin-header-dropdown"
              >
                {admin?.email && (
                  <div className="px-3 py-1.5 text-[11px] font-medium text-[#f4b35f]/90 truncate mb-1">
                    {admin.email}
                  </div>
                )}
                <div className="pt-1 space-y-0.5">
                  <Link
                    href="/admin/profile"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium text-[#e2e8f0] hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <User className="h-4 w-4 text-[#f4b35f]" />
                    {t("Profile")}
                  </Link>
                  <Link
                    href="/admin/settings"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium text-[#e2e8f0] hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <Settings className="h-4 w-4 text-[#f4b35f]" />
                    {t("Settings")}
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 text-left rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-colors mt-1"
                  >
                    <LogOut className="h-4 w-4 text-red-400" />
                    {t("Logout")}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}



