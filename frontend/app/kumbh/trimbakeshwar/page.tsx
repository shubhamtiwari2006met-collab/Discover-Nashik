import type { Metadata } from "next";
import Link from "next/link";
import {
  MapPin,
  Clock,
  Compass,
  ArrowRight,
  Sparkles,
  Calendar,
  Shield,
  Layers,
  Info,
  Waves,
  Mountain,
  FileText,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Trimbakeshwar Kumbh Mela 2027 Guide | Jyotirlinga, Kushavarta & Rituals",
  description:
    "Complete pilgrimage guide to Trimbakeshwar for Simhastha Kumbh Mela 2027. Details on Jyotirlinga darshan, Kushavarta Shahi Snan, poojas, timings, and travel from Nashik.",
  keywords: [
    "Kumbh Mela Trimbakeshwar",
    "Trimbakeshwar Jyotirlinga",
    "Trimbakeshwar temple timings",
    "Kushavarta Kund holy bath",
    "Trimbakeshwar Kumbh guide",
    "Shahi Snan Trimbakeshwar",
    "Narayan Nagbali Trimbakeshwar",
    "Kalsarpa Shanti Trimbakeshwar",
    "Brahmagiri trek Godavari",
    "How to reach Trimbakeshwar from Nashik",
  ],
  alternates: {
    canonical: "https://discovernashik.co.in/kumbh/trimbakeshwar",
    languages: {
      "en-IN": "https://discovernashik.co.in/kumbh/trimbakeshwar",
      "hi-IN": "https://discovernashik.co.in/kumbh/trimbakeshwar",
      "mr-IN": "https://discovernashik.co.in/kumbh/trimbakeshwar",
    },
  },
  openGraph: {
    title: "Trimbakeshwar Kumbh Mela 2027 Guide | Jyotirlinga & Shahi Snan",
    description:
      "Essential pilgrim handbook for Trimbakeshwar Jyotirlinga during Simhastha Kumbh Mela 2027: Kushavarta sacred bath, darshan queues, ritual poojas, and transit routes.",
    url: "https://discovernashik.co.in/kumbh/trimbakeshwar",
    siteName: "Discover Nashik",
    locale: "en_IN",
    type: "article",
    images: [
      {
        url: "https://discovernashik.co.in/images/nashik-hero.webp",
        width: 1200,
        height: 630,
        alt: "Trimbakeshwar Jyotirlinga Kumbh Mela Guide",
      },
    ],
  },
};

const keyRituals = [
  {
    name: "Kushavarta Kund Shahi Snan",
    type: "Sacred Bathing Ritual",
    time: "Brahmamuhurta (04:00 AM – 08:00 AM)",
    significance:
      "Kushavarta is the sacred pond where Sage Gautama bound the holy Godavari river using Kusha grass. During Kumbh Mela, it is the exclusive sanctum where the Shaivite Akhadas (Naga Sadhus and Mahants) lead the historic Shahi Snan.",
    guidelines:
      "Pilgrims should take their holy bath in designated pilgrim zones during Shahi Snan peak days, as the inner kund ghats are prioritized for Akhada sadhus.",
  },
  {
    name: "Narayan Nagbali Puja",
    type: "Ancestral & Karmic Ritual",
    time: "3-Day Ceremony (Requires advance priest appointment)",
    significance:
      "A unique Vedic ritual performed exclusively at Trimbakeshwar. It is prescribed for clearing Pitru Dosha (ancestral discontent) and Nag Dosha (accidental killing of serpents).",
    guidelines:
      "Performed by authorized Tamrapatradhari purohits at special Ahilya and Kushavarta pooja centers outside the main temple sanctum.",
  },
  {
    name: "Kalsarpa Yog Shanti",
    type: "Astrological Remedial Pooja",
    time: "1 Day (approx. 2 to 3 hours)",
    significance:
      "Performed to alleviate astrological imbalances when all planets are positioned between Rahu and Ketu in one's birth chart. Trimbakeshwar is acknowledged as the premier shrine in India for this rite.",
    guidelines:
      "Traditional white dhoti for men and cotton sarees for women are required. Only government-certified priests should be consulted.",
  },
  {
    name: "Rudrabhishek & Laghurudra",
    type: "Shiva Abhishek",
    time: "Early Morning (06:00 AM – 09:00 AM)",
    significance:
      "Consecration of the three-faced Jyotirlinga with Panchamrit, holy Godavari water, bilva leaves, and Vedic hymns. It represents the union of Brahma, Vishnu, and Shiva.",
    guidelines:
      "Must be booked in advance via the official Temple Trust portal or authorized counters.",
  },
];

