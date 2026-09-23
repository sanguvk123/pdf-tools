import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf.js resolves its worker module at runtime via a dynamic import that a
  // bundler cannot statically trace. Keeping it external on the server means
  // it is loaded from node_modules as a normal Node module, which resolves
  // correctly. The browser build is unaffected and still code-split.
  serverExternalPackages: ["pdfjs-dist"],
};

export default nextConfig;
