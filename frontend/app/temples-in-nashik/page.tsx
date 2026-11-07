import type { Metadata } from "next";
import Link from "next/link";
import {
  MapPin,
  Clock,
  Compass,
  ArrowRight,
  Sparkles,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Shield,
  Layers,
  Info,
} from "lucide-react";

export const metadata: Metadata = {
  title: "10 Famous Temples in Nashik & Pilgrimage Circuits (2027 Guide)",
  description:
    "Complete guide to famous temples in Nashik including Trimbakeshwar Jyotirlinga, Kalaram Mandir, Kapaleshwar Mahadev, Someshwar, and Sita Gufa with darshan timings and circuits.",
  keywords: [
    "Famous temples in Nashik",
    "Nashik temples list",
    "Trimbakeshwar Temple",
    "Kalaram Temple",
    "Panchavati temples",
    "Kapaleshwar Temple",
    "Someshwar Mahadev Nashik",
    "Muktidham Temple",
    "Panchavati heritage walk",
    "Nashik pilgrimage circuits",
    "Temples near Ram Kund",
  ],
  alternates: {
    canonical: "https://discovernashik.co.in/temples-in-nashik",
    languages: {
      "en-IN": "https://discovernashik.co.in/temples-in-nashik",
      "hi-IN": "https://discovernashik.co.in/temples-in-nashik",
      "mr-IN": "https://discovernashik.co.in/temples-in-nashik",
    },
  },
  openGraph: {
    title: "10 Famous Temples in Nashik | Darshan Timings & Pilgrimage Circuits",
    description:
      "Explore the holy temples of Nashik: ancient black-stone sanctums, Vedic shrines, river ghats, and the sacred Trimbakeshwar Jyotirlinga.",
    url: "https://discovernashik.co.in/temples-in-nashik",
    siteName: "Discover Nashik",
    locale: "en_IN",
    type: "article",
    images: [
      {
        url: "https://discovernashik.co.in/images/nashik-hero.webp",
        width: 1200,
        height: 630,
        alt: "Famous Temples in Nashik Pilgrimage Guide",
      },
    ],
  },
};

