import { ExploreClient } from "../../components/explore-client";
import { SiteHeader } from "../../components/site-header";

export default async function ExplorePage({
  searchParams
}: {
  searchParams: Promise<{ category?: string; kumbh?: string }>;
}) {
  const params = await searchParams;
  return (
    <>
      <div className="page-header"><SiteHeader /></div>
      <ExploreClient initialCategory={params.category} initialKumbh={params.kumbh === "true"} />
    </>
  );
}
