// components/AdminHeader.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell, Loader2, LogOut, User, PlusCircle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useTranslation } from "@/lib/i18n";
import { AddPlaceModal } from "./AddPlaceModal";

export default function AdminHeader() {
  const supabase = createClient();
  const { t } = useTranslation();
  const [admin, setAdmin] = useState<{ name?: string; email?: string } | null>(null);
  const [notifications, setNotifications] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isAddPlaceOpen, setIsAddPlaceOpen] = useState(false);

  // Load admin profile & notifications count
  useEffect(() => {
    async function fetchProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("name,email")
        .eq("id", session.user.id)
        .maybeSingle();
      if (!error && profile) setAdmin(profile);
    }
    async function fetchNotifications() {
      // Assuming a table "admin_notifications" with a boolean "read" column
      const { data, error } = await supabase
        .from("admin_notifications")
        .select("id", { count: "exact", head: true });
      if (!error && data) setNotifications(data.length);
    }
    void fetchProfile();
    void fetchNotifications();
    setLoading(false);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login?role=admin";
  };

  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#admin-header-dropdown') && !target.closest('#admin-header-button')) {
        closeMenu();
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-16 left-0 right-0 z-40 flex h-16 items-center justify-between border-b border-[#d8c4a3] bg-[#fffdf8]/95 backdrop-blur-md shadow-[0_3px_18px_rgba(74,55,31,0.08)] transition-colors duration-300 px-4">
      <div className="flex items-center w-full justify-between pr-4">
        <h1 className="text-xl font-semibold text-[#173247] mb-0">{t("Discover Nashik Admin")}</h1>
        <Link
          href="/admin/add-place"
          className="flex items-center gap-1.5 rounded-xl bg-[#e86f18] px-3.5 py-1.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-[#c9580f] transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title="Add a new place to Discover Nashik"
        >
          <PlusCircle className="h-4 w-4" />
          <span>{t("Add Place")}</span>
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <button
          className="relative rounded-full p-2 hover:bg-[#e86f18]/10"
          title="Notifications"
        >
          <Bell className="h-5 w-5 text-[#173247]" />
          {notifications > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#e86f18] text-xs font-bold text-white">
              {notifications}
            </span>
          )}
        </button>
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-[#173247]" />
        ) : (
          <div className="relative" id="admin-header-button">
            <button
              onClick={toggleMenu}
              className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm hover:bg-[#e86f18]/10 border border-[#d8c4a3]"
            >
              <User className="h-4 w-4 text-[#173247]" />
              <span className="text-[#173247]">{t("Admin Account")}</span>
            </button>
            {menuOpen && <div className="absolute right-0 mt-2 w-48 rounded-md border border-[#d8c4a3] bg-[#fffdf8]/95 backdrop-blur-md shadow-lg z-50" id="admin-header-dropdown">
                <Link href="/admin/profile" className="block px-4 py-2 text-sm text-[#173247] hover:bg-[#e86f18]/10">
                  {t("Profile")}
                </Link>
                <Link href="/admin/settings" className="block px-4 py-2 text-sm text-[#173247] hover:bg-[#e86f18]/10">
                  {t("Settings")}
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-[#173247] hover:bg-[#e86f18]/10"
                >
                  <LogOut className="inline-block h-4 w-4 mr-1" /> {t("Logout")}
                </button>
              </div>
            }
          </div>
        )}
      </div>
    </header>
  );
}

