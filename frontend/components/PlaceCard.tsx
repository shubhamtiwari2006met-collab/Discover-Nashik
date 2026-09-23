"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Star, Phone, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n";
import { formatDistance } from "@/lib/distance";
import { normalizeImageUrl, DEFAULT_FALLBACK_IMAGE } from "@/lib/imageUrl";

export interface Place {
  _id: string;
  name: string;
  category: string;
  location: string;
  description: string;
  image?: string;
  rating?: number;
  mapLink?: string;
  tagline?: string;
  famousThing?: string;
  images?: string[];
  // Business-specific public fields
  phone?: string;
  email?: string;
  websiteUrl?: string;
  openingTime?: string;
  closingTime?: string;
  workingDays?: string;
  subcategory?: string;
  distance?: number;
  distance_km?: number;
  latitude?: number;
  longitude?: number;
  verified?: boolean;
  isApprovedBusiness?: boolean;
}

export function PlaceCard({ place }: { place: Place }) {
  const { t } = useTranslation();
  const imageUrl = normalizeImageUrl(place.image, DEFAULT_FALLBACK_IMAGE);
  const dist = place.distance ?? place.distance_km;
  const formattedDist = formatDistance(dist);

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="group flex h-full flex-col overflow-hidden rounded-[24px] border border-[#e1cfb0] bg-[#fffdf8] shadow-[0_14px_36px_rgba(77,58,30,0.12)] transition-all duration-300 hover:shadow-[0_20px_40px_rgba(77,58,30,0.2)]"
    >
      <Link href={`/place/${place._id}`} className="relative block aspect-[4/3] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#3b1c11]/60 via-[#3b1c11]/10 to-transparent" />
        <div className="absolute inset-0 bg-slate-200 animate-pulse" />
        <img
          src={imageUrl}
          alt={place.name}
          onError={(e) => {
            const target = e.currentTarget;
            if (target.src !== DEFAULT_FALLBACK_IMAGE) {
              target.src = DEFAULT_FALLBACK_IMAGE;
            }
          }}
          className="relative z-10 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute right-4 top-4 z-20 flex items-center space-x-1 rounded-full bg-[#fff7ed]/90 dark:bg-stone-800/90 px-2.5 py-1 shadow-sm backdrop-blur-sm">
          <Star className="h-4 w-4 fill-[#f59e0b] text-[#f59e0b]" />
          <span className="text-xs font-bold text-[#4a1e0c] dark:text-stone-200">{place.rating || 4.5}</span>
        </div>
        {place.verified && (
          <div className="absolute left-4 top-4 z-20 flex items-center space-x-1 rounded-full bg-emerald-700/90 text-white px-2.5 py-1 text-[11px] font-semibold shadow-sm backdrop-blur-sm">
            <CheckCircle className="h-3.5 w-3.5" />
            <span>{t("Verified")}</span>
          </div>
        )}
      </Link>

      <div className="flex flex-grow flex-col p-5">
        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#c9580f] flex items-center justify-between">
          <span>{place.category}</span>
          {place.tagline && (
            <span className="ml-2 normal-case tracking-normal rounded-full bg-orange-50 border border-orange-200 px-2 py-0.5 text-[10px] font-bold text-[#b45309]">
              {place.tagline}
            </span>
          )}
        </div>
        <Link href={`/place/${place._id}`}>
          <h3 className="mb-2 line-clamp-1 text-lg font-bold text-[#173247] transition-colors group-hover:text-[#c9580f]">
            {place.name}
          </h3>
        </Link>
        <p className="mb-4 flex-grow text-sm leading-6 text-[#667883] line-clamp-2">
          {place.description}
        </p>

        <div className="mb-4 mt-auto flex items-center border-t border-[#eee2cc] pt-4 text-xs text-[#667883]">
          <MapPin className="mr-1 h-4 w-4 text-[#b45309] dark:text-orange-500 shrink-0" />
          <span className="truncate">{place.location}</span>
          {formattedDist && (
            <span className="ml-auto shrink-0 font-bold text-[#c9580f] bg-orange-100/70 border border-orange-200 px-2 py-0.5 rounded-full text-[11px]">
              📍 {formattedDist} {t("away")}
            </span>
          )}
        </div>

        <div className="mt-2 flex items-center gap-2">
          <Link href={`/place/${place._id}`} className="flex-1 rounded-xl bg-[#f97316] px-3 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-[#ea580c]">
            {t("Explore")}
          </Link>
          {place.phone ? (
            <a
              href={`tel:${place.phone}`}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500 bg-emerald-50 px-3 py-2.5 text-center text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100"
              title={`Call ${place.phone}`}
            >
              <Phone className="h-4 w-4 text-emerald-700" />
              <span>{t("Call")}</span>
            </a>
          ) : null}
          <a
            href={place.mapLink || (place.latitude && place.longitude ? `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name}, ${place.location}`)}`)}
            target="_blank"
            rel="noreferrer"
            className="flex-1 rounded-xl border border-[#e7b06d] bg-[#fff7ed] px-3 py-2.5 text-center text-sm font-medium text-[#173247] transition-colors hover:bg-[#ffedd5]"
          >
            {t("Navigate")}
          </a>
        </div>
      </div>
    </motion.div>
  );
}

