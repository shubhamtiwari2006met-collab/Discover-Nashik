import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add a Place in Nashik | Discover Nashik",
  description: "Submit a Nashik place or attraction for consideration on Discover Nashik.",
};

export default function AddPlaceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