const templesList = [
  {
    id: "trimbakeshwar_temple",
    name: "Trimbakeshwar Jyotirlinga Temple",
    deity: "Lord Shiva (Three-Faced Lingam)",
    location: "Trimbak (28 km from Central Nashik)",
    timing: "05:30 AM – 09:00 PM (Sanctum Sparsh till 12:00 PM)",
    aarti: "05:30 AM (Kakad), 12:00 PM (Madhyan), 07:00 PM (Sandhya Aarti)",
    description:
      "One of the 12 supreme Jyotirlingas in India. Nestled at the foothills of the Brahmagiri mountain, it houses a three-faced lingam embodying Brahma, Vishnu, and Shiva, and serves as the epicenter of Shaivite rituals for the Kumbh Mela.",
    highlights:
      "Black stone Hemadpanthi architecture, Kushavarta Holy Kund, sacred Godavari river source.",
    dressCode: "Dhoti/Pancha with shawl required for inner sanctum abhishek; modest Indian attire for general darshan.",
  },
  {
    id: "kalaram_temple",
    name: "Shree Kalaram Mandir",
    deity: "Lord Rama, Sita, and Lakshmana",
    location: "Panchavati, Nashik",
    timing: "05:30 AM – 10:00 PM",
    aarti: "06:00 AM (Mangal Aarti), 12:00 PM (Bhog), 07:30 PM (Shej Aarti)",
    description:
      "The most prominent temple in Panchavati, constructed in 1788 by Sardar Rangarao Odhekar. Built entirely from black Ramshej basalt stone, it features 2-foot-tall black marble idols of Lord Ram, Sita, and Lakshman.",
    highlights:
      "Gold-plated peak (Kalas), 14 steps signifying 14 years of exile, 84 pillars symbolizing the cycle of 84 lakh rebirths.",
    dressCode: "Modest traditional attire. Footwear must be deposited at the outer gate.",
  },
  {
    id: "kapaleshwar_temple",
    name: "Kapaleshwar Mahadev Mandir",
    deity: "Lord Shiva",
    location: "Opposite Ram Kund, Panchavati",
    timing: "05:00 AM – 09:00 PM",
    aarti: "06:30 AM and 07:30 PM",
    description:
      "A rare and revered Shiva temple that has no idol of Nandi Bull facing the deity. According to ancient lore, Lord Shiva considered Nandi his spiritual Guru to atone for Brahma-hatya dosha, hence Nandi is not seated in front.",
    highlights:
      "Panoramic views of Ram Kund ghats, rare absence of Nandi, historical Peshwa stone restoration.",
    dressCode: "Modest clothing. Early morning visits are recommended to avoid crowds.",
  },
  {
    id: "sita_gufa",
    name: "Sita Gufa (Sita Caves)",
    deity: "Lord Ram, Lakshman, and Goddess Sita",
    location: "Panchavati (Near Kalaram Temple)",
    timing: "06:00 AM – 09:00 PM",
    aarti: "Conducted during Ram Navami & regular temple hours",
    description:
      "The sacred cave complex where Goddess Sita stayed during the Ramayana exile. Legend marks this site where Ravana deceived Sita in disguise. Visitors descend through a narrow natural rock tunnel to view the sanctum.",
    highlights:
      "Five ancient Banyan trees (Panch-Vati), underground cave shrine, historical Lakshman Rekha site.",
    dressCode: "Modest clothing. Note: Access requires bending through a narrow passage; seniors should exercise care.",
  },
  {
    id: "someshwar_temple",
    name: "Someshwar Mahadev Temple",
    deity: "Lord Shiva & Lord Ganesha",
    location: "Gangapur Road, Nashik",
    timing: "06:00 AM – 08:30 PM",
    aarti: "07:00 AM and 07:00 PM",
    description:
      "Situated along the scenic curves of the Godavari river, Someshwar Temple offers tranquil spiritual ambiance away from urban bustle. Adjacent to the famous Someshwar Waterfalls, it attracts devotees during Shravan Mondays.",
    highlights:
      "Serene riverbank setting, boating facility nearby, shaded courtyards for meditation.",
    dressCode: "Casual or traditional respectful attire.",
  },
  {
    id: "muktidham_temple",
    name: "Muktidham Mandir",
    deity: "Lord Krishna, Vishnu, and 12 Jyotirlinga Replicas",
    location: "Nashik Road (2 km from Railway Station)",
    timing: "06:00 AM – 08:00 PM",
    aarti: "06:30 AM and 07:00 PM",
    description:
      "An immaculate architectural marvel built using pristine white Makrana marble from Rajasthan. The temple walls are carved with all 18 chapters of the Bhagavad Gita, and it houses exact scaled replicas of all 12 Jyotirlingas.",
    highlights:
      "White marble halls, 12 Jyotirlinga sanctums, life-size marble chariots of Lord Krishna and Arjuna.",
    dressCode: "Modest attire. Strictly no leather belts or bags permitted inside the sanctum.",
  },
  {
    id: "navshya_ganpati",
    name: "Navshya Ganpati Mandir",
    deity: "Lord Ganesha (Navasala Pavnara Ganpati)",
    location: "Anandvalli, Gangapur Road",
    timing: "06:00 AM – 09:00 PM",
    aarti: "06:30 AM and 08:00 PM (Sankashti days special aarti)",
    description:
      "Established in 1774 by Raghunathrao Peshwa and Anandibai, this 300-year-old riverside temple is famed for granting wishes (Navas). It sits beautifully amidst neem and peepal trees on the banks of the Godavari.",
    highlights:
      "Peaceful ghat walkways, Peshwa heritage architecture, auspicious Ganesh Sankashti celebrations.",
    dressCode: "Modest attire.",
  },
  {
    id: "sundarnarayan_temple",
    name: "Sundarnarayan Mandir",
    deity: "Lord Vishnu (Sundarnarayan)",
    location: "Ahilyabai Holkar Bridge, Panchavati",
    timing: "06:00 AM – 08:30 PM",
    aarti: "06:30 AM and 07:00 PM",
    description:
      "Constructed in 1756 by Gangadhar Yashwant Chandrachud, this temple is designed with remarkable astronomical precision: during the spring equinox in March, rays of the rising sun fall directly on Lord Vishnu's feet.",
    highlights:
      "Astronomical sunrise alignment, intricate stone carvings, proximity to Victoria Bridge & Godavari.",
    dressCode: "Modest traditional clothing.",
  },
  {
    id: "naroshankar_temple",
    name: "Naroshankar Mandir (Rameshwar)",
    deity: "Lord Shiva (Rameshwar)",
    location: "Tiwnaji Chowk, Godavari Riverbank",
    timing: "05:30 AM – 09:00 PM",
    aarti: "06:00 AM and 07:00 PM",
    description:
      "Built in 1747 by Naroshankar Rajebahadur, this temple features an 18-foot stone fortification known as the Naroshankar Kot. Its exterior houses the colossal bronze Portuguese church bell brought from Vasai fort after the 1739 Maratha victory.",
    highlights:
      "Historical Naroshankar Bell (Vasai Vijay), river ghat steps, intricate stone carvings.",
    dressCode: "Modest clothing.",
  },
  {
    id: "tapovan_temples",
    name: "Tapovan Sacred Ashrams & Lakshman Mandir",
    deity: "Lord Lakshman & Rishis",
    location: "Tapovan (1.5 km downstream from Panchavati)",
    timing: "06:00 AM – 08:00 PM",
    aarti: "06:30 AM and 07:00 PM",
    description:
      "Tapovan is the holy penance grove where ancient rishis performed austerities and where Lakshman severed Surpanakha's nose. It contains the confluence of Godavari and Kapil rivers (Kapil Sangam) and tranquil ashrams.",
    highlights:
      "Ancient hermitage trees, holy bathing kunds, Lakshman temple, tranquil meditation groves.",
    dressCode: "Modest attire suitable for walking.",
  },
];

