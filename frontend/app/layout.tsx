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
  metadataBase: new URL("https://discovernashik.co.in"),
  title: "Discover Nashik | Nashik Travel & Tourism Guide",
  description: "Explore Nashik's temples, tourist places, food, hotels, nature, vineyards and Kumbh Mela 2027 information with Discover Nashik.",
  alternates: {
    canonical: "./",
  },
  openGraph: {
    title: "Discover Nashik | Nashik Travel & Tourism Guide",
    description: "Explore Nashik's temples, tourist places, food, hotels, nature, vineyards and Kumbh Mela 2027 information with Discover Nashik.",
    url: "https://discovernashik.co.in",
    siteName: "Discover Nashik",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://discovernashik.co.in/images/nashik-hero.webp",
        width: 1200,
        height: 630,
        alt: "Discover Nashik - Official Travel Guide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Discover Nashik | Nashik Travel & Tourism Guide",
    description: "Explore Nashik's temples, tourist places, food, hotels, nature, vineyards and Kumbh Mela 2027 information with Discover Nashik.",
    images: ["https://discovernashik.co.in/images/nashik-hero.webp"],
  },
};

import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { ChatbotWidget } from "@/components/ChatbotWidget";
import { I18nProvider } from "@/lib/i18n";

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://discovernashik.co.in/#website",
      "url": "https://discovernashik.co.in",
      "name": "Discover Nashik",
      "description": "Explore Nashik's temples, tourist places, food, hotels, nature, vineyards and Kumbh Mela 2027 information with Discover Nashik.",
      "publisher": { "@id": "https://discovernashik.co.in/#organization" },
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://discovernashik.co.in/search?query={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@type": "Organization",
      "@id": "https://discovernashik.co.in/#organization",
      "name": "Discover Nashik",
      "url": "https://discovernashik.co.in",
      "logo": "https://discovernashik.co.in/images/nashik-hero.webp"
    }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable} h-full antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
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
