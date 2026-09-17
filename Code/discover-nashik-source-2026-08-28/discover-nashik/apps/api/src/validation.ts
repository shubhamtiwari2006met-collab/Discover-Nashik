import { z } from "zod";
import { PLACE_CATEGORIES } from "./models/place.js";

const pointSchema = z.object({
  type: z.literal("Point").default("Point"),
  coordinates: z.tuple([
    z.number().min(-180).max(180),
    z.number().min(-90).max(90)
  ])
});

export const createPlaceSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  category: z.enum(PLACE_CATEGORIES),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  shortDescription: z.string().trim().min(10).max(240),
  description: z.string().trim().max(4000).optional(),
  translations: z.array(z.object({
    language: z.enum(["en", "hi", "mr"]),
    name: z.string().trim().min(2).max(120),
    shortDescription: z.string().trim().max(240).optional(),
    description: z.string().trim().max(4000).optional()
  })).max(2).default([]),
  location: pointSchema,
  address: z.string().trim().min(4).max(300),
  area: z.string().trim().max(80).optional(),
  timings: z.string().trim().max(160).optional(),
  contactNumber: z.string().trim().max(40).optional(),
  website: z.string().url().optional(),
  photos: z.array(z.string().url()).max(12).default([]),
  facilities: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
  highlights: z.array(z.string().trim().min(1).max(100)).max(10).default([]),
  kumbhRelevant: z.boolean().default(false),
  featured: z.boolean().default(false),
  verificationStatus: z.enum(["community", "verified", "official"]).default("community"),
  sourceName: z.string().trim().max(160).optional(),
  sourceUrl: z.string().url().optional(),
  lastVerifiedAt: z.coerce.date().optional(),
  published: z.boolean().default(true)
});

export const updatePlaceSchema = createPlaceSchema.partial();
