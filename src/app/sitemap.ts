import type { MetadataRoute } from "next";
import { TOOLS } from "@/lib/tools";
import { COMPRESS_INTENTS } from "@/lib/compressIntents";
import { COMPRESS_TARGETS } from "@/lib/compressTargets";

const BASE_URL = "https://pdfutility.app";

/**
 * Generated from the tool registry, so a new tool is indexed automatically
 * rather than relying on someone remembering to update a list.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: BASE_URL,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/pdf-tools`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...TOOLS.map((tool) => ({
      url: `${BASE_URL}/${tool.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      // Featured tools are the ones people actually search for.
      priority: tool.featured ? 0.9 : 0.7,
    })),
    ...COMPRESS_TARGETS.map((target) => ({
      url: `${BASE_URL}/compress-pdf-to-${target.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...COMPRESS_INTENTS.map((intent) => ({
      url: `${BASE_URL}/${intent.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
