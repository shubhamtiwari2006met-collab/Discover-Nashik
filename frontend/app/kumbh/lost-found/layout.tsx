import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nashik Kumbh Mela 2027 Lost & Found | Discover Nashik",
  description: "Use Discover Nashik's public lost and found service to report or search for missing items and cases related to Kumbh Mela.",
};

export default function KumbhLostFoundLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
