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
  | "secondary_tool_clicked";

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

export function track(event: AnalyticsEvent, properties: AnalyticsProperties = {}): void {
  if (typeof window === "undefined") return;

  const entry: QueuedEvent = { event, timestamp: Date.now(), ...properties };

  queue.push(entry);
  if (queue.length > MAX_QUEUE) queue.shift();

  // Hook for a real provider. Until one is configured this is a no-op in
  // production and a useful trace in development.
  if (process.env.NODE_ENV === "development") {
    console.debug("[analytics]", entry.event, properties);
  }
}

/** Exposed for a future transport to flush on pagehide. */
export function drainEvents(): QueuedEvent[] {
  return queue.splice(0, queue.length);
}
