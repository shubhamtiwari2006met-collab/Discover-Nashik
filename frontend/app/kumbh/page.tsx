"use client";
import Link from "next/link";
import { CalendarDays, MapPin, Bus, ArrowRight, HelpCircle } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const guideItems = [
  {
    title: "Important locations",
    text: "Plan your route around Ram Kund, Panchavati, and the main bathing ghats.",
    icon: MapPin,
    href: "/kumbh/locations"
  },
  {
    title: "Getting around",
    text: "Keep flexible travel time for crowds and use public transport where possible.",
    icon: Bus,
    href: "/kumbh/getting-around"
  },
  {
    title: "Dates and planning",
    text: "Save your stay early and follow official updates as the 2027 event approaches.",
    icon: CalendarDays,
    href: "/kumbh/dates-planning"
  },
  {
    title: "Lost & Found",
    text: "Report a lost person or item, or help someone by reporting something you found.",
    icon: HelpCircle,
    href: "/kumbh/lost-found"
  },
];

export default function KumbhPage() {
  const { t } = useTranslation();
  return (
    <main className="min-h-screen bg-[#f8f2e8] py-14">
      <div className="container mx-auto px-4">
        <section className="max-w-3xl rounded-3xl bg-orange-600 p-8 text-white shadow-xl md:p-12">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-100">{t("Nashik guide")}</p>
          <h1 className="mt-3 text-4xl font-bold md:text-5xl">{t("Kumbh Mela 2027")}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-orange-50">{t("Prepare for one of India's largest spiritual gatherings with practical locations, transport, and planning information.")}</p>
        </section>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {guideItems.map(({ title, text, icon: Icon, href }) => (
            <Link
              key={title}
              href={href}
              className="group relative flex flex-col justify-between rounded-2xl border border-[#e1cfb0] bg-[#fffdf8] p-6 shadow-[0_12px_30px_rgba(77,58,30,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-orange-400 hover:shadow-xl cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600 transition-colors group-hover:bg-orange-600 group-hover:text-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-orange-600 opacity-0 transition-opacity group-hover:opacity-100">
                    {t("Explore")} <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
                <h2 className="mt-6 text-xl font-bold text-slate-900 dark:text-white group-hover:text-orange-600 transition-colors">{t(title)}</h2>
                <p className="mt-2 leading-7 text-slate-600 dark:text-slate-400">{t(text)}</p>
              </div>
              <div className="mt-6 flex items-center font-semibold text-orange-600 text-sm">
                <span>{t("View Details")}</span>
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1.5" />
              </div>
            </Link>
          ))}
        </div>
        <Link href="/map" className="mt-8 inline-flex rounded-full bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-orange-600 dark:bg-white dark:text-slate-900">{t("Open Nashik map")}</Link>
      </div>
    </main>
  );
}