const pilgrimageCircuits = [
  {
    title: "Circuit 1: Panchavati Sacred Foot Trail (Walkable)",
    duration: "3 to 4 Hours",
    distance: "1.8 km walking",
    idealFor: "Vedic heritage, early morning darshan, elderly pilgrims",
    route: [
      "Ram Kund (Holy Dip & Sun Worship)",
      "Kapaleshwar Mahadev (No Nandi Temple)",
      "Kalaram Mandir (Black Stone Sanctum)",
      "Sita Gufa (Panchavati Banyan Trees)",
      "Sundarnarayan Mandir (Equinox Architecture)",
      "Naroshankar Ghat (Historic Bell & Aarti)",
    ],
  },
  {
    title: "Circuit 2: Trimbak & Western Jyotirlinga Circuit",
    duration: "Full Day (6 to 8 Hours)",
    distance: "28 km each way (NH 848)",
    idealFor: "Shiva devotees, Shahi Snan pilgrims, nature lovers",
    route: [
      "Trimbakeshwar Jyotirlinga (Morning Abhishek)",
      "Kushavarta Holy Kund (Sacred Snan)",
      "Sant Nivruttinath Samadhi Temple",
      "Anjaneri Hill Foothills (Hanuman Birthplace)",
      "Dugarwadi Waterfall / Coin Museum",
    ],
  },
  {
    title: "Circuit 3: Gangapur Road Riverside Spiritual Trail",
    duration: "3 Hours",
    distance: "9 km driving",
    idealFor: "Family visits, tranquil riverside ambiance, sunset prayers",
    route: [
      "Navshya Ganpati (Peshwa-era Wish-Granting Ganesh)",
      "Someshwar Mahadev Temple",
      "Someshwar Waterfall & Godavari Ghats",
      "Balaji Temple (Gangapur Suburbs)",
    ],
  },
];

const faqs = [
  {
    question: "Which are the most important temples to visit in Nashik?",
    answer:
      "The top spiritual priorities are Trimbakeshwar Jyotirlinga (one of India's 12 Jyotirlingas), Shree Kalaram Mandir in Panchavati, Kapaleshwar Mahadev, Sita Gufa, Someshwar Temple, and Muktidham at Nashik Road.",
  },
  {
    question: "Do Nashik temples have afternoon closure timings?",
    answer:
      "Yes. Most traditional temples in Panchavati and Trimbakeshwar close their inner sanctums between 12:30 PM and 3:30 PM for deity bhog and rest. Plan your visits for early mornings (06:00 AM – 11:30 AM) or evenings (04:00 PM – 08:30 PM).",
  },
  {
    question: "Is there a strict dress code at Trimbakeshwar and Kalaram temples?",
    answer:
      "For standard darshan, modest attire is mandatory (shoulders and knees covered; avoiding shorts/sleeveless). For inner-sanctum Abhishek at Trimbakeshwar, men must wear a traditional dhoti/pancha without a shirt, and women must wear sarees or salwar suits.",
  },
  {
    question: "Can all Panchavati temples be covered on foot?",
    answer:
      "Yes. Ram Kund, Kapaleshwar, Kalaram Temple, Sita Gufa, Sundarnarayan, and Naroshankar Temple are all situated within a 1.5 km perimeter in Panchavati and are best explored via a walking pilgrimage trail.",
  },
  {
    question: "How far is Trimbakeshwar from Nashik city and how can pilgrims reach it?",
    answer:
      "Trimbakeshwar is located 28 km west of Nashik city center. Regular MSRTC city buses run every 15 minutes from CBS Bus Stand, and private taxis or auto-rickshaws take approximately 45–55 minutes along the four-lane NH 848 highway.",
  },
];

