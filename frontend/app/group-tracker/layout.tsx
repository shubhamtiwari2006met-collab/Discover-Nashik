import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nashik Group Tracker & Location Coordination | Discover Nashik",
  description: "Coordinate location sharing and group tracking for family and pilgrims visiting Nashik.",
};

export default function GroupTrackerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
