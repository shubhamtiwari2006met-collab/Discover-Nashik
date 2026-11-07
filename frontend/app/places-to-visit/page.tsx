import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Star, Clock, Compass, ArrowRight, Sparkles, Navigation, Calendar, Phone } from "lucide-react";

export const metadata: Metadata = {
  title: "15 Best Places to Visit in Nashik (2027 Sightseeing & Tourism Guide)",
  description: "Discover the best tourist places to visit in Nashik including Panchavati, Trimbakeshwar Jyotirlinga, Someshwar Waterfalls, Sula Vineyards, and Pandavleni Caves with timings and travel advice.",
  keywords: [
    "Places to visit in Nashik",
    "Best tourist places in Nashik",
    "Nashik tourism guide",
    "Nashik sightseeing",
    "Attractions in Nashik",
    "Waterfalls in Nashik",
    "Weekend trips near Nashik",
    "Things to do in Nashik"
  ],
  alternates: {
    canonical: "https://discovernashik.co.in/places-to-visit",
    languages: {
      "en-IN": "https://discovernashik.co.in/places-to-visit",
      "hi-IN": "https://discovernashik.co.in/places-to-visit",
      "mr-IN": "https://discovernashik.co.in/places-to-visit",
    },
  },
  openGraph: {
    title: "15 Best Places to Visit in Nashik | Complete Tourism & Sightseeing Guide",
    description: "Explore Nashik's top attractions: ancient temples, lush waterfalls, historical rock-cut caves, scenic vineyards, and sacred ghats.",
    url: "https://discovernashik.co.in/places-to-visit",
    siteName: "Discover Nashik",
    locale: "en_IN",
    type: "article",
    images: [
      {
        url: "https://discovernashik.co.in/images/nashik-hero.webp",
        width: 1200,
        height: 630,
        alt: "Best Places to Visit in Nashik Sightseeing Guide",
      },
    ],
  },
};

