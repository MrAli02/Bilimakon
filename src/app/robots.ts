import { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: ["/", "/login", "/register"], disallow: ["/dashboard", "/admin", "/api/", "/activate"] }],
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://bilimmakon.uz"}/sitemap.xml`,
  };
}
