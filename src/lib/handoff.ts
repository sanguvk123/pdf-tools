"use client";

/**
 * Carries a finished file from one tool to the next.
 *
 * After compressing a PDF people often realise they also want to merge or
 * convert it. Making them find the file again and re-upload it is the single
 * most annoying thing a utility site can do, so the result is kept in memory
 * and offered to the next tool.
 *
 * Deliberately a plain module variable rather than storage:
 *
 * - sessionStorage cannot hold a File, and serialising megabytes of base64
 *   would be slow and memory-hungry.
 * - Nothing survives a refresh or a new tab, which matches the privacy promise
 *   made on every page: the document never leaves the device and is not kept.
 *
 * The trade-off is that the handoff only works through in-app navigation. That
 * is exactly the journey it is for, and the tool still works normally without
 * it — this is an accelerator, never a dependency.
 */

export interface Handoff {
  /** The produced file, ready to be used as the next tool's input. */
  file: File;
  /** Slug of the tool that produced it, for analytics and copy. */
  fromSlug: string;
  /** When it was produced, so a stale handoff can be ignored. */
  createdAt: number;
}

/** Handoffs older than this are dropped as stale. */
const MAX_AGE_MS = 10 * 60 * 1000;

let pending: Handoff | null = null;

export function setHandoff(file: File, fromSlug: string): void {
  pending = { file, fromSlug, createdAt: Date.now() };
}

/**
 * Returns the pending handoff and clears it, so a file is only ever picked up
 * once. Reloading a tool page must not silently repopulate it.
 */
export function takeHandoff(): Handoff | null {
  const handoff = pending;
  pending = null;

  if (!handoff) return null;
  if (Date.now() - handoff.createdAt > MAX_AGE_MS) return null;

  return handoff;
}

export function clearHandoff(): void {
  pending = null;
}