const topNashikAttractions = [
  {
    id: "trimbakeshwar_temple",
    name: "Trimbakeshwar Jyotirlinga Temple",
    category: "Pilgrimage & Heritage",
    distance: "28 km from City Center",
    timing: "05:30 AM – 09:00 PM",
    description: "One of the 12 sacred Jyotirlingas of Lord Shiva and the holy source of the Godavari River. Features an extraordinary three-faced lingam representing Brahma, Vishnu, and Mahesh.",
    highlights: "Black stone Nagara architecture, Kushavarta Holy Kund, Sant Nivruttinath Samadhi.",
    bestFor: "Pilgrims, Architecture Enthusiasts, Spiritual Seekers"
  },
  {
    id: "ram_kund",
    name: "Ram Kund & Sacred Godavari Ghats",
    category: "Sacred Riverfront",
    distance: "Central Panchavati",
    timing: "Open 24 Hours (Maha Aarti at 6:30 PM)",
    description: "The primary spiritual epicenter of Nashik where Lord Rama bathed during exile. During Simhastha Kumbh Mela, millions gather here for the sacred Shahi Snan royal holy dips.",
    highlights: "Daily Ganga Godavari Evening Aarti, Kapaleshwar Temple, Asthi Vilay Kund.",
    bestFor: "River rituals, photography, morning walks, heritage discovery"
  },
  {
    id: "kalaram_temple",
    name: "Kalaram Temple (Kala Ram Sansthan)",
    category: "Historic Temple",
    distance: "Panchavati (500m from Ram Kund)",
    timing: "05:30 AM – 12:00 PM & 03:30 PM – 09:00 PM",
    description: "Built in 1782 by Sardar Rangarao Odhekar using black stone quarried from Ramshej. Houses an awe-inspiring black idol of Lord Rama with Lakshmana and Sita.",
    highlights: "17-foot gold-plated spire, massive stone courtyard, historic 1930 Temple Entry Movement led by Dr. B.R. Ambedkar.",
    bestFor: "History lovers, Ramayana pilgrims, stone carving enthusiasts"
  },
  {
    id: "someshwar_temple",
    name: "Someshwar Mahadev Temple & Waterfall",
    category: "Nature & Temples",
    distance: "7 km from City Center (Gangapur Road)",
    timing: "06:00 AM – 08:00 PM",
    description: "Picturesque Shiva temple set upon the serene riverbanks of the Godavari. Features the scenic Someshwar Dudhsagar waterfall, surrounded by lush green parks.",
    highlights: "Riverside boat ride, monsoon waterfalls, tranquil park picnic area.",
    bestFor: "Families, nature lovers, peaceful temple visits"
  },
  {
    id: "pandavleni_caves",
    name: "Pandavleni Rock-Cut Caves",
    category: "Archaeology & Trekking",
    distance: "8 km from City Center (Mumbai Highway)",
    timing: "08:00 AM – 06:00 PM",
    description: "A complex of 24 ancient rock-cut Buddhist caves carved between 2nd century BCE and 2nd century CE into the Trirashmi hills. Features exquisite chaityas and viharas.",
    highlights: "Ancient Brahmi inscriptions, Buddha stupa, panoramic city viewpoint after a 300-step stone stair climb.",
    bestFor: "History buffs, morning hikers, photography lovers"
  },
  {
    id: "sula_vineyards",
    name: "Sula Vineyards & Estate Tour",
    category: "Vineyards & Agro-Tourism",
    distance: "14 km from City Center (Gangapur Dam)",
    timing: "11:30 AM – 09:00 PM",
    description: "Nashik's flagship winery credited with establishing Nashik as India's Wine Capital. Offers guided winery cellar tours, grape harvest stomping, and balcony dining overlooking Gangapur lake.",
    highlights: "Barrel cellar tour, rooftop tasting lounge, Italian and Indian dining.",
    bestFor: "Couples, leisure travelers, food & beverage connoisseurs"
  },
  {
    id: "anjaneri_hill",
    name: "Anjaneri Hill (Birthplace of Lord Hanuman)",
    category: "Adventure & Pilgrimage Trek",
    distance: "20 km from Nashik (near Trimbak)",
    timing: "Daylight Hours (06:00 AM – 05:00 PM)",
    description: "Sacred mountain plateau revered as the birthplace of Lord Hanuman. The scenic trek ascends past ancient Jain and Hindu rock carvings, leading to the hilltop Anjani Mata temple.",
    highlights: "Reverse waterfall phenomenon during monsoon, hilltop lake, endemic plateau flora.",
    bestFor: "Trekkers, nature photographers, fitness pilgrims"
  },
  {
    id: "saptashrungi_temple",
    name: "Vani Saptashrungi Devi Temple",
    category: "Shaktipeeth Pilgrimage",
    distance: "60 km North of Nashik",
    timing: "05:00 AM – 09:00 PM",
    description: "Perched dramatically upon seven cliff pinnacles in the Sahyadri range, this is one of Maharashtra's three-and-a-half revered Shaktipeeth shrines. Features an 8-foot relief idol with 18 arms.",
    highlights: "Modern funicular trolley ropeway, hilltop clouds, panoramic Sahyadri view.",
    bestFor: "Shaktipeeth pilgrims, mountain excursions, family blessings"
  },
  {
    id: "muktidham_temple",
    name: "Muktidham Marble Temple Complex",
    category: "Spiritual Complex",
    distance: "Nashik Road (near Railway Station)",
    timing: "06:00 AM – 08:30 PM",
    description: "Immaculate marble temple built with pure white Makrana marble. Houses authentic life-sized replicas of all 12 Jyotirlingas, alongside murals of the Bhagavad Gita.",
    highlights: "All 12 Jyotirlinga darshan under one roof, peaceful marble prayer halls.",
    bestFor: "Transit pilgrims arriving via Nashik Road railway station"
  },
  {
    id: "sita_gufa",
    name: "Sita Gufa (Sita's Cave)",
    category: "Ramayana Landmark",
    distance: "Panchavati",
    timing: "06:00 AM – 12:30 PM & 03:00 PM – 07:30 PM",
    description: "A narrow, authentic crawl-in cavern where Sita worshipped Lord Shiva during the 14-year exile and from where the demon king Ravana abducted her.",
    highlights: "Five ancient Banyan trees (Panch-vati), Lord Shiva cave sanctum.",
    bestFor: "Devotees of Shri Ram and Sita, cultural heritage walks"
  },
  {
    id: "gondeshwar_temple",
    name: "Gondeshwar Temple (Sinnar)",
    category: "Ancient Architecture",
    distance: "30 km South of Nashik (Sinnar)",
    timing: "06:00 AM – 08:00 PM",
    description: "An exceptional 11th-century Panchayatana temple built in the Hemadpanthi style during the Yadava dynasty. Features a central Shiva shrine surrounded by four satellite shrines.",
    highlights: "Ornate basalt carvings depicting scenes from Mahabharata and Ramayana.",
    bestFor: "Archaeology buffs, road-trip travelers, heritage architecture"
  },
  {
    id: "gangapur_dam",
    name: "Gangapur Dam & MTDC Boat Club",
    category: "Lakes & Water Sports",
    distance: "12 km from City Center",
    timing: "10:00 AM – 06:00 PM",
    description: "Earth-fill dam built on the Godavari river offering scenic waterscapes, MTDC water sports boat club (kayaking, speedboats, banana rides), and sunset view promenade.",
    highlights: "Speedboat tours, lakeside grape gardens, mountain backdrop sunsets.",
    bestFor: "Adventure enthusiasts, family recreation, evening leisure"
  }
];

