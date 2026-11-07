"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Globe,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Laptop,
  Smartphone,
  Sparkles,
  FileCode,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
  Eye,
  Layers,
  Compass,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface PagePreview {
  key: string;
  name: string;
  url: string;
  title: string;
  description: string;
  breadcrumbs: string[];
}

const previewPages: PagePreview[] = [
  {
    key: "home",
    name: "Homepage",
    url: "https://discovernashik.co.in",
    title: "Discover Nashik | Digital Kumbh Mela 2027 Guide & Local Tourism",
    description:
      "Explore Nashik, Maharashtra: Official Simhastha Kumbh Mela 2027 guide, Trimbakeshwar Jyotirlinga, sacred Panchavati temples, Godavari ghats, sightseeing, and stays.",
    breadcrumbs: ["discovernashik.co.in"],
  },
  {
    key: "places-to-visit",
    name: "Places to Visit Guide",
    url: "https://discovernashik.co.in/places-to-visit",
    title: "15 Best Places to Visit in Nashik (2027 Sightseeing & Tourism Guide)",
    description:
      "Discover the best tourist places to visit in Nashik including Panchavati, Trimbakeshwar Jyotirlinga, Someshwar Waterfalls, Sula Vineyards, and Pandavleni Caves.",
    breadcrumbs: ["discovernashik.co.in", "places-to-visit"],
  },
  {
    key: "temples-in-nashik",
    name: "Temples in Nashik Guide",
    url: "https://discovernashik.co.in/temples-in-nashik",
    title: "10 Famous Temples in Nashik & Pilgrimage Circuits (2027 Guide)",
    description:
      "Complete guide to famous temples in Nashik including Trimbakeshwar Jyotirlinga, Kalaram Mandir, Kapaleshwar Mahadev, Someshwar, and Sita Gufa with darshan timings.",
    breadcrumbs: ["discovernashik.co.in", "temples-in-nashik"],
  },
  {
    key: "trimbakeshwar",
    name: "Trimbakeshwar Kumbh Guide",
    url: "https://discovernashik.co.in/kumbh/trimbakeshwar",
    title: "Trimbakeshwar Kumbh Mela 2027 Guide | Jyotirlinga, Kushavarta & Rituals",
    description:
      "Complete pilgrimage guide to Trimbakeshwar for Simhastha Kumbh Mela 2027. Details on Jyotirlinga darshan, Kushavarta Shahi Snan, poojas, timings, and travel from Nashik.",
    breadcrumbs: ["discovernashik.co.in", "kumbh", "trimbakeshwar"],
  },
  {
    key: "accommodation",
    name: "Accommodation Guide",
    url: "https://discovernashik.co.in/kumbh/accommodation",
    title: "Where to Stay in Nashik for Kumbh Mela 2027 | Hotels, Dharamshalas & Tents",
    description:
      "Authoritative guide on where to stay in Nashik and Trimbakeshwar during Kumbh Mela 2027. Review best pilgrim areas: Panchavati, Nashik Road, Gangapur, and Trimbak.",
    breadcrumbs: ["discovernashik.co.in", "kumbh", "accommodation"],
  },
  {
    key: "planner",
    name: "Pilgrimage Planner",
    url: "https://discovernashik.co.in/kumbh/planner",
    title: "AI Pilgrimage & Itinerary Planner | Nashik Kumbh Mela 2027",
    description:
      "Create personalized, geography-optimized day-by-day itineraries for Nashik and Trimbakeshwar. Optimize temple darshan, Shahi Snan slots, and road transit.",
    breadcrumbs: ["discovernashik.co.in", "kumbh", "planner"],
  },
];

