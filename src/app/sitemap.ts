import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/site";
import { TOOLS } from "@/lib/tools";
import { COMPRESS_INTENTS } from "@/lib/compressIntents";
import { COMPRESS_TARGETS } from "@/lib/compressTargets";
import { contentUpdated } from "@/lib/contentDates";

const BASE_URL = SITE_ORIGIN;

/**
 * Generated from the tool registry, so a new tool is indexed automatically
 * rather than relying on someone remembering to update a list.
 *
 * `lastModified` comes from the recorded content dates rather than the build
 * clock. Stamping `new Date()` here — as this previously did — told Google that
 * all 26 pages changed on every deploy, including pages the deploy never
 * touched. Google treats `lastmod` as a hint and discounts a source that always
 * claims to be fresh, so the old behaviour spent the signal to say nothing.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE_URL,
      lastModified: contentUpdated("/"),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/pdf-tools`,
      lastModified: contentUpdated("/pdf-tools"),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...TOOLS.map((tool) => ({
      url: `${BASE_URL}/${tool.slug}`,
      lastModified: contentUpdated(`/${tool.slug}`),
      changeFrequency: "monthly" as const,
      // Featured tools are the ones people actually search for.
      priority: tool.featured ? 0.9 : 0.7,
    })),
    ...COMPRESS_TARGETS.map((target) => ({
      url: `${BASE_URL}/compress-pdf-to-${target.slug}`,
      lastModified: contentUpdated(`/compress-pdf-to-${target.slug}`),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...COMPRESS_INTENTS.map((intent) => ({
      url: `${BASE_URL}/${intent.slug}`,
      lastModified: contentUpdated(`/${intent.slug}`),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
