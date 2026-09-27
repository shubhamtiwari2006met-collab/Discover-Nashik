// app/business/dashboard/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Business Dashboard - Discover Nashik",
  description: "Manage your business listing, offerings, timings, and performance on Discover Nashik.",
};

export default function BusinessDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8f2e8] text-[#192f42]">
      {children}
    </div>
  );
}
