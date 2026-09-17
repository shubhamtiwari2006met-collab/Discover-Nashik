"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SiteHeader } from "../../../components/site-header";
import { PlaceIcon, VerificationBadge, categoryLabels } from "../../../components/place-icon";
import { getPlace } from "../../../lib/api";
import type { Place } from "../../../lib/types";

export default function PlacePage() {
  const params = useParams<{ slug: string }>();
  const [place, setPlace] = useState<Place>();
  const [error, setError] = useState("");
  const slug = params.slug;

  useEffect(() => {
    if (!slug) return;
    getPlace(slug).then((result) => setPlace(result.data)).catch(() => setError("We could not find that place."));
  }, [slug]);

  return (
    <>
      <div className="page-header"><SiteHeader /></div>
      <main className="detail-page">
        <Link href="/explore" className="back-link">← Back to explore</Link>
        {error && <p className="notice error">{error}</p>}
        {!place && !error && <div className="detail-loading">Loading place…</div>}
        {place && <>
          <section className="place-hero">
            <div className="place-hero-icon"><PlaceIcon category={place.category} /></div>
            <div><p className="eyebrow">{categoryLabels[place.category]} · {place.area ?? "Nashik"}</p><h1>{place.name}</h1><p>{place.shortDescription}</p></div>
            <VerificationBadge status={place.verificationStatus} />
          </section>

          {place.verificationStatus === "community" && <p className="notice">This listing is an early community entry. Confirm practical details before travelling.</p>}
          <section className="detail-grid">
            <article className="detail-story"><h2>About this place</h2><p>{place.description ?? place.shortDescription}</p>{place.highlights.length > 0 && <><h3>Highlights</h3><ul>{place.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}</ul></>}</article>
            <aside className="visit-card"><h2>Plan your visit</h2><dl><div><dt>Address</dt><dd>{place.address}</dd></div>{place.timings && <div><dt>Timings</dt><dd>{place.timings}</dd></div>}{place.facilities.length > 0 && <div><dt>Nearby / facilities</dt><dd>{place.facilities.join(" · ")}</dd></div>}</dl><a className="button primary full-width" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/dir/?api=1&destination=${place.location.coordinates[1]},${place.location.coordinates[0]}`}>Get directions ↗</a>{place.website && <a className="plain-link" href={place.website} target="_blank" rel="noreferrer">Visit official website ↗</a>}</aside>
          </section>
          {place.sourceName && <p className="source-line">Data source: {place.sourceUrl ? <a href={place.sourceUrl} target="_blank" rel="noreferrer">{place.sourceName}</a> : place.sourceName}. Last checked information will appear here after verification.</p>}
        </>}
      </main>
    </>
  );
}