const importantPlacesAround = [
  {
    id: "kushavarta_kund",
    name: "Kushavarta Holy Kund",
    distance: "350 meters from Temple",
    description:
      "The sanctified pond where River Godavari re-emerges after descending from Brahmagiri hill. Shahi Snan baths and morning tirth-snan take place here.",
  },
  {
    id: "brahmagiri_mountain",
    name: "Brahmagiri Mountain & Gangadwar",
    distance: "Base is 1 km from Temple (750 steps climb)",
    description:
      "The sacred peak where Lord Shiva appeared and Godavari was brought to earth. Pilgrims hike to Gangadwar and Kolambika shrine for breathtaking Sahyadri views.",
  },
  {
    id: "sant_nivruttinath_temple",
    name: "Sant Nivruttinath Samadhi Mandir",
    distance: "1.2 km from Main Temple",
    description:
      "The holy resting place of Sant Nivruttinath, elder brother and spiritual mentor of Sant Dnyaneshwar. An essential stop on the Varkari pilgrimage circuit.",
  },
  {
    id: "anjaneri_hills",
    name: "Anjaneri Hill (Lord Hanuman's Birthplace)",
    distance: "7 km towards Nashik",
    description:
      "Revered in Hindu epics as the birthplace of Lord Hanuman. Features ancient Jain and Hindu caves, a mountain lake, and a fortress plateau.",
  },
];

const faqs = [
  {
    question: "What is the role of Trimbakeshwar in Kumbh Mela 2027?",
    answer:
      "While Vaishnavite Akhadas celebrate Kumbh Mela at Ram Kund in Nashik city, the Shaivite Akhadas (including Juna, Niranjani, and Mahanirvani Akhadas) perform their royal Shahi Snan at Kushavarta Kund in Trimbakeshwar. It is one of the dual epicenters of the Simhastha Kumbh.",
  },
  {
    question: "How can pilgrims travel from Nashik city to Trimbakeshwar?",
    answer:
      "Trimbakeshwar is 28 km from central Nashik along NH 848. MSRTC operates non-stop shuttle buses from CBS Bus Stand every 10–15 minutes. During Kumbh Mela 2027, dedicated ring-road parking lots and electric feeder buses will connect satellite transit hubs directly with Trimbak.",
  },
  {
    question: "What are the daily darshan timings at Trimbakeshwar Temple?",
    answer:
      "The temple opens at 05:30 AM and closes at 09:00 PM. General queue darshan (Mukh Darshan) is continuous throughout the day. Sparsh Darshan and special Abhishek are strictly governed by trust rules and typically conclude by 12:00 PM.",
  },
  {
    question: "How do I book VIP darshan passes or pujas at Trimbakeshwar?",
    answer:
      "Devotees can book official paid VIP queue passes (approx. ₹200) via the Shree Trimbakeshwar Sansthan Trust official website or on-spot automated kiosks. Be cautious of unofficial touts on the street.",
  },
  {
    question: "Can elderly pilgrims climb the Brahmagiri Mountain?",
    answer:
      "The Brahmagiri hike requires climbing approximately 750 stone steps and takes 2 to 3 hours. While younger pilgrims and trekkers find it invigorating, elderly devotees can take blessings at Gangadwar or view the mountain from the foothill shrines.",
  },
];

