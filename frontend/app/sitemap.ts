import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { places as staticPlaces } from "@/lib/places";
import { CANONICAL_DESTINATIONS } from "@/lib/placeMatcher";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://discovernashik.co.in";
  const now = new Date();

  // Helper to attach multilingual hreflang alternates
  const withLangAlternates = (url: string) => ({
    languages: {
      "en-IN": url,
      "hi-IN": url,
      "mr-IN": url,
    },
  });

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
      alternates: withLangAlternates(`${baseUrl}/`),
    },
    {
      url: `${baseUrl}/kumbh`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
      alternates: withLangAlternates(`${baseUrl}/kumbh`),
    },
    {
      url: `${baseUrl}/places-to-visit`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.95,
      alternates: withLangAlternates(`${baseUrl}/places-to-visit`),
    },
    {
      url: `${baseUrl}/temples-in-nashik`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.95,
      alternates: withLangAlternates(`${baseUrl}/temples-in-nashik`),
    },
    {
      url: `${baseUrl}/kumbh/dates-planning`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
      alternates: withLangAlternates(`${baseUrl}/kumbh/dates-planning`),
    },
    {
      url: `${baseUrl}/kumbh/getting-around`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
      alternates: withLangAlternates(`${baseUrl}/kumbh/getting-around`),
    },
    {
      url: `${baseUrl}/kumbh/planner`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
      alternates: withLangAlternates(`${baseUrl}/kumbh/planner`),
    },
    {
      url: `${baseUrl}/kumbh/trimbakeshwar`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
      alternates: withLangAlternates(`${baseUrl}/kumbh/trimbakeshwar`),
    },
    {
      url: `${baseUrl}/kumbh/accommodation`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
      alternates: withLangAlternates(`${baseUrl}/kumbh/accommodation`),
    },
    {
      url: `${baseUrl}/kumbh/heritage`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
      alternates: withLangAlternates(`${baseUrl}/kumbh/heritage`),
    },
    {
      url: `${baseUrl}/kumbh/locations`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
      alternates: withLangAlternates(`${baseUrl}/kumbh/locations`),
    },
    {
      url: `${baseUrl}/search`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
      alternates: withLangAlternates(`${baseUrl}/search`),
    },
    {
      url: `${baseUrl}/map`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: withLangAlternates(`${baseUrl}/map`),
    },
    {
      url: `${baseUrl}/business`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.75,
      alternates: withLangAlternates(`${baseUrl}/business`),
    },
    {
      url: `${baseUrl}/kumbh/lost-found`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
      alternates: withLangAlternates(`${baseUrl}/kumbh/lost-found`),
    },
    {
      url: `${baseUrl}/group-tracker`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
      alternates: withLangAlternates(`${baseUrl}/group-tracker`),
    },
  ];

  const placeRoutesMap = new Map<string, MetadataRoute.Sitemap[number]>();

  // Add canonical pilgrimage destinations
  for (const canon of CANONICAL_DESTINATIONS) {
    const url = `${baseUrl}/place/${canon.canonicalId}`;
    placeRoutesMap.set(canon.canonicalId, {
      url,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
      alternates: withLangAlternates(url),
    });
  }

  // Add static places
  for (const sp of staticPlaces) {
    const id = sp._id || (sp as any).id;
    if (id && !placeRoutesMap.has(id)) {
      const url = `${baseUrl}/place/${id}`;
      placeRoutesMap.set(id, {
        url,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8,
        alternates: withLangAlternates(url),
      });
    }
  }

  // Add approved business registrations from Supabase
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const { data: businesses } = await supabase
        .from("business_registrations")
        .select("id, updated_at")
        .eq("verification_status", "approved");

      if (businesses && businesses.length > 0) {
        for (const b of businesses) {
          if (b.id && !placeRoutesMap.has(b.id)) {
            const url = `${baseUrl}/place/${b.id}`;
            placeRoutesMap.set(b.id, {
              url,
              lastModified: b.updated_at ? new Date(b.updated_at) : now,
              changeFrequency: "weekly",
              priority: 0.7,
              alternates: withLangAlternates(url),
            });
          }
        }
      }
    }
  } catch (error) {
    console.error("Error fetching dynamic places for sitemap:", error);
  }

  return [...staticRoutes, ...Array.from(placeRoutesMap.values())];
}
