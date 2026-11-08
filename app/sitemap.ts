import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// Google ke liye website ke khule pages ki list (https://.../sitemap.xml par dikhti hai)
const BUILT = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  const page = (path: string, priority: number, changeFrequency: "weekly" | "monthly" | "yearly") => ({
    url: `${SITE.url}${path}`, lastModified: BUILT, changeFrequency, priority,
  });
  return [page("", 1, "weekly"), page("/about", 0.6, "monthly"), page("/contact", 0.5, "monthly"), page("/privacy", 0.3, "yearly"), page("/terms", 0.3, "yearly")];
}
