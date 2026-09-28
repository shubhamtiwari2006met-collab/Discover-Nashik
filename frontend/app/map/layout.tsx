import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nashik Tourist Map | Places, Temples & Attractions",
  description: "Explore an interactive map of Nashik with tourist attractions, temples, hotels, transport locations and other places.",
};

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
