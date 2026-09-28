import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nashik Kumbh Mela 2027 Locations | Discover Nashik",
  description: "Explore important Nashik Kumbh Mela locations, pilgrimage sites and key places visitors may want to know about.",
};

export default function KumbhLocationsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
