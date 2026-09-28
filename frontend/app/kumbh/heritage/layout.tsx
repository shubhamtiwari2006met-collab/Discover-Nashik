import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nashik Kumbh Mela Heritage & History | Discover Nashik",
  description: "Learn about Nashik's sacred heritage, Panchavati, the Godavari and the historical significance connected with Kumbh Mela.",
};

export default function KumbhHeritageLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
