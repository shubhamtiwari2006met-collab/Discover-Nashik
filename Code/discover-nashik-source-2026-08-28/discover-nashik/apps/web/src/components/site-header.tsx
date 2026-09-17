import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link href="/" className="brand" aria-label="Discover Nashik home">
        <span className="brand-mark">न</span>
        <span>Discover <strong>Nashik</strong></span>
      </Link>
      <nav aria-label="Primary navigation">
        <Link href="/explore">Explore</Link>
        <Link href="/explore?kumbh=true">Kumbh 2027</Link>
      </nav>
    </header>
  );
}
