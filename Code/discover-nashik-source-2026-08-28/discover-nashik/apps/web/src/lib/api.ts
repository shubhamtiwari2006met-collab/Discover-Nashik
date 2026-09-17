import type { CategorySummary, Place, PlaceCategory } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

type PlaceFilters = {
  q?: string;
  category?: PlaceCategory | "all";
  kumbh?: boolean;
  featured?: boolean;
  lat?: number;
  lng?: number;
  maxDistance?: number;
};

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json() as Promise<T>;
}

export async function getPlaces(filters: PlaceFilters = {}) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.category && filters.category !== "all") params.set("category", filters.category);
  if (filters.kumbh) params.set("kumbh", "true");
  if (filters.featured) params.set("featured", "true");
  if (filters.lat !== undefined && filters.lng !== undefined) {
    params.set("lat", String(filters.lat));
    params.set("lng", String(filters.lng));
    params.set("maxDistance", String(filters.maxDistance ?? 10000));
  }
  params.set("limit", "100");
  const query = params.toString();
  return request<{ data: Place[]; count: number }>(`/places${query ? `?${query}` : ""}`);
}

export async function getPlace(slug: string) {
  return request<{ data: Place }>(`/places/${slug}`);
}

export async function getCategories() {
  return request<{ data: CategorySummary[] }>("/places/categories");
}
