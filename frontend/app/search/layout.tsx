import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search Nashik Places, Temples, Hotels & Restaurants",
  description: "Find places to visit in Nashik including temples, attractions, hotels, restaurants, food spots and other local destinations.",
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
