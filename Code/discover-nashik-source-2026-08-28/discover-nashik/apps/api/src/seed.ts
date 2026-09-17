import "dotenv/config";
import { connectDatabase } from "./db.js";
import { PlaceModel, type Place } from "./models/place.js";

// Demonstration records only. Verify every visitor-facing detail before publishing.
type SeedPlace = Pick<
  Place,
  | "name"
  | "slug"
  | "category"
  | "tags"
  | "shortDescription"
  | "description"
  | "location"
  | "address"
  | "area"
  | "facilities"
  | "highlights"
  | "kumbhRelevant"
  | "featured"
  | "verificationStatus"
  | "sourceName"
  | "published"
>;

const places: SeedPlace[] = [
  {
    name: "Ram Kund",
    slug: "ram-kund",
    category: "ghat",
    tags: ["panchavati", "godavari", "pilgrimage", "kumbh"],
    shortDescription: "Historic bathing ghat on the Godavari in Panchavati.",
    description: "A central Panchavati landmark for pilgrims and visitors. Confirm event-specific access and safety guidance before travel.",
    location: { type: "Point", coordinates: [73.7919, 20.0054] },
    address: "Panchavati, Nashik, Maharashtra",
    area: "Panchavati",
    facilities: ["Nearby food", "Public transport nearby"],
    highlights: ["Godavari riverfront", "Pilgrimage landmark"],
    kumbhRelevant: true,
    featured: true,
    verificationStatus: "community",
    sourceName: "Initial platform dataset",
    published: true
  },
  {
    name: "Kalaram Temple",
    slug: "kalaram-temple",
    category: "temple",
    tags: ["panchavati", "ram", "heritage", "pilgrimage"],
    shortDescription: "Prominent historic temple in the Panchavati area.",
    description: "A major religious landmark for Nashik visitors. Opening hours and entry information must be confirmed by an administrator.",
    location: { type: "Point", coordinates: [73.793, 20.0064] },
    address: "Panchavati, Nashik, Maharashtra",
    area: "Panchavati",
    facilities: ["Nearby food", "Public transport nearby"],
    highlights: ["Historic architecture", "Near Ram Kund"],
    kumbhRelevant: true,
    featured: true,
    verificationStatus: "community",
    sourceName: "Initial platform dataset",
    published: true
  },
  {
    name: "Sita Gufa",
    slug: "sita-gufa",
    category: "temple",
    tags: ["panchavati", "cave", "ramayana", "pilgrimage"],
    shortDescription: "Small religious cave site in the Panchavati temple precinct.",
    description: "Popular with pilgrims visiting Panchavati. Accessibility and queue conditions may vary.",
    location: { type: "Point", coordinates: [73.7935, 20.0069] },
    address: "Panchavati, Nashik, Maharashtra",
    area: "Panchavati",
    facilities: ["Nearby food"],
    highlights: ["Panchavati trail", "Religious landmark"],
    kumbhRelevant: true,
    featured: false,
    verificationStatus: "community",
    sourceName: "Initial platform dataset",
    published: true
  },
  {
    name: "Trimbakeshwar Temple",
    slug: "trimbakeshwar-temple",
    category: "temple",
    tags: ["trimbakeshwar", "jyotirlinga", "pilgrimage", "kumbh"],
    shortDescription: "Important Shiva temple in Trimbak, west of Nashik.",
    description: "A key pilgrimage destination in the Nashik region. Confirm temple rules, access, and travel time before visiting.",
    location: { type: "Point", coordinates: [73.5302, 19.9399] },
    address: "Trimbak, Nashik district, Maharashtra",
    area: "Trimbak",
    facilities: ["Food nearby", "Parking nearby"],
    highlights: ["Major pilgrimage site", "Kumbh relevance"],
    kumbhRelevant: true,
    featured: true,
    verificationStatus: "community",
    sourceName: "Initial platform dataset",
    published: true
  },
  {
    name: "Pandavleni Caves",
    slug: "pandavleni-caves",
    category: "nature",
    tags: ["caves", "heritage", "hike", "views"],
    shortDescription: "Ancient cave complex on a hill overlooking Nashik.",
    description: "A heritage and viewpoint destination. Check the official site for access arrangements and current timings.",
    location: { type: "Point", coordinates: [73.7675, 19.9625] },
    address: "Ambedkar Nagar, Nashik, Maharashtra",
    area: "Nashik Road",
    facilities: ["Parking nearby"],
    highlights: ["Hill views", "Historic caves"],
    kumbhRelevant: false,
    featured: true,
    verificationStatus: "community",
    sourceName: "Initial platform dataset",
    published: true
  },
  {
    name: "Sula Vineyards",
    slug: "sula-vineyards",
    category: "vineyard",
    tags: ["vineyard", "wine", "tourism", "gangapur"],
    shortDescription: "Well-known vineyard experience near Nashik.",
    description: "A popular leisure destination. Check the operator's official channels for bookings, access, and age restrictions.",
    location: { type: "Point", coordinates: [73.6927, 20.0023] },
    address: "Gangapur-Savargaon Road, Nashik, Maharashtra",
    area: "Gangapur",
    facilities: ["Parking nearby", "Food nearby"],
    highlights: ["Vineyard landscape", "Leisure experience"],
    kumbhRelevant: false,
    featured: true,
    verificationStatus: "community",
    sourceName: "Initial platform dataset",
    published: true
  }
];

async function seed() {
  await connectDatabase();
  const operations = places.map((place) => ({
    updateOne: {
      filter: { slug: place.slug },
      update: { $set: place },
      upsert: true
    }
  }));
  const result = await PlaceModel.bulkWrite(operations);
  console.log(`Seed complete: ${result.upsertedCount} created, ${result.modifiedCount} updated.`);
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed", error);
  process.exit(1);
});
