import type { Metadata } from "next";
import Link from "next/link";
import {
  MapPin,
  Clock,
  Compass,
  ArrowRight,
  Sparkles,
  Building,
  Home,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Phone,
  Bed,
  Layers,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Where to Stay in Nashik for Kumbh Mela 2027 | Hotels, Dharamshalas & Tents",
  description:
    "Authoritative guide on where to stay in Nashik and Trimbakeshwar during Kumbh Mela 2027. Review best pilgrim areas: Panchavati, Nashik Road, Gangapur, and Trimbak with booking tips.",
  keywords: [
    "Hotels in Nashik",
    "Hotels near Trimbakeshwar",
    "Where to stay in Nashik Kumbh Mela",
    "Dharamshalas in Nashik",
    "Accommodation near Nashik Kumbh Mela",
    "Budget hotels in Panchavati",
    "Nashik Road railway station hotels",
    "Trimbakeshwar ashram booking",
    "Kumbh Mela tent city Nashik",
    "Pilgrim facilities Nashik 2027",
  ],
  alternates: {
    canonical: "https://discovernashik.co.in/kumbh/accommodation",
    languages: {
      "en-IN": "https://discovernashik.co.in/kumbh/accommodation",
      "hi-IN": "https://discovernashik.co.in/kumbh/accommodation",
      "mr-IN": "https://discovernashik.co.in/kumbh/accommodation",
    },
  },
  openGraph: {
    title: "Where to Stay in Nashik for Kumbh Mela 2027 | Complete Accommodation Guide",
    description:
      "Find the best accommodation in Nashik and Trimbakeshwar: verified hotels, traditional dharamshalas, ashrams, and official Kumbh tent cities.",
    url: "https://discovernashik.co.in/kumbh/accommodation",
    siteName: "Discover Nashik",
    locale: "en_IN",
    type: "article",
    images: [
      {
        url: "https://discovernashik.co.in/images/nashik-hero.webp",
        width: 1200,
        height: 630,
        alt: "Nashik Kumbh Mela Accommodation and Hotels Guide",
      },
    ],
  },
};

