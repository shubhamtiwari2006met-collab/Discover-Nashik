// components/BusinessSidebar.tsx
"use client";

import Link from "next/link";
import { X, Building2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export interface TabItem {
  id: string;
  label: string;
  icon: any;
}

interface BusinessSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  category?: string;
  tabs?: TabItem[];
  activeTab?: string;
  onSelectTab?: (tabId: string) => void;
}

export default function BusinessSidebar({
  isOpen,
  onClose,
  category = "Business",
  tabs = [],
  activeTab = "profile",
  onSelectTab
}: BusinessSidebarProps) {
  const { t } = useTranslation();

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

        <div className="mb-4 px-2 flex items-center justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#f4b35f]/90">
            {category} {t("Menu")}
          </span>
        </div>

        <nav className="space-y-1.5">
          {tabs.map((item) => {
            const Icon = item.icon || Building2;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (onSelectTab) onSelectTab(item.id);
                  if (onClose) onClose();
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 text-left cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-r from-[#e86f18] to-[#c9580f] text-white shadow-md shadow-orange-950/30 border border-orange-400/30"
                    : "text-[#f4ebd9]/85 hover:bg-white/10 hover:text-white hover:translate-x-1"
                }`}
              >
                <span className={isActive ? "text-white" : "text-[#f4b35f]/90"}>
                  <Icon className="h-4 w-4 shrink-0" />
                </span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom footer info */}
        <div className="mt-12 text-center text-xs text-[#f4ebd9]/60 border-t border-white/10 pt-4">
          <p className="font-medium">Discover Nashik Business</p>
          <div className="mt-3 h-16 bg-[url('/placeholder-nashik.svg')] bg-contain bg-center bg-no-repeat opacity-40" />
        </div>
      </aside>
    </>
  );
}
