import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/api/",
        "/profile",
        "/login",
        "/business/dashboard",
        "/business/pending",
        "/kumbh/lost-found/inquiry/",
        "/kumbh/lost-found/report",
      ],
    },
    sitemap: "https://discovernashik.co.in/sitemap.xml",
  };
}