const technicalAudits = [
  {
    id: "canonical",
    title: "Absolute Canonical URLs",
    description: "Enforced across layout, hubs, and dynamic /place/[id] pointing strictly to https://discovernashik.co.in",
    status: "pass",
  },
  {
    id: "robots",
    title: "Robots.txt Directives",
    description: "Allows crawlers on public routes; disallows /admin/, /api/, /profile, /business/dashboard; specifies sitemap URL.",
    status: "pass",
  },
  {
    id: "sitemap",
    title: "Dynamic Multilingual Sitemap.xml",
    description: "Automatically includes all landing hubs, canonical pilgrimage destinations, Supabase businesses, and hreflang tags.",
    status: "pass",
  },
  {
    id: "hreflang",
    title: "Multilingual Language Alternates",
    description: "Hreflang tags configured for en-IN, hi-IN, and mr-IN to target English, Hindi, and Marathi searchers.",
    status: "pass",
  },
  {
    id: "schema",
    title: "Structured Data (Schema.org)",
    description: "WebSite with SearchAction, Organization, TouristDestination, TouristAttraction, BreadcrumbList, ItemList & FAQPage.",
    status: "pass",
  },
  {
    id: "opengraph",
    title: "Social Graph & Twitter Cards",
    description: "OpenGraph 1200x630 px images, Twitter summary_large_image, site locale and descriptions configured.",
    status: "pass",
  },
];

const keywordStrategy = [
  {
    cluster: "Kumbh Mela 2027",
    keywords: "Nashik Kumbh Mela 2027, Kumbh Mela Nashik, Simhastha Kumbh Mela, Shahi Snan dates",
    targetPage: "/kumbh",
    priority: "Critical",
    intent: "Informational & Transactional",
  },
  {
    cluster: "Trimbakeshwar & Jyotirlinga",
    keywords: "Trimbakeshwar Temple, Kushavarta Kund holy bath, Trimbakeshwar Kumbh guide, Narayan Nagbali",
    targetPage: "/kumbh/trimbakeshwar",
    priority: "Critical",
    intent: "Pilgrim & Ritual Research",
  },
  {
    cluster: "Temples & Pilgrimage",
    keywords: "Famous temples in Nashik, Kalaram Temple, Panchavati temples, Kapaleshwar Temple, Someshwar",
    targetPage: "/temples-in-nashik",
    priority: "High",
    intent: "Darshan & Heritage Discovery",
  },
  {
    cluster: "Tourism & Sightseeing",
    keywords: "Places to visit in Nashik, Nashik tourist places, Waterfalls in Nashik, Pandavleni Caves",
    targetPage: "/places-to-visit",
    priority: "High",
    intent: "Travel & Sightseeing Discovery",
  },
  {
    cluster: "Accommodation & Stay",
    keywords: "Hotels in Nashik, Hotels near Trimbakeshwar, Where to stay in Nashik Kumbh, Dharamshalas",
    targetPage: "/kumbh/accommodation",
    priority: "High",
    intent: "Booking & Commercial",
  },
  {
    cluster: "Smart Travel Planning",
    keywords: "Nashik itinerary planner, Kumbh trip planner, Nashik pilgrimage tour plan",
    targetPage: "/kumbh/planner",
    priority: "High",
    intent: "Productivity & Personalized Planning",
  },
];

