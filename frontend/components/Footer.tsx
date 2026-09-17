"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export function Footer() {
  const { t } = useTranslation();
  const pathname = usePathname();

  if (pathname !== "/") return null;

  return (
    <footer className="mt-auto border-t border-[#d8c4a3] bg-[#173247] text-[#fffdf8]">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <Link href="/" className="mb-4 flex items-center space-x-2">
              <MapPin className="h-6 w-6 text-[#f5ad45]" />
              <span className="text-xl font-bold tracking-tight text-white">
                Discover <span className="text-[#f5ad45]">Nashik</span>
              </span>
            </Link>
            <p className="text-sm leading-6 text-[#dbe7e7]/80">
              {t("Your one platform to discover everything Nashik has to offer. Built for the community, tourists, and Kumbh Mela 2027.")}
            </p>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-white">{t("Explore")}</h3>
            <ul className="space-y-2 text-sm text-[#dbe7e7]/80">
              <li><Link href="/#explore" className="transition-colors hover:text-orange-300">{t("Places to Visit")}</Link></li>
              <li><Link href="/#explore" className="transition-colors hover:text-orange-300">{t("Food & Dining")}</Link></li>
              <li><Link href="/#explore" className="transition-colors hover:text-orange-300">{t("Hotels & Stays")}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-white">{t("Kumbh 2027")}</h3>
            <ul className="space-y-2 text-sm text-[#dbe7e7]/80">
              <li><Link href="/kumbh" className="transition-colors hover:text-orange-300">{t("Important Locations")}</Link></li>
              <li><Link href="/kumbh" className="transition-colors hover:text-orange-300">{t("Transportation")}</Link></li>
              <li><Link href="/kumbh" className="transition-colors hover:text-orange-300">{t("Emergency Services")}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-white">{t("Connect")}</h3>
            <ul className="space-y-2 text-sm text-[#dbe7e7]/80">
              <li><a href="#" className="transition-colors hover:text-orange-300">{t("About Us")}</a></li>
              <li><a href="#" className="transition-colors hover:text-orange-300">{t("Contact")}</a></li>
              <li><a href="#" className="transition-colors hover:text-orange-300">{t("For Businesses")}</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between border-t border-white/15 pt-8 text-sm text-[#dbe7e7]/70 md:flex-row">
          <p>© {new Date().getFullYear()} Discover Nashik. {t("All rights reserved.")}</p>
          <div className="mt-4 flex space-x-4 md:mt-0">
            <a href="#" className="transition-colors hover:text-orange-300">{t("Privacy")}</a>
            <a href="#" className="transition-colors hover:text-orange-300">{t("Terms")}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
