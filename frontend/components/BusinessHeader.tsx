"use client";

import Link from "next/link";
import { LogOut, Building2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function BusinessHeader() {
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login?role=business";
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[#d8c4a3] bg-[#fffdf8]/95 px-6 shadow-sm backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-[#e86f18]">
          <Building2 className="h-5 w-5" />
        </div>
        <h1 className="text-lg font-bold text-[#173247]">Business Portal</h1>
      </div>

      <button
        onClick={handleLogout}
        className="flex items-center gap-2 rounded-xl border border-[#d8c4a3] bg-white px-3 py-2 text-xs font-bold text-[#667883] transition-colors hover:bg-red-50 hover:text-red-600"
      >
        <LogOut className="h-4 w-4" /> Sign Out
      </button>
    </header>
  );
}
