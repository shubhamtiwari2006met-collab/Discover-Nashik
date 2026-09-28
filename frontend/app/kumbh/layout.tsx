import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nashik Kumbh Mela 2027 | Visitor Guide | Discover Nashik",
  description: "Explore Nashik Kumbh Mela 2027 information, important locations, heritage, transport, planning resources and visitor services.",
};

export default function KumbhLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
