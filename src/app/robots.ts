import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The conversion endpoint accepts uploads and returns binaries; there is
      // nothing there to index.
      disallow: "/api/",
    },
    sitemap: "https://pdfutility.app/sitemap.xml",
  };
}
