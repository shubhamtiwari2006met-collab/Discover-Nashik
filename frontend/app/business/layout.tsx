import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "List Your Business on Discover Nashik",
  description: "Learn how eligible Nashik businesses can submit their place for consideration on the Discover Nashik platform.",
};

export default function BusinessPortalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
