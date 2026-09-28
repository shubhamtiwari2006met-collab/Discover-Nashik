import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nashik Kumbh Mela 2027 Transport & Getting Around",
  description: "Find transportation and local travel information for visiting Nashik during Kumbh Mela 2027.",
};

export default function KumbhGettingAroundLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
