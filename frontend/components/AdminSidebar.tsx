// components/AdminSidebar.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Building2, MapPin, Bell, Settings, Calendar, ShieldCheck, X, Navigation } from "lucide-react";

import { useTranslation } from "@/lib/i18n";

const getNavItems = (t: (key: string) => string) => [
  { href: "/admin/dashboard", label: t("Dashboard"), icon: <Home className="h-5 w-5" /> },
  { href: "/admin/places", label: t("Places Management"), icon: <MapPin className="h-5 w-5" /> },
  { href: "/admin/map-pois", label: t("Map POIs (Leaflet)"), icon: <Navigation className="h-5 w-5" /> },
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
          className="fixed inset-0 top-16 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 top-16 z-40 w-64 overflow-y-auto border-r border-[#c5924d]/30 bg-gradient-to-b from-[#102232] via-[#173247] to-[#0f1e2c] text-white shadow-[4px_0_20px_rgba(16,34,50,0.15)] p-4 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="mb-6 flex items-center justify-between pb-3 border-b border-white/10 lg:justify-center">
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-extrabold tracking-wide text-white">
              <span>Discover</span> <span className="text-[#e86f18]">Nashik</span>
            </span>
          </div>
          {/* Close button for mobile sidebar */}
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-[#f4ebd9] hover:bg-white/10 hover:text-[#f4b35f] border border-white/10 lg:hidden cursor-pointer transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (onClose) onClose();
                }}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-[#e86f18] to-[#c9580f] text-white shadow-md shadow-orange-950/30 border border-orange-400/30"
                    : "text-[#f4ebd9]/85 hover:bg-white/10 hover:text-white hover:translate-x-1"
                }`}
              >
                <span className={isActive ? "text-white" : "text-[#f4b35f]/90"}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        {/* Bottom illustration and mantra */}
        <div className="mt-12 text-center text-xs text-[#f4ebd9]/60 border-t border-white/10 pt-4">
          <p className="font-medium">Discover Nashik Administration</p>
          <div className="mt-3 h-16 bg-[url('/placeholder-nashik.svg')] bg-contain bg-center bg-no-repeat opacity-40" />
        </div>
      </aside>
    </>
  );
}
