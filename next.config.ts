import type { NextConfig } from "next";
import { SYNONYM_REDIRECTS } from "./src/lib/redirects";

const nextConfig: NextConfig = {
  // pdf.js resolves its worker module at runtime via a dynamic import that a
  // bundler cannot statically trace. Keeping it external on the server means
  // it is loaded from node_modules as a normal Node module, which resolves
  // correctly. The browser build is unaffected and still code-split.
  serverExternalPackages: ["pdfjs-dist"],

  // Synonym URLs resolve to their canonical tool with a 301, so search traffic
  // for alternate phrasings lands on the real page instead of a duplicate.
  async redirects() {
    return SYNONYM_REDIRECTS.map(({ from, to }) => ({
      source: `/${from}`,
      destination: `/${to}`,
      permanent: true,
    }));
  },
};

export default nextConfig;
