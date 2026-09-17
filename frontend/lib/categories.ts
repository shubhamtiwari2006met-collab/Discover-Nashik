export type CategoryDefinition = {
  name: string;
  aliases: string[];
  placeCategories: string[];
};

export const categoryDefinitions: CategoryDefinition[] = [
  { name: "Temples & Spiritual", aliases: ["temples & spiritual", "temples & religious places", "temples", "spiritual", "religious", "temple"], placeCategories: ["Temples & Spiritual", "Temples", "Spiritual Places", "Temples & Religious Places"] },
  { name: "Mountain & Treks", aliases: ["mountain & treks", "mountains", "treks", "trekking", "trek", "hiking"], placeCategories: ["Mountain & Treks", "Treks", "Trekking"] },
  { name: "Hotels & Stays", aliases: ["hotels & stays", "hotels", "hotel", "stays", "stay", "accommodation", "resorts", "resort", "lodging", "pg", "rooms", "room"], placeCategories: ["Hotels & Stays", "Hotels"] },
  { name: "Restaurant & Food", aliases: ["restaurant & food", "food & restaurants", "restaurants", "restaurant", "food", "dining", "cuisine", "cafe", "cafes", "café", "cafés", "catering", "caters", "eatery", "bakery", "dhaba", "mess"], placeCategories: ["Restaurant & Food", "Food & Restaurants", "Food", "Catering"] },
  { name: "Wineries", aliases: ["wineries", "winery", "vineyards", "vineyard", "wine"], placeCategories: ["Wineries", "Vineyards"] },
  { name: "Tourist Spots", aliases: ["tourist spots", "tourist attractions", "tourist", "sightseeing", "attractions", "museum"], placeCategories: ["Tourist Spots", "Tourist Attractions"] },
  { name: "Family Activities", aliases: ["family activities", "family", "kids", "children", "park", "garden"], placeCategories: ["Family Activities"] },
  { name: "Events", aliases: ["events", "event", "festivals", "festival", "kumbh"], placeCategories: ["Events"] },
  { name: "Nature", aliases: ["nature", "outdoors", "lakes", "lake", "dam"], placeCategories: ["Nature"] },
  { name: "Waterfalls", aliases: ["waterfalls", "waterfall", "falls"], placeCategories: ["Waterfalls"] },
  { name: "Shopping", aliases: ["shopping & retail", "shopping", "retail", "grocery stores", "grocery", "grocery shop", "markets", "market", "malls", "mall", "shop", "shops", "store", "stores"], placeCategories: ["Shopping & Retail", "Shopping", "Grocery Stores"] },
  { name: "Emergency", aliases: ["emergency", "healthcare", "hospitals", "hospital", "medical", "clinic", "clinics", "pharmacy", "doctor", "doctors", "ambulance", "police", "fire station", "icu", "er", "chemist"], placeCategories: ["Emergency", "Healthcare"] },
  { name: "Services", aliases: ["services", "service", "travel & transport", "travel", "transport", "cab", "taxi", "rentals", "atm", "atms", "bank", "banks", "parking", "petrol pump", "gas station", "mechanic", "garage"], placeCategories: ["Services", "Travel & Transport"] },
];

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export function resolveCategory(query: string): CategoryDefinition | undefined {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return undefined;

  return categoryDefinitions.find((category) =>
    category.aliases.some((alias) => {
      const normalizedAlias = normalize(alias);
      return normalizedQuery === normalizedAlias || normalizedQuery.includes(normalizedAlias) || normalizedAlias.includes(normalizedQuery);
    }),
  );
}

