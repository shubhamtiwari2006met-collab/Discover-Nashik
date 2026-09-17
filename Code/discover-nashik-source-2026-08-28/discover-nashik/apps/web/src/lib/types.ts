export type PlaceCategory =
  | "temple"
  | "ghat"
  | "food"
  | "hotel"
  | "nature"
  | "vineyard"
  | "trek"
  | "shopping"
  | "parking"
  | "hospital"
  | "transport"
  | "essential";

export type VerificationStatus = "community" | "verified" | "official";

export interface Place {
  _id: string;
  name: string;
  slug: string;
  category: PlaceCategory;
  tags: string[];
  shortDescription: string;
  description?: string;
  location: { type: "Point"; coordinates: [number, number] };
  address: string;
  area?: string;
  timings?: string;
  contactNumber?: string;
  website?: string;
  photos: string[];
  facilities: string[];
  highlights: string[];
  kumbhRelevant: boolean;
  featured: boolean;
  verificationStatus: VerificationStatus;
  sourceName?: string;
  sourceUrl?: string;
  lastVerifiedAt?: string;
}

export interface CategorySummary {
  slug: PlaceCategory;
  count: number;
}
