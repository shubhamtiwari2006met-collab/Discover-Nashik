import { getPlaces } from "@/lib/getPlaces";
import { HomeClient } from "@/components/HomeClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  const initialPlaces = await getPlaces();

  return <HomeClient initialPlaces={initialPlaces} />;
}