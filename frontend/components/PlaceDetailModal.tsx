"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  X,
  MapPin,
  Star,
  Phone,
  CheckCircle,
  Clock,
  Calendar,
  Globe,
  Mail,
  Navigation,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  User,
  Check,
  ShieldCheck,
  Building2,
  ExternalLink
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { formatDistance } from "@/lib/distance";
import { normalizeImageUrl, DEFAULT_FALLBACK_IMAGE } from "@/lib/imageUrl";
import { Place } from "@/components/PlaceCard";

interface PlaceDetailModalProps {
  place: Place;
  onClose: () => void;
}

export function PlaceDetailModal({ place, onClose }: PlaceDetailModalProps) {
  const { t } = useTranslation();
  
  // Extract images array or single image
  const photoList = Array.isArray(place.images) && place.images.length > 0
    ? place.images.map((img) => normalizeImageUrl(img, DEFAULT_FALLBACK_IMAGE))
    : [normalizeImageUrl(place.image, DEFAULT_FALLBACK_IMAGE)];

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const currentImageUrl = photoList[activePhotoIndex] || photoList[0] || DEFAULT_FALLBACK_IMAGE;

  const dist = place.distance ?? place.distance_km;
  const formattedDist = formatDistance(dist);

  const phone = typeof place.phone === "string" ? place.phone.trim() : "";
  const hasValidPhone = Boolean(phone) && !["n/a", "na", "none", "null", "undefined"].includes(phone.toLowerCase());

  const email = typeof place.email === "string" ? place.email.trim() : "";
  const hasValidEmail = Boolean(email) && !["n/a", "na", "none", "null", "undefined"].includes(email.toLowerCase());

  // Prevent background scrolling while modal is open
  useEffect(() => {
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalStyle;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const navUrl =
    place.mapLink ||
    (place.latitude && place.longitude
      ? `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name}, ${place.location}`)}`);

  // Parse services & facilities if present
  const servicesList = Array.isArray(place.services)
    ? place.services
    : typeof place.services === "string" && place.services.trim()
    ? place.services.split(",").map((s) => s.trim())
    : [];

  const facilitiesList = Array.isArray(place.facilities)
    ? place.facilities
    : typeof place.facilities === "string" && place.facilities.trim()
    ? place.facilities.split(",").map((f) => f.trim())
    : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-[92vw] sm:w-[85vw] md:w-[80vw] max-w-4xl h-[88vh] sm:h-[82vh] max-h-[850px] overflow-hidden rounded-2xl sm:rounded-3xl border border-[#e1cfb0] bg-[#fffdf8] shadow-2xl text-[#173247]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* FIXED / STICKY IMAGE AREA AT TOP */}
        <div className="relative shrink-0 w-full h-[220px] xs:h-[250px] sm:h-[310px] md:h-[350px] overflow-hidden bg-slate-950 border-b border-[#e1cfb0]">
          {/* Ambient Blurred Background Image */}
          <img
            src={currentImageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-35 blur-xl scale-110 pointer-events-none"
            aria-hidden="true"
          />
          {/* Complete Uncropped Main Image */}
          <img
            src={currentImageUrl}
            alt={place.name}
            onError={(e) => {
              const target = e.currentTarget;
              if (target.src !== DEFAULT_FALLBACK_IMAGE) {
                target.src = DEFAULT_FALLBACK_IMAGE;
              }
            }}
            className="relative z-10 h-full w-full object-contain transition-all duration-300 drop-shadow-md"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#173247]/80 via-transparent to-black/30 pointer-events-none z-15" />

          {/* CLOSE BUTTON (X) Top-Right */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-30 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition-all hover:scale-105 hover:bg-black/80 active:scale-95 border border-white/20 shadow-md"
            aria-label="Close modal"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          {/* Carousel Arrows if multiple images */}
          {photoList.length > 1 && (
            <>
              <button
                onClick={() => setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : photoList.length - 1))}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-30 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 transition-colors"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setActivePhotoIndex((prev) => (prev < photoList.length - 1 ? prev + 1 : 0))}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-30 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70 transition-colors"
                aria-label="Next photo"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Floating Rating, Verified, and Photo Indicator Badges */}
          <div className="absolute left-3 bottom-3 sm:left-6 sm:bottom-4 z-20 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-full bg-[#fff7ed]/95 px-3 py-1 text-xs sm:text-sm font-bold text-[#4a1e0c] shadow-md backdrop-blur-sm">
              <Star className="h-4 w-4 fill-[#f59e0b] text-[#f59e0b]" />
              <span>{place.rating || 4.8}</span>
            </div>

            {(place.verified || place.isBusinessApplication) && (
              <div className="flex items-center gap-1 rounded-full bg-emerald-700/95 text-white px-3 py-1 text-xs font-semibold shadow-md backdrop-blur-sm">
                <CheckCircle className="h-3.5 w-3.5" />
                <span>{t("Verified Business")}</span>
              </div>
            )}

            {formattedDist && (
              <div className="flex items-center gap-1 rounded-full bg-orange-500/90 text-white px-3 py-1 text-xs font-semibold shadow-md backdrop-blur-sm">
                <MapPin className="h-3.5 w-3.5" />
                <span>{formattedDist} {t("away")}</span>
              </div>
            )}

            {photoList.length > 1 && (
              <div className="rounded-full bg-black/60 text-white px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm">
                {activePhotoIndex + 1} / {photoList.length}
              </div>
            )}
          </div>
        </div>

        {/* SCROLLABLE INFORMATION AREA BELOW IMAGE */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-5 pb-10 sm:pb-14">
          {/* Header Info */}
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="rounded-full bg-orange-100 border border-orange-200 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-[#c9580f]">
                {place.category}
              </span>
              {place.subcategory && (
                <span className="rounded-full bg-stone-100 border border-stone-200 px-2.5 py-0.5 text-xs font-semibold text-stone-600">
                  {place.subcategory}
                </span>
              )}
              {place.tagline && (
                <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-bold text-[#b45309]">
                  ✨ {place.tagline}
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-3xl font-extrabold text-[#173247] leading-tight">
              {place.name}
            </h2>

            <div className="mt-2 flex items-center text-xs sm:text-sm text-[#667883]">
              <MapPin className="mr-1.5 h-4 w-4 text-[#c9580f] shrink-0" />
              <span>{place.location}</span>
            </div>
          </div>

          {/* Multiple Photos Thumbnail Strip */}
          {photoList.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {photoList.map((photoUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePhotoIndex(idx)}
                  className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                    idx === activePhotoIndex ? "border-[#c9580f] scale-105" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={photoUrl} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <hr className="border-[#eee2cc]" />

          {/* Description */}
          {place.description && (
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#c9580f] mb-1.5">
                {t("About")}
              </h3>
              <p className="text-xs sm:text-base leading-relaxed text-[#4a5568] whitespace-pre-line">
                {place.description}
              </p>
            </div>
          )}

          {/* Heritage / Historical Significance */}
          {place.heritage && (
            <div className="rounded-xl bg-amber-50/70 border border-amber-200/80 p-3.5 sm:p-4">
              <h4 className="text-xs sm:text-sm font-bold text-[#b45309] flex items-center gap-1.5 mb-1">
                <Sparkles className="h-4 w-4" />
                {t("Heritage & Significance")}
              </h4>
              <p className="text-xs sm:text-sm text-[#7c2d12] leading-relaxed">
                {place.heritage}
              </p>
            </div>
          )}

          {/* Famous Thing */}
          {place.famousThing && (
            <div className="rounded-xl bg-orange-50/70 border border-orange-200/80 p-3.5 sm:p-4">
              <h4 className="text-xs sm:text-sm font-bold text-[#c9580f] mb-1">
                🌟 {t("Famous For")}
              </h4>
              <p className="text-xs sm:text-sm text-[#7c2d12]">
                {place.famousThing}
              </p>
            </div>
          )}

          {/* Services Offered */}
          {servicesList.length > 0 && (
            <div className="rounded-xl bg-emerald-50/70 border border-emerald-200/80 p-3.5 sm:p-4">
              <h4 className="text-xs sm:text-sm font-bold text-emerald-800 flex items-center gap-1.5 mb-2">
                <Check className="h-4 w-4 text-emerald-600" />
                {t("Services Offered")}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {servicesList.map((srv, idx) => (
                  <span
                    key={idx}
                    className="rounded-full bg-white border border-emerald-200 px-3 py-1 text-xs font-medium text-emerald-900 shadow-sm"
                  >
                    {srv}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Facilities Available */}
          {facilitiesList.length > 0 && (
            <div className="rounded-xl bg-blue-50/70 border border-blue-200/80 p-3.5 sm:p-4">
              <h4 className="text-xs sm:text-sm font-bold text-blue-900 flex items-center gap-1.5 mb-2">
                <Building2 className="h-4 w-4 text-blue-700" />
                {t("Facilities & Amenities")}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {facilitiesList.map((fac, idx) => (
                  <span
                    key={idx}
                    className="rounded-full bg-white border border-blue-200 px-3 py-1 text-xs font-medium text-blue-900 shadow-sm"
                  >
                    {fac}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Operating Hours & Days */}
          {(place.openingTime || place.workingDays) && (
            <div className="rounded-xl bg-stone-50 border border-stone-200 p-3.5 sm:p-4 space-y-2">
              <h4 className="text-xs sm:text-sm font-bold text-[#173247] flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-[#c9580f]" />
                {t("Timing & Schedule")}
              </h4>
              {place.openingTime && (
                <div className="text-xs sm:text-sm text-[#4a5568]">
                  <span className="font-semibold text-[#173247]">{t("Hours")}: </span>
                  {place.openingTime} {place.closingTime ? `- ${place.closingTime}` : ""}
                </div>
              )}
              {place.workingDays && (
                <div className="text-xs sm:text-sm text-[#4a5568]">
                  <span className="font-semibold text-[#173247]">{t("Days")}: </span>
                  {place.workingDays}
                </div>
              )}
            </div>
          )}

          {/* Contact Details (Phone, Email, Contact Person) */}
          {(hasValidPhone || hasValidEmail || place.contact_name) && (
            <div className="rounded-xl bg-amber-50/50 border border-amber-200/60 p-3.5 sm:p-4 space-y-2">
              <h4 className="text-xs sm:text-sm font-bold text-[#173247] flex items-center gap-1.5 mb-1">
                <User className="h-4 w-4 text-[#c9580f]" />
                {t("Contact Details")}
              </h4>

              {place.contact_name && (
                <div className="text-xs sm:text-sm text-[#4a5568]">
                  <span className="font-semibold text-[#173247]">{t("Contact Person")}: </span>
                  {place.contact_name}
                </div>
              )}

              {hasValidPhone && (
                <div className="text-xs sm:text-sm text-[#4a5568] flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <a href={`tel:${phone}`} className="font-semibold text-emerald-800 hover:underline">
                    {phone}
                  </a>
                </div>
              )}

              {hasValidEmail && (
                <div className="text-xs sm:text-sm text-[#4a5568] flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                  <a href={`mailto:${email}`} className="font-semibold text-blue-800 hover:underline">
                    {email}
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Admin Remarks / Verification Note if present */}
          {place.admin_remarks && (
            <div className="rounded-xl bg-stone-100 border border-stone-300 p-3 sm:p-3.5 text-xs text-stone-700 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-stone-500 shrink-0" />
              <span>{place.admin_remarks}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 flex flex-wrap items-center gap-2 sm:gap-3">
            <Link
              href={`/place/${place._id}`}
              className="flex-1 min-w-[120px] flex items-center justify-center gap-2 rounded-xl border border-[#c9580f] bg-[#c9580f] px-4 py-2.5 text-center text-xs sm:text-sm font-bold text-white shadow-sm transition-all hover:bg-[#173247]"
            >
              <ExternalLink className="h-4 w-4" />
              {t("Details")}
            </Link>

            {hasValidPhone && (
              <a
                href={`tel:${phone}`}
                className="flex-1 min-w-[120px] flex items-center justify-center gap-2 rounded-xl border border-emerald-600 bg-emerald-600 px-4 py-2.5 text-center text-xs sm:text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-700"
              >
                <Phone className="h-4 w-4" />
                {t("Call Now")} ({phone})
              </a>
            )}

            <a
              href={navUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 min-w-[120px] flex items-center justify-center gap-2 rounded-xl border border-[#e7b06d] bg-[#fff7ed] px-4 py-2.5 text-center text-xs sm:text-sm font-bold text-[#173247] shadow-sm transition-all hover:bg-[#ffedd5]"
            >
              <Navigation className="h-4 w-4 text-[#c9580f]" />
              {t("Get Directions")}
            </a>

            {place.websiteUrl && (
              <a
                href={place.websiteUrl.startsWith("http") ? place.websiteUrl : `https://${place.websiteUrl}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 min-w-[120px] flex items-center justify-center gap-2 rounded-xl border border-[#e7b06d] bg-[#fffdf8] px-4 py-2.5 text-center text-xs sm:text-sm font-semibold text-[#173247] transition-all hover:bg-[#fff7ed]"
              >
                <Globe className="h-4 w-4 text-[#c9580f]" />
                {t("Website")}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