const stayZones = [
  {
    name: "Zone 1: Panchavati & Godavari Riverfront",
    category: "Heritage & Pilgrim Stays",
    bestFor: "Devotees seeking daily morning Ram Kund snan, elderly pilgrims",
    highlights: "Walking distance to Ram Kund, Kalaram Temple, Sita Gufa, and evening Ganga Aarti.",
    pricing: "Budget to Mid-Range (₹800 – ₹3,500 / night)",
    pros: "Zero travel commute to sacred bathing ghats and Panchavati temples.",
    cons: "Vehicular access restricted during festival dates; narrow alleys.",
    stayTypes: "Traditional Dharamshalas, Pilgrim Bhawan, Community Sansthan Lodges, Budget Hotels.",
  },
  {
    name: "Zone 2: Nashik Road (Near Railway Station)",
    category: "Transit & Family Convenience",
    bestFor: "Train travelers, short-stay pilgrims, multi-generational families",
    highlights: "Immediate access to Nashik Road Railway Station (Central Railway), Muktidham Temple, and direct bus depots.",
    pricing: "Budget to 3-Star (₹1,200 – ₹5,000 / night)",
    pros: "Hassle-free train transit; 24/7 dining options; wide roads.",
    cons: "Located 9 km from Ram Kund ghats (approx. 20–25 minutes via city bus or auto).",
    stayTypes: "Business Hotels, Family Lodges, Dharamshalas near Muktidham.",
  },
  {
    name: "Zone 3: Gangapur Road & Govind Nagar (City Center)",
    category: "Modern Comfort & Luxury",
    bestFor: "Pilgrims preferring star hotels, premium dining, and quiet evenings",
    highlights: "Modern urban infrastructure, fine dining restaurants, shopping malls, and proximity to Someshwar Temple.",
    pricing: "Mid-Range to 5-Star Luxury (₹3,500 – ₹15,000 / night)",
    pros: "Spacious hotels, valet parking, reliable high-speed Wi-Fi, premium hygiene standards.",
    cons: "Higher tariffs; 15–20 minutes drive to Ram Kund ghats.",
    stayTypes: "Luxury Star Hotels, Serviced Boutique Apartments, Vineyard Resorts.",
  },
  {
    name: "Zone 4: Trimbakeshwar Town",
    category: "Jyotirlinga Vicinity",
    bestFor: "Shaivite devotees, ritual participants (Narayan Nagbali, Kalsarpa), Kushavarta bathers",
    highlights: "Walking distance to Shree Trimbakeshwar Temple, Kushavarta Kund, and Brahmagiri foothills.",
    pricing: "Budget Ashrams to 3-Star Resorts (₹1,000 – ₹6,000 / night)",
    pros: "Ideal for 4:00 AM Brahmamuhurta snan and scheduled Vedic poojas.",
    cons: "Heavy demand; town fills up rapidly months before Shahi Snan dates.",
    stayTypes: "Trust Dharamshalas, Vedic Ashrams, Math Guest Houses, Boutique Holy Resorts.",
  },
  {
    name: "Zone 5: Kumbh Mela Official Tent Cities & Satellite Camps",
    category: "Temporary Pilgrim Infrastructure",
    bestFor: "Mass gatherings, backpackers, spiritual tour groups",
    highlights: "Government and authorized private luxury glamping tents erected along ring road bypasses.",
    pricing: "Subsidized to Luxury Glamping (₹500 – ₹8,000 / night)",
    pros: "Direct dedicated MSRTC feeder shuttle buses to ghat zones; high security.",
    cons: "Seasonal setups operating primarily during official Kumbh Mela months.",
    stayTypes: "Subsidized Community Swiss Tents, VIP Deluxe Cottages, Group Dormitories.",
  },
];

const faqs = [
  {
    question: "When should I book hotels for Nashik Kumbh Mela 2027?",
    answer:
      "We strongly advise booking your hotel or dharamshala accommodation at least 6 to 12 months in advance, especially for high-demand Shahi Snan dates. Accommodation within Panchavati and Trimbakeshwar fills up earliest.",
  },
  {
    question: "Are dharamshalas available near Ram Kund and Trimbakeshwar?",
    answer:
      "Yes. Panchavati features numerous historical dharamshalas including Maheshwari Bhawan, Gujarati Samaj Bhawan, and Jain Sansthan guest houses. Trimbakeshwar also hosts community-run mutts and ashrams providing simple, clean lodging with vegetarian meals.",
  },
  {
    question: "Which area is best to stay in Nashik for elderly pilgrims?",
    answer:
      "For elderly pilgrims focused on daily holy baths and darshan, Panchavati is ideal as it eliminates vehicle traffic delays. However, ensure the property has ground-floor rooms or lift access. For enhanced comfort with modern accessibility, hotels on Gangapur Road or Nashik Road are recommended.",
  },
  {
    question: "How can I verify if an accommodation listing is genuine?",
    answer:
      "Always check if the property is verified by local tourism authorities or listed on verified platforms such as Discover Nashik. Never transfer advance funds to unverified personal bank accounts via unverified social media adverts.",
  },
];

