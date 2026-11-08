import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// Google ko batata hai: khule pages dekho, login wale private hisse mat dekho.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/auth/", "/profile", "/tasks", "/books", "/courses", "/mock-tests", "/results"],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
