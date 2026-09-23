/**
 * Funnel analytics.
 *
 * Deliberately transport-agnostic: events are pushed to a queue that a real
 * provider can drain later. No personal information is collected — never file
 * names, never file contents, only operation shape and timing.
 */

export type AnalyticsEvent =
  | "page_view"
  | "tool_view"
  | "file_selected"
  | "upload_started"
  | "upload_completed"
  | "processing_started"
  | "processing_completed"
  | "processing_failed"
  | "processing_cancelled"
  | "download_clicked"
  | "download_completed"
  | "secondary_tool_clicked"
  /**
   * Which phrasings lead people to a tool — and, via the queries that return
   * nothing, which words the keyword lists are still missing.
   */
  | "tool_search_selected"
  | "tool_search_no_results"
  /**
   * Whether the suggestion offered after a failure is one people actually
   * take — the difference between a useful escape route and decoration.
   */
  | "error_recovery_clicked";

export interface AnalyticsProperties {
  tool?: string;
  /** "client" or "server" — which path executed the work. */
  engine?: string;
  /** Rounded to the nearest 100 KB so it cannot fingerprint a document. */
  fileSizeBucketKb?: number;
  fileCount?: number;
  durationMs?: number;
  errorCode?: string;
  [key: string]: string | number | boolean | undefined;
}

interface QueuedEvent extends AnalyticsProperties {
  event: AnalyticsEvent;
  timestamp: number;
}

const queue: QueuedEvent[] = [];
const MAX_QUEUE = 100;

/** Buckets a byte count so individual files are not identifiable. */
export function sizeBucketKb(bytes: number): number {
  return Math.round(bytes / 1000 / 100) * 100;
}

/**
 * Where events are sent.
 *
 * Deliberately a direct POST rather than the @vercel/analytics package: that
 * package depends on a Svelte Vite plugin requiring vite 8, while vitest 2
 * pins vite 5. Installing it means --legacy-peer-deps and a test runner on an
 * unsupported dependency tree — a bad trade for a wrapper around one endpoint.
 *
 * The route is relative, so it works on the production domain and on preview
 * deployments without configuration.
 */
const ENDPOINT = "/_vercel/insights/event";

/**
 * Only ever contains data we chose to send. File names, page contents and
 * anything derived from a document are never passed in — sizes arrive
 * pre-bucketed via sizeBucketKb, and a query string is the user's own words
 * about a tool, not about their file.
 */
function send(entry: QueuedEvent): void {
  const body = JSON.stringify({
    name: entry.event,
    // The endpoint expects the page this happened on.
    url: window.location.href,
    data: Object.fromEntries(
      Object.entries(entry).filter(
        ([key, value]) =>
          key !== "event" && key !== "timestamp" && value !== undefined,
      ),
    ),
  });

  // sendBeacon survives the page being closed, which matters because
  // download_clicked is frequently the last thing that happens before the
  // user leaves. A fetch there is routinely cancelled mid-flight.
  if (navigator.sendBeacon?.(ENDPOINT, new Blob([body], { type: "application/json" }))) {
    return;
  }

  // keepalive gives fetch the same survive-unload behaviour where beacon is
  // unavailable or refused. Failures are swallowed: analytics must never
  // surface an error to someone trying to compress a PDF.
  void fetch(ENDPOINT, {
    method: "POST",
    body,
    headers: { "Content-Type": "application/json" },
    keepalive: true,
  }).catch(() => {});
}

export function track(event: AnalyticsEvent, properties: AnalyticsProperties = {}): void {
  if (typeof window === "undefined") return;

  const entry: QueuedEvent = { event, timestamp: Date.now(), ...properties };

  queue.push(entry);
  if (queue.length > MAX_QUEUE) queue.shift();

  if (process.env.NODE_ENV === "development") {
    console.debug("[analytics]", entry.event, properties);
    return;
  }

  try {
    send(entry);
  } catch {
    // An analytics failure is never worth breaking a tool over.
  }
}

/** Recent events, newest last. Kept for debugging; not a transport. */
export function drainEvents(): QueuedEvent[] {
  return queue.splice(0, queue.length);
}
