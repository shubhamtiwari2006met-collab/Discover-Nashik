// components/AdminSidebar.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Building2, MapPin, Bell, Settings, Calendar, ShieldCheck, X } from "lucide-react";

import { useTranslation } from "@/lib/i18n";

const getNavItems = (t: (key: string) => string) => [
  { href: "/admin/dashboard", label: t("Dashboard"), icon: <Home className="h-5 w-5" /> },
  { href: "/admin/places", label: t("Places Management"), icon: <MapPin className="h-5 w-5" /> },
  { href: "/admin/businesses", label: t("Business Management"), icon: <Building2 className="h-5 w-5" /> },
  { href: "/admin/kumbh", label: t("Kumbh 2027 Management"), icon: <Calendar className="h-5 w-5" /> },
  { href: "/admin/users", label: t("Users"), icon: <Users className="h-5 w-5" /> },
  { href: "/admin/notifications", label: t("Notifications"), icon: <Bell className="h-5 w-5" /> },
  { href: "/admin/settings", label: t("Settings"), icon: <Settings className="h-5 w-5" /> },
];

export default function AdminSidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const navItems = getNavItems(t);
  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 top-16 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 top-16 z-40 w-64 overflow-y-auto border-r border-[#d8c4a3] bg-[#3b2c24] bg-gradient-to-b from-[#4a382e] to-[#3b2c24] shadow-xl p-4 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="mb-6 flex items-center justify-between lg:justify-center">
          <span className="text-xl font-bold text-[#e86f18]">Discover Nashik</span>
          {/* Close button for mobile sidebar */}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-[#fffdf8] hover:bg-[#6b5244] lg:hidden cursor-pointer"
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                if (onClose) onClose();
              }}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                pathname === item.href ? "bg-[#e86f18] text-white" : "text-[#fffdf8] hover:bg-[#6b5244]"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
        {/* Bottom illustration and mantra */}
        <div className="mt-12 text-center text-xs text-[#fffdf8] opacity-70">
          <p></p>
          {/* Placeholder for subtle illustration – could be an SVG background */}
          <div className="mt-2 h-20 bg-[url('/placeholder-nashik.svg')] bg-contain bg-center bg-no-repeat" />
        </div>
      </aside>
    </>
  );
}
