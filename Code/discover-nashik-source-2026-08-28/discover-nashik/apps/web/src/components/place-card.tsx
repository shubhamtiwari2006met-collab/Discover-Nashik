import Link from "next/link";
import type { Place } from "../lib/types";
import { PlaceIcon, VerificationBadge, categoryLabels } from "./place-icon";

export function PlaceCard({ place }: { place: Place }) {
  return (
    <article className="place-card">
      <div className="place-card-topline">
        <span className="category-pill"><PlaceIcon category={place.category} /> {categoryLabels[place.category]}</span>
        <VerificationBadge status={place.verificationStatus} />
      </div>
      <h3><Link href={`/places/${place.slug}`}>{place.name}</Link></h3>
      <p>{place.shortDescription}</p>
      <div className="place-card-footer">
        <span className="muted">📍 {place.area ?? place.address}</span>
        <Link href={`/places/${place.slug}`} className="text-link">Details →</Link>
      </div>
    </article>
  );
}
