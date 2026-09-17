"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

const bestCategories = [
  {
    title: "Spiritual & Temples",
    emoji: "🛕",
    description: "Jyotirlingas, ancient mandirs, and sacred ghats that draw millions of pilgrims every year.",
    color: "#F4A435",
    bg: "#FFF5E0",
    border: "#F4A435",
    links: [
      { label: "Trimbakeshwar Temple", href: "/explore?category=temple" },
      { label: "Panchavati & Ram Kund", href: "/explore?category=ghat" },
      { label: "Kalaram Temple", href: "/explore?category=temple" },
    ],
    href: "/explore?category=temple",
  },
  {
    title: "Food & Hotels",
    emoji: "🍲",
    description: "From sizzling Misal Pav to vineyard dinners — savour the flavours of Nashik with trusted stays.",
    color: "#C0392B",
    bg: "#FFF0EE",
    border: "#C0392B",
    links: [
      { label: "Chulivarchi Misal", href: "/explore?category=food" },
      { label: "Sadhana Restaurant", href: "/explore?category=food" },
      { label: "Hotels near Trimbak", href: "/explore?category=hotel" },
    ],
    href: "/explore?category=food",
  },
  {
    title: "Forts & Treks",
    emoji: "⛰️",
    description: "Conquer the Sahyadri ranges — from Anjaneri to Brahmagiri, Nashik's trails await every explorer.",
    color: "#6B5E3E",
    bg: "#F7F2E8",
    border: "#6B5E3E",
    links: [
      { label: "Brahmagiri Trek", href: "/explore?category=trek" },
      { label: "Anjaneri Fort", href: "/explore?category=trek" },
      { label: "Harihar Fort", href: "/explore?category=trek" },
    ],
    href: "/explore?category=trek",
  },
  {
    title: "Waterfalls & Nature",
    emoji: "🌿",
    description: "Lush monsoon waterfalls, serene reservoirs, and green valleys just a short drive from the city.",
    color: "#276245",
    bg: "#EAF5EE",
    border: "#276245",
    links: [
      { label: "Dugarwadi Waterfall", href: "/explore?category=nature" },
      { label: "Gangapur Dam", href: "/explore?category=nature" },
      { label: "Anjneri Hills", href: "/explore?category=nature" },
    ],
    href: "/explore?category=nature",
  },
  {
    title: "Vineyards & Wine",
    emoji: "🍇",
    description: "Nashik is India's wine capital. Tour the vineyards, taste estate wines, and soak in the views.",
    color: "#5B2E8E",
    bg: "#F3EEFF",
    border: "#5B2E8E",
    links: [
      { label: "Sula Vineyards", href: "/explore?category=vineyard" },
      { label: "York Winery", href: "/explore?category=vineyard" },
      { label: "Grover Zampa", href: "/explore?category=vineyard" },
    ],
    href: "/explore?category=vineyard",
  },
  {
    title: "Emergency & Essentials",
    emoji: "🏥",
    description: "Hospitals, pharmacies, parking, transport hubs — everything you need in an unfamiliar city.",
    color: "#1A5B82",
    bg: "#EAF4FF",
    border: "#1A5B82",
    links: [
      { label: "Hospitals", href: "/explore?category=hospital" },
      { label: "Parking Zones", href: "/explore?category=parking" },
      { label: "Transport Hubs", href: "/explore?category=transport" },
    ],
    href: "/explore?category=hospital",
  },
];

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/explore?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <>
      {/* ── NAVBAR ───────────────────────────────────────── */}
      <nav className="dn-navbar">
        <div className="dn-navbar-inner">
          <Link href="/" className="dn-brand">
            <span className="dn-brand-mark">न</span>
            <span>Discover <strong>Nashik</strong></span>
          </Link>

          {/* Desktop Nav */}
          <ul className="dn-nav-links">
            <li><Link href="/explore">Explore</Link></li>
            <li><Link href="/explore?category=temple">Temples</Link></li>
            <li><Link href="/explore?category=food">Food</Link></li>
            <li><Link href="/explore?category=trek">Treks</Link></li>
            <li><Link href="/explore?kumbh=true" className="dn-nav-kumbh">🕉 Kumbh 2027</Link></li>
          </ul>

          <div className="dn-nav-actions">
            <Link href="/explore" className="dn-nav-btn">Explore Map →</Link>
            <button
              className="dn-hamburger"
              aria-label="Toggle menu"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <span /><span /><span />
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <div className="dn-mobile-menu">
            <Link href="/explore" onClick={() => setMenuOpen(false)}>Explore All</Link>
            <Link href="/explore?category=temple" onClick={() => setMenuOpen(false)}>🛕 Temples</Link>
            <Link href="/explore?category=food" onClick={() => setMenuOpen(false)}>🍲 Food & Hotels</Link>
            <Link href="/explore?category=trek" onClick={() => setMenuOpen(false)}>⛰️ Forts & Treks</Link>
            <Link href="/explore?category=nature" onClick={() => setMenuOpen(false)}>🌿 Nature</Link>
            <Link href="/explore?category=vineyard" onClick={() => setMenuOpen(false)}>🍇 Vineyards</Link>
            <Link href="/explore?kumbh=true" onClick={() => setMenuOpen(false)}>🕉 Kumbh 2027</Link>
          </div>
        )}
      </nav>

      {/* ── HERO ─────────────────────────────────────────── */}
      <div className="hero-shell">
        <div className="om-watermark" aria-hidden="true">ॐ</div>
        <main className="home-main">
          <section className="hero-copy">
            <p className="eyebrow light">🕉&nbsp;&nbsp;A sacred guide to Nashik</p>
            <h1>Every <em>sacred stop</em>, local flavour, and helpful place—within reach.</h1>
            <p className="hero-description">
              Discover Nashik is your map-first guide for pilgrims, tourists, and families — especially during Kumbh Mela 2027.
            </p>

            {/* ── SEARCH BAR ─────────────────────────────── */}
            <form className="dn-search-bar" onSubmit={handleSearch}>
              <span className="dn-search-icon" aria-hidden="true">🔍</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search temples, food, hotels, treks…"
                aria-label="Search places in Nashik"
                className="dn-search-input"
              />
              <button type="submit" className="dn-search-btn">Search</button>
            </form>

            {/* Quick chips */}
            <div className="dn-quick-chips">
              {["Trimbakeshwar", "Misal Pav", "Sula Vineyard", "Kumbh Ghats"].map((chip) => (
                <button
                  key={chip}
                  className="dn-chip"
                  onClick={() => router.push(`/explore?q=${encodeURIComponent(chip)}`)}
                >
                  {chip}
                </button>
              ))}
            </div>

            <p className="trust-line">🙏&nbsp; Verified information · Free to explore · Mobile-first</p>
          </section>

          <aside className="hero-map-card" aria-label="Preview of Nashik discovery map">
            <div className="map-card-glow" />
            <span className="map-card-label">DISCOVER ON THE MAP</span>
            <div className="map-card-route"><i /><i /><i /></div>
            <div className="map-card-pin pin-one">🛕</div>
            <div className="map-card-pin pin-two">🌊</div>
            <div className="map-card-pin pin-three">🍲</div>
            <div className="map-card-caption">
              <strong>One city. Many journeys.</strong>
              <span>Find what is meaningful, nearby, and open to you.</span>
            </div>
          </aside>
        </main>
      </div>

      {/* ── BEST THINGS TO VISIT ─────────────────────────── */}
      <main className="home-content">
        <section className="bttv-section">
          <p className="eyebrow">Explore Nashik</p>
          <h2>Best things to visit</h2>
          <p className="bttv-subtitle">
            Whether you&apos;re a pilgrim, a foodie, or an adventurer — Nashik has something extraordinary for you.
          </p>

          <div className="bttv-grid">
            {bestCategories.map((cat) => (
              <Link
                href={cat.href}
                key={cat.title}
                className="bttv-card"
                style={{
                  "--card-color": cat.color,
                  "--card-bg": cat.bg,
                  "--card-border": cat.border,
                } as React.CSSProperties}
              >
                <div className="bttv-card-top">
                  <span className="bttv-emoji">{cat.emoji}</span>
                  <span className="bttv-explore-tag">Explore →</span>
                </div>
                <h3 className="bttv-title">{cat.title}</h3>
                <p className="bttv-desc">{cat.description}</p>
                <ul className="bttv-links">
                  {cat.links.map((link) => (
                    <li key={link.label}>
                      <span className="bttv-link-dot" />
                      {link.label}
                    </li>
                  ))}
                </ul>
              </Link>
            ))}
          </div>
        </section>

        {/* ── KUMBH CALLOUT ─────────────────────────────── */}
        <section className="kumbh-callout">
          <div>
            <p className="eyebrow light">Kumbh 2027</p>
            <h2>Practical guidance, when it matters most.</h2>
            <p>Find essential locations and planning information. We clearly identify information that is verified or published by official sources.</p>
          </div>
          <Link href="/explore?kumbh=true" className="button light-button">Explore Kumbh places →</Link>
        </section>

        {/* ── PRINCIPLES ───────────────────────────────── */}
        <section className="principles-section">
          <p className="eyebrow">Our promise</p>
          <div className="principle-grid">
            <article><span>01</span><h3>Useful, not overwhelming</h3><p>Quick routes to the information visitors need, especially on a busy travel day.</p></article>
            <article><span>02</span><h3>Trust is visible</h3><p>Every place shows whether its information is community-supplied, verified, or official.</p></article>
            <article><span>03</span><h3>Made for every visitor</h3><p>Mobile-first today, with English, Hindi, and Marathi content planned from the foundation.</p></article>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <span>Discover Nashik</span>
        <span>Built with care for Nashik&apos;s visitors.</span>
      </footer>
    </>
  );
}
