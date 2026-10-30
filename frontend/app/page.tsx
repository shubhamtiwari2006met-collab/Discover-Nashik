import { getPlaces } from "@/lib/getPlaces";
import { HomeClient } from "@/components/HomeClient";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export default async function Home() {
  const allPlaces = await getPlaces();

  let initialPlaces = allPlaces;
  try {
    const dataFile = path.join(process.cwd(), "data", "homepage-config.json");
    if (fs.existsSync(dataFile)) {
      const config = JSON.parse(fs.readFileSync(dataFile, "utf-8"));
      if (config && Array.isArray(config.places) && config.places.length > 0) {
        const placeMap = new Map(allPlaces.map((p) => [p._id, p]));
        const ordered: typeof allPlaces = [];
        const visibleEntries = config.places
          .filter((p: any) => p.visible !== false)
          .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

        for (const entry of visibleEntries) {
          const p = placeMap.get(entry.placeId);
          if (p) ordered.push(p);
        }
        if (ordered.length > 0) {
          initialPlaces = ordered;
        }
      }
    }
  } catch {
    // Fallback to allPlaces if config cannot be read
  }

  return <HomeClient initialPlaces={initialPlaces} />;
}