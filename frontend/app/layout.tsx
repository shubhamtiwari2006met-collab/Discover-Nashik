import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Inter, Cormorant_Garamond } from "next/font/google";
import { isLanguage } from "@/lib/locale";
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
  title: {
    default: "Discover Nashik | Official Nashik Travel & Kumbh Mela 2027 Guide",
    template: "%s | Discover Nashik"
  },
  description: "Official guide to Nashik tourism, sacred temples, Trimbakeshwar Jyotirlinga, sightseeing, hotels, and the upcoming Nashik Simhastha Kumbh Mela 2027.",
  keywords: [
    "Nashik",
    "Discover Nashik",
    "Nashik Kumbh Mela 2027",
    "Kumbh Mela Nashik",
    "Trimbakeshwar Temple",
    "Panchavati Nashik",
    "Places to visit in Nashik",
    "Nashik Tourism",
    "Temples in Nashik",
    "Maharashtra Pilgrimage"
  ],
  alternates: {
    canonical: "https://discovernashik.co.in",
    languages: {
      "en-IN": "https://discovernashik.co.in",
      "hi-IN": "https://discovernashik.co.in",
      "mr-IN": "https://discovernashik.co.in"
    }
  },
  openGraph: {
    title: "Discover Nashik | Official Nashik Travel & Kumbh Mela 2027 Guide",
    description: "Explore Nashik's sacred temples, Trimbakeshwar Jyotirlinga, tourist places, food, hotels, nature, vineyards and Kumbh Mela 2027 information.",
    url: "https://discovernashik.co.in",
    siteName: "Discover Nashik",
    locale: "en_IN",
    alternateLocale: ["hi_IN", "mr_IN"],
    type: "website",
    images: [
      {
        url: "https://discovernashik.co.in/images/nashik-hero.webp",
        width: 1200,
        height: 630,
        alt: "Discover Nashik - Digital Tourism and Kumbh Mela 2027 Guide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Discover Nashik | Official Nashik Travel & Kumbh Mela 2027 Guide",
    description: "Explore Nashik's sacred temples, Trimbakeshwar Jyotirlinga, tourist places, food, hotels, and Kumbh Mela 2027.",
    images: ["https://discovernashik.co.in/images/nashik-hero.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { ChatbotWidget } from "@/components/ChatbotWidget";
import { UserAuthModal } from "@/components/UserAuthModal";
import { I18nProvider } from "@/lib/i18n";
import { UserAuthProvider } from "@/context/UserAuthContext";

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://discovernashik.co.in/#website",
      "url": "https://discovernashik.co.in",
      "name": "Discover Nashik",
      "description": "Comprehensive guide to Nashik tourism, sacred temples, Trimbakeshwar Jyotirlinga, sightseeing, hotels, and Kumbh Mela 2027.",
      "publisher": { "@id": "https://discovernashik.co.in/#organization" },
      "inLanguage": ["en-IN", "hi-IN", "mr-IN"],
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
      "logo": "https://discovernashik.co.in/images/nashik-hero.webp",
      "sameAs": [
        "https://www.facebook.com/discovernashik",
        "https://www.instagram.com/discovernashik",
        "https://twitter.com/discovernashik"
      ]
    },
    {
      "@type": "TouristDestination",
      "@id": "https://discovernashik.co.in/#destination",
      "name": "Nashik",
      "description": "Sacred pilgrimage and tourist city in Maharashtra, India. Home to the Godavari river, Trimbakeshwar Jyotirlinga, Panchavati, and host of the Simhastha Kumbh Mela.",
      "url": "https://discovernashik.co.in",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Nashik",
        "addressRegion": "Maharashtra",
        "addressCountry": "IN"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 20.0063,
        "longitude": 73.7915
      }
    }
  ]
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const languageValue = cookieStore.get("discover-nashik-language")?.value;
  const language = isLanguage(languageValue) ? languageValue : "en";

  return (
    <html lang={language} className={`${inter.variable} ${cormorant.variable} h-full antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-white text-[#192f42] selection:bg-orange-500/30">
        <I18nProvider initialLanguage={language}>
          <UserAuthProvider>
            <NavBar />
            <div className="flex-grow">{children}</div>
            <Footer />
            <ChatbotWidget />
            <UserAuthModal />
          </UserAuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