export default function AdminSeoPage() {
  const { t } = useTranslation();
  const [selectedPage, setSelectedPage] = useState<PagePreview>(previewPages[0]);
  const [deviceMode, setDeviceMode] = useState<"desktop" | "mobile">("desktop");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(text);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-[#e86f18]">
            <Globe className="h-3.5 w-3.5" />
            <span>Organic Search Engine Optimization</span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#102232]">
            {t("SEO Management")} & SERP Intelligence
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[#5d7182]">
            Monitor technical SEO health, preview Google search engine results, and manage topical search authority.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://search.google.com/search-console"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-[#102232] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#e86f18]"
          >
            <span>Google Search Console</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Production Domain Indicator */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-emerald-600 p-1.5 text-white">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-950">
              Canonical Domain Configured
            </div>
            <div className="font-mono text-xs text-emerald-800">
              https://discovernashik.co.in
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Link
            href="/robots.txt"
            target="_blank"
            className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 font-medium text-emerald-900 hover:bg-emerald-100/50"
          >
            View /robots.txt
          </Link>
          <Link
            href="/sitemap.xml"
            target="_blank"
            className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 font-medium text-emerald-900 hover:bg-emerald-100/50"
          >
            View /sitemap.xml
          </Link>
        </div>
      </div>

      {/* Live SERP Google Snippet Preview Tool */}
      <section className="rounded-3xl border border-orange-100 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-[#e86f18]" />
              <h2 className="text-xl font-bold text-[#102232]">
                Google SERP Snippet Preview Simulator
              </h2>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-[#5d7182]">
              Visualize how major landing pages appear on Google organic search results
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#f8f2e8] p-1.5 rounded-xl border border-orange-200/60">
            <button
              type="button"
              onClick={() => setDeviceMode("desktop")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                deviceMode === "desktop"
                  ? "bg-white text-[#102232] shadow-sm"
                  : "text-[#5d7182] hover:text-[#102232]"
              }`}
            >
              <Laptop className="h-3.5 w-3.5" />
              Desktop
            </button>
            <button
              type="button"
              onClick={() => setDeviceMode("mobile")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                deviceMode === "mobile"
                  ? "bg-white text-[#102232] shadow-sm"
                  : "text-[#5d7182] hover:text-[#102232]"
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              Mobile
            </button>
          </div>
        </div>

        {/* Page selector pills */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
          {previewPages.map((page) => (
            <button
              key={page.key}
              type="button"
              onClick={() => setSelectedPage(page)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                selectedPage.key === page.key
                  ? "bg-[#102232] text-white shadow-sm"
                  : "bg-gray-100 text-[#5d7182] hover:bg-gray-200"
              }`}
            >
              {page.name}
            </button>
          ))}
        </div>

        {/* Preview Canvas */}
        <div className="rounded-2xl border border-gray-200 bg-[#f9f9f9] p-4 sm:p-6">
          <div
            className={`mx-auto rounded-xl bg-white p-5 shadow-sm border border-gray-200 ${
              deviceMode === "mobile" ? "max-w-md" : "max-w-3xl"
            }`}
          >
            {/* Google Search Result Card */}
            <div className="space-y-1.5 font-sans">
              <div className="flex items-center gap-2 text-xs text-[#202124]">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-[#e86f18] font-bold text-xs">
                  DN
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-xs text-[#202124]">Discover Nashik</span>
                  <span className="text-[11px] text-[#4d5156] truncate max-w-xs sm:max-w-md font-mono">
                    {selectedPage.breadcrumbs.join(" › ")}
                  </span>
                </div>
              </div>

              <h3 className="pt-1 text-base sm:text-lg font-medium text-[#1a0dab] hover:underline cursor-pointer leading-snug">
                {selectedPage.title}
              </h3>

              <p className="text-xs sm:text-sm text-[#4d5156] leading-relaxed pt-0.5">
                {selectedPage.description}
              </p>
            </div>
          </div>

          {/* Character Metrics */}
          <div className="mt-4 flex flex-wrap justify-center gap-6 text-xs text-[#5d7182]">
            <div>
              <span className="font-semibold">Title Length: </span>
              <span
                className={`font-mono font-bold ${
                  selectedPage.title.length <= 60 ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                {selectedPage.title.length} chars
              </span>
              <span className="text-gray-400"> (ideal: 50-60)</span>
            </div>
            <div>
              <span className="font-semibold">Description Length: </span>
              <span
                className={`font-mono font-bold ${
                  selectedPage.description.length <= 160 ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                {selectedPage.description.length} chars
              </span>
              <span className="text-gray-400"> (ideal: 140-160)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Technical SEO Audit Status Matrix */}
      <section className="rounded-3xl border border-orange-100 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-bold text-[#102232]">
            Technical SEO Infrastructure Health
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[#5d7182]">
            Core technical SEO checkpoints implemented in Discover Nashik
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {technicalAudits.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-stone-200 bg-[#fbfaf8] p-4 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[#102232]">
                    {item.title}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                    <CheckCircle2 className="h-3 w-3" />
                    Active
                  </span>
                </div>
                <p className="mt-2 text-xs text-[#5d7182] leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Target Keyword Strategy Matrix */}
      <section className="rounded-3xl border border-orange-100 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-bold text-[#102232]">
            Target Keyword Clusters & Organic Mapping
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[#5d7182]">
            Topical keyword priorities mapped to high-conversion landing pages
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b border-stone-200 bg-[#f8f2e8] text-[#102232]">
              <tr>
                <th className="py-3 px-4 font-bold">Topic Cluster</th>
                <th className="py-3 px-4 font-bold">Priority Non-Branded Keywords</th>
                <th className="py-3 px-4 font-bold">Target URL</th>
                <th className="py-3 px-4 font-bold">Search Intent</th>
                <th className="py-3 px-4 font-bold">Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-[#334e68]">
              {keywordStrategy.map((kw, idx) => (
                <tr key={idx} className="hover:bg-orange-50/40 transition-colors">
                  <td className="py-3 px-4 font-semibold text-[#102232] whitespace-nowrap">
                    {kw.cluster}
                  </td>
                  <td className="py-3 px-4 leading-relaxed font-mono text-xs">
                    {kw.keywords}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <Link
                      href={kw.targetPage}
                      className="inline-flex items-center gap-1 font-semibold text-[#e86f18] hover:underline"
                    >
                      <span>{kw.targetPage}</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-xs text-[#5d7182]">
                    {kw.intent}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        kw.priority === "Critical"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {kw.priority}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* External SEO Testing Tools */}
      <section className="rounded-3xl border border-stone-200 bg-gradient-to-br from-white to-[#f8f2e8] p-6 sm:p-8 shadow-sm">
        <h2 className="text-xl font-bold text-[#102232]">
          External Google & Webmaster Validation
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-[#5d7182]">
          Test structured data schema and page performance on official validation suites
        </p>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a
            href="https://search.google.com/test/rich-results?url=https%3A%2F%2Fdiscovernashik.co.in"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-2xl border border-orange-200 bg-white p-4 shadow-sm hover:border-[#e86f18] transition-colors"
          >
            <div>
              <div className="font-bold text-sm text-[#102232]">Google Rich Results Test</div>
              <div className="text-xs text-[#5d7182]">Validate JSON-LD schemas</div>
            </div>
            <ExternalLink className="h-4 w-4 text-[#e86f18]" />
          </a>

          <a
            href="https://pagespeed.web.dev/analysis?url=https%3A%2F%2Fdiscovernashik.co.in"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-2xl border border-orange-200 bg-white p-4 shadow-sm hover:border-[#e86f18] transition-colors"
          >
            <div>
              <div className="font-bold text-sm text-[#102232]">PageSpeed Insights</div>
              <div className="text-xs text-[#5d7182]">Audit Core Web Vitals (LCP/CLS)</div>
            </div>
            <ExternalLink className="h-4 w-4 text-[#e86f18]" />
          </a>

          <a
            href="https://www.bing.com/webmasters"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-2xl border border-orange-200 bg-white p-4 shadow-sm hover:border-[#e86f18] transition-colors"
          >
            <div>
              <div className="font-bold text-sm text-[#102232]">Bing Webmaster Tools</div>
              <div className="text-xs text-[#5d7182]">Submit sitemap for Bing indexing</div>
            </div>
            <ExternalLink className="h-4 w-4 text-[#e86f18]" />
          </a>
        </div>
      </section>
    </div>
  );
}
