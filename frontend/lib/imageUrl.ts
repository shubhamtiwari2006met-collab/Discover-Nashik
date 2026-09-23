export const DEFAULT_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1596700508005-4f05ab04c997?auto=format&fit=crop&w=800&q=80";

/**
 * Normalizes a single image URL or base64 string.
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

  const trimmed = rawUrl.trim();
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
 * Parses a photos field (which may be a string with newlines, JSON string, or array)
 * into a list of normalized image URLs.
 */
export function parsePhotoList(photos?: unknown, fallback: string = DEFAULT_FALLBACK_IMAGE): string[] {
  if (!photos) return [fallback];

  let rawList: string[] = [];

  if (Array.isArray(photos)) {
    rawList = photos.map(String);
  } else if (typeof photos === "string") {
    const trimmed = photos.trim();
    if (!trimmed) return [fallback];

    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          rawList = parsed.map(String);
        }
      } catch {
        rawList = trimmed.split("\n");
      }
    } else {
      rawList = trimmed.split("\n");
    }
  }

  const normalizedList = rawList
    .map((item) => normalizeImageUrl(item, ""))
    .filter((url) => Boolean(url));

  return normalizedList.length > 0 ? normalizedList : [fallback];
}
