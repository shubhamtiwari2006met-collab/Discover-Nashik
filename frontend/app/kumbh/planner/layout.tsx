import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Personalized Nashik Kumbh Mela Itinerary Planner | Day-Wise Pilgrim Guide",
  description: "Plan your sacred pilgrimage to Nashik Kumbh Mela 2027 with our intelligent travel planner. Optimized circuits for Panchavati, Trimbakeshwar, temple darshan timings, and Shahi Snan dates.",
  keywords: [
    "Kumbh Mela Trip Planner",
    "Nashik Pilgrimage Planner",
    "Kumbh 2027 Itinerary",
    "Trimbakeshwar Tour Plan",
    "Panchavati Darshan Schedule",
    "Nashik 3 day itinerary"
  ],
  alternates: {
    canonical: "https://discovernashik.co.in/kumbh/planner",
    languages: {
      "en-IN": "https://discovernashik.co.in/kumbh/planner",
      "hi-IN": "https://discovernashik.co.in/kumbh/planner",
      "mr-IN": "https://discovernashik.co.in/kumbh/planner",
    },
  },
  openGraph: {
    title: "Personalized Nashik Kumbh Mela Itinerary Planner 2027",
    description: "Generate customized day-wise pilgrimage itineraries for Nashik & Trimbakeshwar with darshan timings and Shahi Snan advisories.",
    url: "https://discovernashik.co.in/kumbh/planner",
    siteName: "Discover Nashik",
    locale: "en_IN",
    type: "website",
  },
};

export default function PlannerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
