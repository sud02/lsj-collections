import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/", "/account", "/checkout"] },
    ],
    sitemap: "https://lsjcollections.com/sitemap.xml",
    host: "https://lsjcollections.com",
  };
}