const faqs = [
  {
    q: "How many days are needed to visit Nashik?",
    a: "A 2 to 3-day itinerary is ideal for visiting Nashik. Day 1 can be dedicated to the Panchavati pilgrimage circuit (Ram Kund, Kalaram Temple, Sita Gufa, Tapovan), Day 2 to Trimbakeshwar Jyotirlinga and Anjaneri/Brahmagiri, and Day 3 to Pandavleni Caves, Someshwar Waterfalls, and local vineyards."
  },
  {
    q: "What is the best time to visit tourist places in Nashik?",
    a: "October through March is the most pleasant season with cool temperatures (12°C – 28°C). The monsoon season (July to September) is magical for waterfalls and green hill treks, while Kumbh Mela 2027 occurs in August and September."
  },
  {
    q: "Which are the must-visit temples in Nashik for first-time visitors?",
    a: "The top 4 must-visit temples are Trimbakeshwar Jyotirlinga (one of the 12 Jyotirlingas), Shree Kalaram Temple (historic black stone temple), Kapaleshwar Mahadev (facing Ram Kund), and Muktidham (pure marble complex with all 12 Jyotirlinga replicas)."
  },
  {
    q: "Is public transportation easily available to tourist spots in Nashik?",
    a: "Yes. City buses (Citilinc) connect all central hubs including Panchavati, CBS, Nashik Road, and Gangapur. Shared and private auto-rickshaws, app cabs, and state transport buses frequently ply between Nashik Central Bus Station and Trimbakeshwar."
  }
];

