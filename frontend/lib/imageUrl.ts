export const DEFAULT_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1596700508005-4f05ab04c997?auto=format&fit=crop&w=800&q=80";

/**
 * Extracts nested target image URLs from search engine redirects and viewer wrappers:
 * - Yahoo Images (e.g. in.images.search.yahoo.com/search/images;...?imgurl=https%3A%2F%2F...)
 * - Google Images (e.g. google.com/imgres?imgurl=https%3A%2F%2F... or /url?q=...)
 * - Bing Images (e.g. bing.com/images/search?...&mediaurl=https%3A%2F%2F...)
 * - Generic wrapper parameters (imgurl, mediaurl, image_url, img_url, url, src)
 */
function extractNestedImageUrl(urlStr: string): string | null {
  if (!urlStr || typeof urlStr !== "string") return null;
  const trimmed = urlStr.trim().replace(/^["'`]|["'`]$/g, "");

  // Quick check if string contains common search engine / wrapper parameters
  if (!/(?:imgurl|mediaurl|image_url|img_url|[?&](?:url|src|q)=http)/i.test(trimmed)) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    const searchParams = parsed.searchParams;
    const candidateKeys = ["imgurl", "mediaurl", "image_url", "img_url", "url", "src", "q"];

    for (const key of candidateKeys) {
      const val = searchParams.get(key);
      if (val) {
        let decoded = val.trim();
        try {
          decoded = decodeURIComponent(decoded);
        } catch {
          // ignore decode error
        }
        if (/^https?:\/\//i.test(decoded)) {
          const nested = extractNestedImageUrl(decoded);
          return nested || decoded;
        }
      }
    }
  } catch {
    // Regex fallback if URL parsing failed due to matrix/custom parameters
    const match = trimmed.match(/(?:imgurl|mediaurl|image_url|img_url)=(https?%3A%2F%2F[^&]+|https?:\/\/[^&]+)/i);
    if (match && match[1]) {
      try {
        let decoded = decodeURIComponent(match[1]);
        if (/^https?:\/\//i.test(decoded)) return decoded;
      } catch {
        // ignore
      }
    }
  }
  return null;
}

/**
 * Normalizes a single image URL or base64 string.
 * - Unwraps nested image URLs from search engine redirect/result pages (Yahoo, Google, Bing, etc.)
 * - Preserves relative upload paths (/uploads/xyz.jpg or uploads/xyz.jpg -> /uploads/xyz.jpg)
 * - Preserves valid HTTP and HTTPS URLs including query parameters (e.g. ?w=800&q=80)
 * - Preserves Data URLs (data:image/...)
 * - Rejects dangerous protocols (javascript:, file:, vbscript:)
 * - Returns a fallback image if empty or invalid
 */
export function normalizeImageUrl(rawUrl?: string | null, fallback: string = DEFAULT_FALLBACK_IMAGE): string {
  if (!rawUrl || typeof rawUrl !== "string") {
    return fallback;
  }

  // Strip whitespace and any accidental wrapping quotes/backticks
  let trimmed = rawUrl.trim().replace(/^["'`]|["'`]$/g, "");
  if (!trimmed) {
    return fallback;
  }

  // Handle JSON stringified URLs (e.g. '["http://..."]')
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return normalizeImageUrl(String(parsed[0]), fallback);
      }
    } catch {
      // Ignore JSON parse error and continue
    }
  }

  // Handle multiline inputs if a single string contains newlines
  if (trimmed.includes("\n")) {
    const firstLine = trimmed.split("\n").map((s) => s.trim()).filter(Boolean)[0];
    if (firstLine) {
      return normalizeImageUrl(firstLine, fallback);
    }
  }

  // Handle Base64 data URLs
  if (trimmed.startsWith("data:image/")) {
    return trimmed;
  }

  // Block unsafe protocols
  const lower = trimmed.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("file:") || lower.startsWith("vbscript:")) {
    return fallback;
  }

  // Handle relative upload paths
  if (trimmed.startsWith("uploads/")) {
    return `/${trimmed}`;
  }
  if (trimmed.startsWith("/uploads/") || trimmed.startsWith("/images/")) {
    return trimmed;
  }

  // Check if this is a search engine viewer/redirect URL that contains a nested image URL
  const extracted = extractNestedImageUrl(trimmed);
  if (extracted) {
    trimmed = extracted;
  }

  // Handle absolute HTTP / HTTPS URLs
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        return trimmed;
      }
    } catch {
      return fallback;
    }
  }

  // Relative image filename/path fallback
  if (/^[a-zA-Z0-9_\-\.\/]+$/.test(trimmed) && (trimmed.endsWith(".jpg") || trimmed.endsWith(".jpeg") || trimmed.endsWith(".png") || trimmed.endsWith(".webp") || trimmed.endsWith(".svg"))) {
    return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  }

  return trimmed || fallback;
}

/**
 * Parses a photos field (which may be a string with newlines, commas, JSON string, or array)
 * into a clean list of normalized, working image URLs.
 */
export function parsePhotoList(photos?: unknown, fallback: string = DEFAULT_FALLBACK_IMAGE): string[] {
  if (!photos) return [fallback];

  let rawList: string[] = [];

  if (Array.isArray(photos)) {
    rawList = photos.map((p) => String(p || ""));
  } else if (typeof photos === "string") {
    const trimmed = photos.trim();
    if (!trimmed) return [fallback];

    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          rawList = parsed.map((p) => String(p || ""));
        }
      } catch {
        // Fall back to splitting
        rawList = trimmed.replace(/^\[|\]$/g, "").split(/[\n,;]+/);
      }
    } else if (trimmed.includes("\n")) {
      rawList = trimmed.split("\n");
    } else if (trimmed.includes(",") && (trimmed.includes("http://") || trimmed.includes("https://"))) {
      // Split on comma only if it's separating multiple URLs
      rawList = trimmed.split(/,(?=\s*https?:\/\/)/i);
    } else {
      rawList = [trimmed];
    }
  }

  const normalizedList = rawList
    .map((item) => normalizeImageUrl(item, ""))
    .filter((url) => Boolean(url) && url !== DEFAULT_FALLBACK_IMAGE);

  return normalizedList.length > 0 ? normalizedList : [fallback];
}
