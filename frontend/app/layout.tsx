import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Discover Nashik",
  description: "One platform to discover everything Nashik has to offer. Find temples, food, hotels, nature, and plan your Kumbh Mela 2027 visit.",
};

import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { ChatbotWidget } from "@/components/ChatbotWidget";
import { I18nProvider } from "@/lib/i18n";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#f8f2e8] text-[#192f42] selection:bg-orange-500/30">
        <I18nProvider>
          <NavBar />
          <main className="flex-1 pt-16">{children}</main>
          <Footer />
          <ChatbotWidget />
        </I18nProvider>
      </body>
    </html>
  );
}
