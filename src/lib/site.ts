/**
 * The canonical origin for this deployment.
 *
 * Every absolute URL the site emits — canonicals, the sitemap, robots.txt and
 * JSON-LD — must agree on one origin. When they disagree, or point at a
 * domain that is not the one being served, search engines are told the real
 * content lives somewhere else and the pages compete with a host that does
 * not exist.
 *
 * Resolution order:
 *  1. NEXT_PUBLIC_SITE_URL, so a staging or preview deployment can describe
 *     itself accurately instead of claiming to be production.
 *  2. The production domain.
 *
 * Deliberately not derived from VERCEL_URL: that is the per-deployment
 * hostname, which changes on every push, so canonicals would churn and point
 * at throwaway URLs.
 */
const FALLBACK_ORIGIN = "https://www.pdftools.shop";

function resolveOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) return FALLBACK_ORIGIN;

  try {
    // Normalised through URL so a trailing slash or missing scheme in the
    // environment cannot produce doubled slashes in every canonical.
    return new URL(configured).origin;
  } catch {
    return FALLBACK_ORIGIN;
  }
}

/** Origin with no trailing slash, e.g. "https://www.pdftools.shop". */
export const SITE_ORIGIN = resolveOrigin();

/** Absolute URL for a site-relative path. */
export function absoluteUrl(path = "/"): string {
  return new URL(path, SITE_ORIGIN).toString();
}