export default function TrimbakeshwarKumbhPage() {
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
        name: "Trimbakeshwar",
        item: "https://discovernashik.co.in/kumbh/trimbakeshwar",
      },
    ],
  };

  const schemaEvent = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: "Nashik-Trimbakeshwar Simhastha Kumbh Mela 2027",
    startDate: "2027-08-01T04:00:00+05:30",
    endDate: "2027-09-30T22:00:00+05:30",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: "Trimbakeshwar Jyotirlinga & Kushavarta Kund",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Trimbakeshwar",
        addressLocality: "Nashik",
        addressRegion: "Maharashtra",
        postalCode: "422212",
        addressCountry: "IN",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: 19.9322,
        longitude: 73.5307,
      },
    },
    image: ["https://discovernashik.co.in/images/nashik-hero.webp"],
    description:
      "The sacred Simhastha Kumbh Mela gathering at Trimbakeshwar, featuring Shahi Snan at Kushavarta Kund by Shaivite Akhadas and Vedic rituals at the Jyotirlinga.",
    organizer: {
      "@type": "Organization",
      name: "Simhastha Kumbh Mela Authority & Trimbakeshwar Devasthan Trust",
      url: "https://discovernashik.co.in",
    },
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaEvent) }}
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
                Trimbakeshwar Kumbh 2027
              </li>
            </ol>
          </div>
        </nav>

        {/* Hero Section */}
        <header className="relative overflow-hidden bg-gradient-to-b from-[#102232] via-[#173247] to-[#102232] py-14 sm:py-20 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(#e86f18_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/40 bg-orange-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#f4b35f]">
              <Sparkles className="h-3.5 w-3.5" />
              Simhastha Kumbh Mela 2027 Headquarters
            </div>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl text-white">
              Trimbakeshwar Kumbh Mela Guide 2027
            </h1>
            <p className="mt-4 max-w-3xl text-base sm:text-lg text-[#f4ebd9]/90 leading-relaxed">
              Experience the epicenter of the <strong>Shaivite Simhastha Kumbh Mela</strong>. Complete guide to <strong>Trimbakeshwar Jyotirlinga</strong> darshan, <strong>Kushavarta Kund</strong> holy bathing protocols, Narayan Nagbali rituals, and travel advice for millions of visiting pilgrims.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/kumbh/planner"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#e86f18] to-[#c9580f] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-950/30 transition hover:brightness-110"
              >
                <Compass className="h-4 w-4" />
                Plan Trimbakeshwar Trip
              </Link>
              <Link
                href="/place/trimbakeshwar_temple"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
              >
                Temple Details & Timings
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </header>

        {/* Quick Facts Strip */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm text-center">
              <span className="text-xs uppercase font-bold text-[#5d7182]">Sanctum Type</span>
              <p className="mt-1 font-extrabold text-[#102232] text-sm sm:text-base">12 Jyotirlinga</p>
            </div>
            <div className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm text-center">
              <span className="text-xs uppercase font-bold text-[#5d7182]">Sacred Waterbody</span>
              <p className="mt-1 font-extrabold text-[#102232] text-sm sm:text-base">Kushavarta Kund</p>
            </div>
            <div className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm text-center">
              <span className="text-xs uppercase font-bold text-[#5d7182]">Distance from Nashik</span>
              <p className="mt-1 font-extrabold text-[#102232] text-sm sm:text-base">28 km (NH 848)</p>
            </div>
            <div className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm text-center">
              <span className="text-xs uppercase font-bold text-[#5d7182]">Daily Hours</span>
              <p className="mt-1 font-extrabold text-[#102232] text-sm sm:text-base">05:30 AM – 09:00 PM</p>
            </div>
          </div>
        </section>

        {/* Main Content Body */}
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          {/* Significance Breakdown */}
          <section className="space-y-6">
            <div className="max-w-3xl">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#e86f18]">
                Vedic Importance
              </span>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#102232] sm:text-3xl">
                Why Trimbakeshwar is Central to the Simhastha Kumbh
              </h2>
              <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#334e68]">
                The Nashik-Trimbakeshwar Kumbh Mela possesses a dual-city arrangement rooted in ancient tradition. When Jupiter enters the zodiac sign of Leo (Simha Rashi) and the Sun enters Cancer or Leo, celestial nectar falls into the holy Godavari.
              </p>
              <p className="mt-2 text-sm sm:text-base leading-relaxed text-[#334e68]">
                While the Vaishnavite sadhus (Bairagi Akhadas) hold their royal bath at Ram Kund in Nashik city, the Shaivite Akhadas gather exclusively at <strong>Trimbakeshwar</strong>. Thousands of Naga ascetics, Mahamandaleshwars, and pilgrims convene at Kushavarta Kund to take the sacred Shahi Snan dip.
              </p>
            </div>

            {/* Sacred Poojas & Rituals */}
            <div className="mt-10">
              <h3 className="text-xl sm:text-2xl font-bold text-[#102232]">
                Key Poojas & Sacred Rituals at Trimbakeshwar
              </h3>
              <p className="mt-1 text-sm text-[#5d7182]">
                Essential spiritual rituals performed exclusively by authorized purohits
              </p>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {keyRituals.map((ritual, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col justify-between rounded-3xl border border-orange-100 bg-white p-6 shadow-sm"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-[#e86f18]">
                          {ritual.type}
                        </span>
                        <span className="text-xs text-[#5d7182]">{ritual.time}</span>
                      </div>
                      <h4 className="text-lg font-bold text-[#102232]">
                        {ritual.name}
                      </h4>
                      <p className="text-sm text-[#334e68] leading-relaxed">
                        {ritual.significance}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-[#5d7182]">
                      <span className="font-bold text-[#102232]">Important: </span>
                      {ritual.guidelines}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Kushavarta Kund and Bathing Guidelines */}
            <section className="mt-12 rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50/70 to-white p-6 sm:p-10">
              <div className="flex flex-col lg:flex-row gap-8 items-start">
                <div className="space-y-4 flex-1">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-600/10 px-3 py-1 text-xs font-bold text-blue-800">
                    <Waves className="h-3.5 w-3.5 text-blue-600" />
                    Holy Tirth Snan
                  </div>
                  <h3 className="text-2xl font-bold text-[#102232]">
                    Kushavarta Kund: Protocol & Bathing Guide
                  </h3>
                  <p className="text-sm sm:text-base leading-relaxed text-[#334e68]">
                    Kushavarta Kund is recognized as the eternal origin pond of the Godavari. Constructed in its current stone step-well design by the Holkars, taking a holy dip here before entering the Jyotirlinga sanctum is believed to wash away lifetimes of sins.
                  </p>
                  <ul className="space-y-2 text-sm text-[#334e68]">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Dedicated changing rooms are provided near the southern steps of the kund.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Soaps, detergents, and plastic waste are strictly prohibited in the holy water.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>During peak Shahi Snan festival dates, access may be restricted to designated general pilgrim ghats.</span>
                    </li>
                  </ul>
                </div>
                <div className="lg:w-80 rounded-2xl bg-white border border-blue-100 p-5 shadow-sm text-xs space-y-3">
                  <div className="font-bold text-[#102232] text-sm">
                    Kushavarta Visiting Hours
                  </div>
                  <p className="text-[#5d7182]">
                    Open for general holy bath: <strong>05:00 AM – 08:30 PM</strong> daily.
                  </p>
                  <p className="text-[#5d7182]">
                    Morning Brahmamuhurta bath between <strong>05:00 AM – 06:30 AM</strong> offers the cleanest waters and peaceful atmosphere.
                  </p>
                  <Link
                    href="/place/kushavarta_kund"
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#102232] py-2 font-semibold text-white hover:bg-[#e86f18]"
                  >
                    View Kund Details
                  </Link>
                </div>
              </div>
            </section>

            {/* Sacred Excursions around Trimbakeshwar */}
            <section className="mt-12">
              <h3 className="text-xl sm:text-2xl font-bold text-[#102232]">
                Sacred Excursions Around Trimbakeshwar
              </h3>
              <p className="mt-1 text-sm text-[#5d7182]">
                Complement your Jyotirlinga darshan with these revered pilgrimage spots
              </p>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {importantPlacesAround.map((place) => (
                  <div
                    key={place.id}
                    className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-[#e86f18]">{place.distance}</span>
                      <h4 className="font-bold text-[#102232] text-base">{place.name}</h4>
                      <p className="text-xs text-[#5d7182] leading-relaxed">{place.description}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <Link
                        href={`/place/${place.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#102232] hover:text-[#e86f18]"
                      >
                        Explore Details
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Transit and Parking Advisory */}
            <section className="mt-12 rounded-3xl border border-amber-200 bg-amber-50/60 p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-6 w-6 text-[#e86f18] shrink-0 mt-1" />
                <div className="space-y-2">
                  <h4 className="text-base sm:text-lg font-bold text-[#102232]">
                    Transit & Traffic Advisory for Kumbh 2027
                  </h4>
                  <p className="text-xs sm:text-sm text-amber-950 leading-relaxed">
                    During Shahi Snan periods, private passenger vehicles (cars, buses) are halted at satellite ring-road holding points situated 5–7 km outside Trimbakeshwar town to prevent gridlock in ancient narrow lanes. Government MSRTC electric shuttle buses ferry pilgrims directly to the main terminal. We advise booking your transit early and relying on the public shuttle network.
                  </p>
                </div>
              </div>
            </section>

            {/* FAQ Section */}
            <section className="mt-16">
              <h3 className="text-xl sm:text-2xl font-bold text-[#102232]">
                Frequently Asked Questions: Trimbakeshwar Kumbh
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

            {/* CTA */}
            <section className="mt-16 rounded-3xl bg-gradient-to-r from-[#102232] to-[#173247] p-8 text-center text-white">
              <h2 className="text-2xl sm:text-3xl font-extrabold">
                Prepare Your Trimbakeshwar Yatra
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm text-[#f4ebd9]/85">
                Calculate driving times from Nashik, reserve your temple visit windows, and arrange dharamshala accommodations.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href="/kumbh/planner"
                  className="rounded-xl bg-[#e86f18] px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-[#c9580f]"
                >
                  Create Kumbh Pilgrimage Plan
                </Link>
                <Link
                  href="/temples-in-nashik"
                  className="rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/20"
                >
                  All Nashik Temples
                </Link>
              </div>
            </section>
          </section>
        </main>
      </div>
    </>
  );
}
