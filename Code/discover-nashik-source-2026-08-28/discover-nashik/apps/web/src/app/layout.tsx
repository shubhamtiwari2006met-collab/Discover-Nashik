import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Discover Nashik | Places, Pilgrimage & Kumbh Guide",
  description: "A trustworthy, map-first guide to Nashik for pilgrims, tourists, and local explorers."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
