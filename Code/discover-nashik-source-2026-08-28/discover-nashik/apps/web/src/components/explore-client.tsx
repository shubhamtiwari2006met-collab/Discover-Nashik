"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { getPlaces } from "../lib/api";
import type { Place, PlaceCategory } from "../lib/types";
import { PlaceCard } from "./place-card";
import { PlaceIcon, categoryLabels } from "./place-icon";

const NashikMap = dynamic(() => import("./nashik-map"), {
  ssr: false,
  loading: () => <div className="map-loading">Loading map…</div>
});

const categories: Array<PlaceCategory | "all"> = ["all", "temple", "ghat", "food", "hotel", "nature", "vineyard", "parking", "hospital"];

export function ExploreClient({ initialCategory, initialKumbh = false }: { initialCategory?: string; initialKumbh?: boolean }) {
  const startingCategory = categories.includes(initialCategory as PlaceCategory) ? initialCategory as PlaceCategory | "all" : "all";
  const [category, setCategory] = useState<PlaceCategory | "all">(startingCategory);
  const [query, setQuery] = useState("");
  const [kumbhOnly, setKumbhOnly] = useState(initialKumbh);
  const [nearby, setNearby] = useState<{ lat: number; lng: number } | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [selected, setSelected] = useState<Place | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const result = await getPlaces({
          q: query,
          category,
          kumbh: kumbhOnly,
          ...(nearby ? { ...nearby, maxDistance: 10000 } : {})
        });
        if (active) {
          setPlaces(result.data);
          setSelected((current) => result.data.find((place) => place.slug === current?.slug));
        }
      } catch {
        if (active) setError("We could not load places. Please check that the API is running.");
      } finally {
        if (active) setLoading(false);
      }
    };
    const timer = window.setTimeout(load, query ? 250 : 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [category, query, kumbhOnly, nearby]);

  const selectPlace = useCallback((place: Place) => setSelected(place), []);

  function findNearby() {
    if (!navigator.geolocation) {
      setError("This browser does not support location access.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setNearby({ lat: coords.latitude, lng: coords.longitude }),
      () => setError("Location access was not granted. You can still explore the map.")
    );
  }

  return (
    <main className="explore-page">
      <section className="explore-heading">
        <p className="eyebrow">Nashik, at your pace</p>
        <h1>Find the places that matter.</h1>
        <p>Explore temples, food, nature, practical facilities, and Kumbh-relevant places from one trustworthy map.</p>
      </section>

      <section className="explore-toolbar" aria-label="Place filters">
        <label className="search-box">
          <span aria-hidden="true">⌕</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try ‘temples near Panchavati’" />
        </label>
        <button className={`filter-button ${kumbhOnly ? "active" : ""}`} onClick={() => setKumbhOnly(!kumbhOnly)}>🕉 Kumbh relevant</button>
        <button className={`filter-button ${nearby ? "active" : ""}`} onClick={findNearby}>◎ Near me</button>
        {nearby && <button className="clear-button" onClick={() => setNearby(null)}>Clear location</button>}
      </section>

      <div className="category-filters" aria-label="Categories">
        {categories.map((item) => (
          <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>
            {item === "all" ? "All places" : <><PlaceIcon category={item} /> {categoryLabels[item]}</>}
          </button>
        ))}
      </div>

      {error && <p className="notice error" role="alert">{error}</p>}
      <section className="explore-grid">
        <div className="map-panel">
          <NashikMap places={places} selectedSlug={selected?.slug} onSelect={selectPlace} />
          <p className="map-note">Map data © OpenStreetMap contributors. Always verify travel conditions before leaving.</p>
        </div>
        <div className="results-panel">
          <div className="results-heading">
            <strong>{loading ? "Finding places…" : `${places.length} places found`}</strong>
            {nearby && <span>Within 10 km</span>}
          </div>
          {!loading && places.length === 0 && <div className="empty-state">No places matched these filters. Try another category or clear your search.</div>}
          <div className="place-list">
            {places.map((place) => (
              <button className={`place-list-item ${selected?.slug === place.slug ? "selected" : ""}`} onClick={() => selectPlace(place)} key={place._id}>
                <PlaceIcon category={place.category} />
                <span><strong>{place.name}</strong><small>{place.area ?? place.address}</small></span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="all-results" aria-labelledby="results-title">
        <div><p className="eyebrow">Place details</p><h2 id="results-title">Choose with confidence</h2></div>
        <p>Places marked “needs verification” are early entries. We will verify information with a source before relying on it during Kumbh.</p>
        <div className="cards-grid">{places.map((place) => <PlaceCard key={place._id} place={place} />)}</div>
      </section>
    </main>
  );
}