export default function PlacesToVisitPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://discovernashik.co.in" },
          { "@type": "ListItem", "position": 2, "name": "Places to Visit in Nashik", "item": "https://discovernashik.co.in/places-to-visit" }
        ]
      },
      {
        "@type": "ItemList",
        "name": "15 Best Places to Visit in Nashik",
        "description": "Comprehensive guide to Nashik's top tourist destinations, temples, waterfalls, and cultural landmarks.",
        "itemListElement": topNashikAttractions.map((place, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "name": place.name,
          "description": place.description,
          "url": `https://discovernashik.co.in/place/${place.id}`
        }))
      },
      {
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
          "@type": "Question",
          "name": faq.q,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.a
          }
        }))
      }
    ]
  };

  return (
    <main className="min-h-screen bg-[#faf7f2] py-8 sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-[#705e4d]">
          <Link href="/" className="hover:text-[#c9580f] transition-colors">Home</Link>
          <span>/</span>
          <span className="font-semibold text-[#2c1810]">Places to Visit in Nashik</span>
        </nav>

        {/* Hero Header */}
        <header className="mb-10 text-center sm:text-left border-b border-[#ebdcc9] pb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100/80 border border-orange-200 text-[#9e4129] text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#e86f18]" />
            Official Tourism & Sightseeing Guide
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#1f303f] tracking-tight">
            15 Best Places to Visit in Nashik (2027 Travel Guide)
          </h1>
          <p className="mt-4 text-base sm:text-lg text-[#556977] max-w-3xl leading-relaxed">
            From the ancient sanctums of <strong>Panchavati</strong> and the sacred heights of <strong>Trimbakeshwar Jyotirlinga</strong> to tranquil <strong>Someshwar Waterfalls</strong>, rock-cut <strong>Pandavleni Caves</strong>, and world-class vineyards—explore Nashik&apos;s must-visit tourist destinations with verified travel tips, timings, and geographic circuits.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/kumbh/planner"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#c9580f] text-white text-xs sm:text-sm font-bold shadow-sm hover:bg-[#173247] transition-all"
            >
              <Compass className="w-4 h-4" />
              Build Personalized Itinerary
            </Link>
            <Link
              href="/temples-in-nashik"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-[#d8c4a3] text-[#1f303f] text-xs sm:text-sm font-bold shadow-xs hover:border-[#c9580f] transition-all"
            >
              Famous Temples Guide
            </Link>
            <Link
              href="/map"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-[#d8c4a3] text-[#1f303f] text-xs sm:text-sm font-bold shadow-xs hover:border-[#c9580f] transition-all"
            >
              <Navigation className="w-4 h-4 text-[#c9580f]" />
              View on Interactive Map
            </Link>
          </div>
        </header>

        {/* Section 1: Curated List of Attractions */}
        <section aria-label="Top Tourist Attractions in Nashik" className="mb-14">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {topNashikAttractions.map((place, idx) => (
              <article
                key={place.id}
                className="rounded-2xl border border-[#e1cfb0] bg-white p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#9e4129] px-2.5 py-0.5 rounded-full bg-orange-50 border border-orange-200">
                      {place.category}
                    </span>
                    <span className="text-xs font-semibold text-[#705e4d] flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#c9580f]" />
                      {place.distance}
                    </span>
                  </div>

                  <h2 className="text-xl font-bold font-serif text-[#173247] hover:text-[#c9580f] transition-colors">
                    <Link href={`/place/${place.id}`}>
                      {idx + 1}. {place.name}
                    </Link>
                  </h2>

                  <p className="mt-2.5 text-xs sm:text-sm text-[#556977] leading-relaxed">
                    {place.description}
                  </p>

                  <div className="mt-3.5 pt-3 border-t border-[#f0e2cd] text-xs space-y-1.5 text-[#4a2e18]">
                    <div className="flex items-start gap-1.5">
                      <span className="font-bold text-[#b45309] shrink-0">🕒 Timings:</span>
                      <span className="text-slate-600">{place.timing}</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="font-bold text-[#b45309] shrink-0">✨ Highlights:</span>
                      <span className="text-slate-600">{place.highlights}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-[#f0e2cd] flex items-center justify-between">
                  <span className="text-[11px] text-[#705e4d] font-medium">
                    🎯 Best for: {place.bestFor}
                  </span>
                  <Link
                    href={`/place/${place.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#c9580f] hover:text-[#173247] transition-colors"
                  >
                    <span>View Place Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Section 2: Geographical Pilgrimage & Tourism Circuits */}
        <section className="mb-14 rounded-3xl bg-gradient-to-br from-[#173247] to-[#102232] text-white p-8 sm:p-10 shadow-lg">
          <div className="max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-widest text-[#f4b35f]">
              Topical Circuit Planning
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white mt-1">
              How to Group Nashik Attractions by Geographical Circuit
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#f4ebd9]/85 leading-relaxed">
              To avoid backtracking across Nashik, organize your sightseeing into 3 dedicated regional circuits:
            </p>

            <div className="mt-6 space-y-4 text-xs sm:text-sm">
              <div className="p-4 rounded-xl bg-white/10 border border-white/15">
                <h3 className="font-bold text-amber-300 text-sm">Circuit 1: Old Nashik & Sacred Panchavati Walking Trail</h3>
                <p className="mt-1 text-slate-200">
                  Ram Kund $\to$ Kapaleshwar Mahadev $\to$ Kalaram Temple $\to$ Sita Gufa $\to$ Naroshankar Bell $\to$ Tapovan & Lakshman Kund. Conclude at 6:30 PM for Ganga Godavari Evening Maha Aarti.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white/10 border border-white/15">
                <h3 className="font-bold text-amber-300 text-sm">Circuit 2: Trimbak & Western Sahyadri Belt (NH 848)</h3>
                <p className="mt-1 text-slate-200">
                  Trimbakeshwar Jyotirlinga $\to$ Kushavarta Holy Kund $\to$ Sant Nivruttinath $\to$ Coin Museum $\to$ Anjaneri Hill (Hanuman Birthplace) $\to$ Dugarwadi Waterfalls.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white/10 border border-white/15">
                <h3 className="font-bold text-amber-300 text-sm">Circuit 3: Gangapur Road & Agro-Tourism Leisure</h3>
                <p className="mt-1 text-slate-200">
                  Navshya Ganpati (Anandvalli) $\to$ Someshwar Mahadev & Waterfall $\to$ Gangapur Dam Boat Club $\to$ Sula & York Vineyards for sunset dining.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Frequently Asked Questions (FAQ) */}
        <section aria-label="Frequently Asked Questions about visiting Nashik" className="mb-12">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1f303f] mb-6">
            Frequently Asked Questions About Nashik Sightseeing
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-2xl border border-[#e1cfb0] bg-white p-5 shadow-xs">
                <h3 className="text-base font-bold text-[#173247] flex items-center gap-2">
                  <span className="text-[#c9580f] font-serif font-bold">Q.</span>
                  {faq.q}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-[#556977] leading-relaxed pl-5">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
