import type { PlaceCategory, VerificationStatus } from "../lib/types";

const categoryIcons: Record<PlaceCategory, string> = {
  temple: "🛕",
  ghat: "🌊",
  food: "🍲",
  hotel: "🛏️",
  nature: "🌿",
  vineyard: "🍇",
  trek: "🥾",
  shopping: "🛍️",
  parking: "🅿️",
  hospital: "🏥",
  transport: "🚌",
  essential: "📍"
};

export const categoryLabels: Record<PlaceCategory, string> = {
  temple: "Temples",
  ghat: "Ghats",
  food: "Food",
  hotel: "Hotels",
  nature: "Nature",
  vineyard: "Vineyards",
  trek: "Treks",
  shopping: "Shopping",
  parking: "Parking",
  hospital: "Hospitals",
  transport: "Transport",
  essential: "Essentials"
};

export function PlaceIcon({ category, className = "" }: { category: PlaceCategory; className?: string }) {
  return <span className={`place-icon ${className}`} aria-hidden="true">{categoryIcons[category]}</span>;
}

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  const label = status === "official" ? "Official info" : status === "verified" ? "Verified" : "Needs verification";
  return <span className={`verification-badge ${status}`}>{label}</span>;
}