export default function TemplesInNashikPage() {
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
        name: "Places to Visit",
        item: "https://discovernashik.co.in/places-to-visit",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Temples in Nashik",
        item: "https://discovernashik.co.in/temples-in-nashik",
      },
    ],
  };

  const schemaItemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "10 Famous Temples in Nashik",
    description:
      "Authoritative guide to ancient pilgrimage temples, Jyotirlinga, and sacred shrines in Nashik and Trimbakeshwar.",
    itemListElement: templesList.map((temple, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: temple.name,
      description: temple.description,
      url: `https://discovernashik.co.in/place/${temple.id}`,
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
                  href="/places-to-visit"
                  className="font-medium hover:text-[#e86f18] transition-colors"
                >
                  Places to Visit
                </Link>
              </li>
              <li>/</li>
              <li
                className="font-semibold text-[#102232]"
                aria-current="page"
              >
                Temples in Nashik
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
              Sacred Pilgrimage & Heritage Guide
            </div>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl text-white">
              10 Famous Temples in Nashik & Sacred Circuits
            </h1>
            <p className="mt-4 max-w-3xl text-base sm:text-lg text-[#f4ebd9]/90 leading-relaxed">
              From the cosmic presence of the <strong>Trimbakeshwar Jyotirlinga</strong> to the Ramayana-era sanctity of <strong>Kalaram Mandir</strong> and the sacred ghats of <strong>Ram Kund</strong>—explore Nashik&apos;s holy shrines with verified darshan schedules, dress regulations, and walking trails.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/kumbh/planner"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#e86f18] to-[#c9580f] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-950/30 transition hover:brightness-110"
              >
                <Compass className="h-4 w-4" />
                Plan Custom Temple Tour
              </Link>
              <Link
                href="/kumbh/trimbakeshwar"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
              >
                Trimbakeshwar Guide
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </header>

        {/* Essential Pilgrim Advisory Notice */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-5 shadow-sm backdrop-blur">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="rounded-xl bg-[#e86f18] p-2.5 text-white shrink-0">
                <Info className="h-5 w-5" />
              </div>
              <div className="text-xs sm:text-sm text-amber-950">
                <span className="font-bold">Sanctum Timings Advisory:</span> Most temples in Panchavati observe sacred midday rest (Bhog) between <strong>12:30 PM and 03:30 PM</strong>, during which inner sanctum darshan is paused. We recommend scheduling morning visits between <strong>06:00 AM – 11:30 AM</strong> or evening darshan after <strong>04:00 PM</strong> to witness the sunset Ganga Aarti at Ram Kund at <strong>06:30 PM</strong>.
              </div>
            </div>
          </div>
        </section>

        {/* Temple Directory Section */}
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between pb-6 border-b border-orange-100">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-[#102232] sm:text-3xl">
                Nashik&apos;s Revered Temples & Shrines
              </h2>
              <p className="mt-1 text-sm text-[#5d7182]">
                Detailed darshan hours, temple history, aarti schedules, and rituals
              </p>
            </div>
            <span className="hidden sm:inline-block rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-[#e86f18]">
              10 Holy Sanctums
            </span>
          </div>

          <div className="mt-8 space-y-8">
            {templesList.map((temple, idx) => (
              <article
                key={temple.id}
                id={temple.id}
                className="group rounded-3xl border border-orange-100 bg-white p-6 sm:p-8 shadow-sm transition hover:shadow-md"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-orange-600/10 px-2.5 py-1 text-xs font-bold text-[#e86f18]">
                        #{idx + 1}
                      </span>
                      <span className="rounded-lg bg-[#102232]/5 px-2.5 py-1 text-xs font-semibold text-[#173247]">
                        Deity: {temple.deity}
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-bold text-[#102232] group-hover:text-[#e86f18] transition-colors">
                      {temple.name}
                    </h3>

                    <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs sm:text-sm text-[#5d7182]">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-[#e86f18] shrink-0" />
                        <span>{temple.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>{temple.timing}</span>
                      </div>
                    </div>

                    <p className="text-sm sm:text-base leading-relaxed text-[#334e68]">
                      {temple.description}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs sm:text-sm">
                      <div className="rounded-xl bg-[#f8f2e8] p-3 text-[#192f42]">
                        <span className="font-bold text-[#102232]">✨ Highlights: </span>
                        <span>{temple.highlights}</span>
                      </div>
                      <div className="rounded-xl bg-orange-50/70 p-3 text-[#192f42]">
                        <span className="font-bold text-[#e86f18]">🔔 Aarti Times: </span>
                        <span>{temple.aarti}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 pt-1 text-xs text-[#5d7182]">
                      <Shield className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <span><strong>Dress Code & Etiquette:</strong> {temple.dressCode}</span>
                    </div>
                  </div>

                  <div className="lg:w-56 shrink-0 flex flex-col justify-center gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-orange-100 lg:pl-6">
                    <Link
                      href={`/place/${temple.id}`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#102232] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white transition hover:bg-[#e86f18]"
                    >
                      View Sanctum Info
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <Link
                      href="/map"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#192f42] hover:bg-orange-50/50"
                    >
                      Locate on Map
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Pilgrimage Circuits Section */}
          <section className="mt-16 rounded-3xl border border-orange-200/80 bg-gradient-to-br from-[#fffdf9] to-[#f8f2e8] p-6 sm:p-10">
            <div className="max-w-3xl">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#e86f18]">
                Optimized Spiritual Routes
              </span>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#102232] sm:text-3xl">
                Recommended Nashik Pilgrimage Circuits
              </h2>
              <p className="mt-2 text-sm text-[#5d7182]">
                Group sacred temples geographically to prevent cross-city traffic delays and ensure timely darshan.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              {pilgrimageCircuits.map((circuit, index) => (
                <div
                  key={index}
                  className="flex flex-col justify-between rounded-2xl border border-orange-100 bg-white p-5 shadow-sm"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-[#e86f18]">
                        {circuit.duration}
                      </span>
                      <span className="text-xs text-[#5d7182]">{circuit.distance}</span>
                    </div>
                    <h3 className="text-lg font-bold text-[#102232]">
                      {circuit.title}
                    </h3>
                    <p className="text-xs text-[#5d7182]">
                      <strong>Best for:</strong> {circuit.idealFor}
                    </p>
                    <ul className="space-y-1.5 pt-2 text-xs text-[#334e68]">
                      {circuit.route.map((step, sIdx) => (
                        <li key={sIdx} className="flex items-start gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-5 mt-4 border-t border-gray-100">
                    <Link
                      href="/kumbh/planner"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#e86f18] hover:underline"
                    >
                      Generate smart circuit itinerary
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ Section */}
          <section className="mt-16">
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-bold tracking-tight text-[#102232] sm:text-3xl">
                Frequently Asked Questions for Nashik Pilgrims
              </h2>
              <p className="mt-1 text-sm text-[#5d7182]">
                Practical advice on temple schedules, VIP passes, and rituals
              </p>
            </div>

            <div className="mt-6 space-y-4">
              {faqs.map((faq, fIdx) => (
                <div
                  key={fIdx}
                  className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm"
                >
                  <h3 className="text-base sm:text-lg font-bold text-[#102232]">
                    {faq.question}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#334e68]">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Bottom Call to Action */}
          <section className="mt-16 rounded-3xl bg-gradient-to-r from-[#102232] to-[#173247] p-8 sm:p-12 text-center text-white">
            <h2 className="text-2xl sm:text-3xl font-extrabold">
              Planning your Nashik Kumbh Mela 2027 Pilgrimage?
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm sm:text-base text-[#f4ebd9]/85">
              Let our intelligent pilgrimage planner organize your temple darshans according to road distance, sanctum prayer slots, and Godavari Snan rituals.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <Link
                href="/kumbh/planner"
                className="rounded-xl bg-[#e86f18] px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-[#c9580f]"
              >
                Launch Pilgrimage Planner
              </Link>
              <Link
                href="/kumbh/trimbakeshwar"
                className="rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/20"
              >
                Trimbakeshwar Kumbh Guide
              </Link>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