export default function KumbhAccommodationPage() {
  const schemaBreadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://discovernashik.co.in",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Kumbh Mela Guide",
        item: "https://discovernashik.co.in/kumbh",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Accommodation",
        item: "https://discovernashik.co.in/kumbh/accommodation",
      },
    ],
  };

  const schemaItemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Nashik Kumbh Mela Accommodation Zones",
    description: "Overview of key pilgrim accommodation regions in Nashik and Trimbakeshwar.",
    itemListElement: stayZones.map((zone, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: zone.name,
      description: `${zone.category} - ${zone.bestFor}`,
    })),
  };

  const schemaFaq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaBreadcrumbs) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaItemList) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaFaq) }}
      />

      <div className="min-h-screen bg-[#fcfaf7] text-[#192f42]">
        {/* Breadcrumb Bar */}
        <nav
          aria-label="Breadcrumb navigation"
          className="border-b border-orange-100 bg-[#f8f2e8]/80 py-3 text-xs sm:text-sm text-[#5d7182]"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link
                  href="/"
                  className="font-medium hover:text-[#e86f18] transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link
                  href="/kumbh"
                  className="font-medium hover:text-[#e86f18] transition-colors"
                >
                  Kumbh Mela Guide
                </Link>
              </li>
              <li>/</li>
              <li
                className="font-semibold text-[#102232]"
                aria-current="page"
              >
                Where to Stay
              </li>
            </ol>
          </div>
        </nav>

        {/* Hero Header */}
        <header className="relative overflow-hidden bg-gradient-to-b from-[#102232] via-[#173247] to-[#102232] py-14 sm:py-20 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(#e86f18_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/40 bg-orange-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#f4b35f]">
              <Sparkles className="h-3.5 w-3.5" />
              Kumbh Mela 2027 Stay & Logistics Guide
            </div>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl text-white">
              Where to Stay in Nashik for Kumbh Mela 2027
            </h1>
            <p className="mt-4 max-w-3xl text-base sm:text-lg text-[#f4ebd9]/90 leading-relaxed">
              Find verified <strong>hotels in Nashik</strong>, traditional <strong>pilgrim dharamshalas</strong> in Panchavati, ashrams near <strong>Trimbakeshwar Jyotirlinga</strong>, and official tent cities with honest pros, cons, and booking advice.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/business"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#e86f18] to-[#c9580f] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-950/30 transition hover:brightness-110"
              >
                <Building className="h-4 w-4" />
                Browse Registered Hotels & Stays
              </Link>
              <Link
                href="/kumbh/planner"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
              >
                Plan Itinerary by Stay Area
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </header>

        {/* Advisory Strip */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-5 shadow-sm backdrop-blur">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="rounded-xl bg-[#e86f18] p-2.5 text-white shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="text-xs sm:text-sm text-amber-950">
                <span className="font-bold">Official Booking Advisory:</span> Demand spikes up to 400% during the royal bathing (Shahi Snan) windows. Confirm your stay only with registered hotels and accredited pilgrim bhawans. Discover Nashik enables you to verify listings directly through our certified business directory.
              </div>
            </div>
          </div>
        </section>

        {/* Main Accommodation Zones */}
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between pb-6 border-b border-orange-100">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-[#102232] sm:text-3xl">
                Best Neighborhoods to Stay in Nashik
              </h2>
              <p className="mt-1 text-sm text-[#5d7182]">
                Choose your ideal base depending on proximity to ghats, transportation, and budget
              </p>
            </div>
            <span className="hidden sm:inline-block rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-[#e86f18]">
              5 Geographic Zones
            </span>
          </div>

          <div className="mt-8 space-y-8">
            {stayZones.map((zone, idx) => (
              <article
                key={idx}
                className="rounded-3xl border border-orange-100 bg-white p-6 sm:p-8 shadow-sm transition hover:shadow-md"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-orange-600/10 px-2.5 py-1 text-xs font-bold text-[#e86f18]">
                        Zone {idx + 1}
                      </span>
                      <span className="rounded-lg bg-[#102232]/5 px-2.5 py-1 text-xs font-semibold text-[#173247]">
                        {zone.category}
                      </span>
                      <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                        {zone.pricing}
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-bold text-[#102232]">
                      {zone.name}
                    </h3>

                    <p className="text-sm font-medium text-[#e86f18]">
                      <strong>Ideal for:</strong> {zone.bestFor}
                    </p>

                    <p className="text-sm text-[#334e68] leading-relaxed">
                      {zone.highlights}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs sm:text-sm">
                      <div className="rounded-xl bg-emerald-50/60 p-3 text-emerald-950">
                        <span className="font-bold text-emerald-800">✅ Advantages: </span>
                        <span>{zone.pros}</span>
                      </div>
                      <div className="rounded-xl bg-amber-50/60 p-3 text-amber-950">
                        <span className="font-bold text-amber-800">⚠️ Considerations: </span>
                        <span>{zone.cons}</span>
                      </div>
                    </div>

                    <div className="text-xs text-[#5d7182] pt-1">
                      <span className="font-bold text-[#102232]">Available Options: </span>
                      {zone.stayTypes}
                    </div>
                  </div>

                  <div className="lg:w-56 shrink-0 flex flex-col justify-center gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-orange-100 lg:pl-6">
                    <Link
                      href="/business"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#102232] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white transition hover:bg-[#e86f18]"
                    >
                      Browse Stays in Zone
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <Link
                      href="/kumbh/planner"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#192f42] hover:bg-orange-50/50"
                    >
                      Build Route from Here
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Booking Tips for Pilgrims */}
          <section className="mt-16 rounded-3xl border border-orange-200/80 bg-gradient-to-br from-[#fffdf9] to-[#f8f2e8] p-6 sm:p-10">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#e86f18]">
              Expert Pilgrim Advice
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#102232] sm:text-3xl">
              Essential Accommodation Checklist for Kumbh 2027
            </h2>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-[#334e68]">
              <div className="rounded-2xl bg-white p-5 shadow-sm border border-orange-100 space-y-2">
                <h4 className="font-bold text-[#102232] text-base">1. Check Vehicle Drop-Off Zones</h4>
                <p className="text-xs leading-relaxed text-[#5d7182]">
                  During peak snan dates, private vehicles will not be allowed inside the Panchavati core perimeter. If your hotel is in Panchavati, you may need to walk the last 500 meters or take an e-rickshaw from the outer cordon.
                </p>
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-sm border border-orange-100 space-y-2">
                <h4 className="font-bold text-[#102232] text-base">2. Confirm Hot Water & Power Backup</h4>
                <p className="text-xs leading-relaxed text-[#5d7182]">
                  Holy bath schedules begin as early as 04:00 AM before dawn. When booking smaller lodges or dharamshalas, confirm whether they provide 24-hour hot water and inverter power backup.
                </p>
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-sm border border-orange-100 space-y-2">
                <h4 className="font-bold text-[#102232] text-base">3. Pure Vegetarian Dining</h4>
                <p className="text-xs leading-relaxed text-[#5d7182]">
                  Panchavati and Trimbakeshwar strictly adhere to holy vegetarian dining. If your family requires Jain (no onion/garlic) or satvik meals, look for accommodations offering dedicated in-house bhojanalayas.
                </p>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="mt-16">
            <h3 className="text-xl sm:text-2xl font-bold text-[#102232]">
              Frequently Asked Questions About Nashik Accommodation
            </h3>
            <div className="mt-6 space-y-4">
              {faqs.map((faq, fIdx) => (
                <div
                  key={fIdx}
                  className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm"
                >
                  <h4 className="text-base font-bold text-[#102232]">
                    {faq.question}
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed text-[#334e68]">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Bottom CTA */}
          <section className="mt-16 rounded-3xl bg-gradient-to-r from-[#102232] to-[#173247] p-8 text-center text-white">
            <h2 className="text-2xl sm:text-3xl font-extrabold">
              Are you a Hotel, Ashram, or Homestay Host in Nashik?
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-[#f4ebd9]/85">
              Register your accommodation on Discover Nashik to reach millions of pilgrims and tourists looking for verified stays.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/business/register"
                className="rounded-xl bg-[#e86f18] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#c9580f]"
              >
                Register Your Property
              </Link>
              <Link
                href="/business"
                className="rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/20"
              >
                Explore All Stays
              </Link>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
