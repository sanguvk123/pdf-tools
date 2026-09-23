import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sizeBucketKb, track } from "@/lib/analytics";

/**
 * The risk here is not a missing chart. It is a privacy page that says files
 * never leave your device while a beacon quietly carries a filename to a
 * server. These assert what is on the wire, not what the UI claims.
 */

interface Beacon {
  url: string;
  payload: { name: string; url: string; data: Record<string, unknown> };
}

const sent: Beacon[] = [];

beforeEach(() => {
  sent.length = 0;

  vi.stubGlobal("window", { location: { href: "https://www.pdftools.shop/compress-pdf" } });
  vi.stubGlobal("navigator", {
    sendBeacon: (url: string, blob: Blob) => {
      // Blob.text() is async; the payload is captured synchronously here via
      // the constructor argument the implementation passes in.
      void blob.text().then((text) => {
        sent.push({ url, payload: JSON.parse(text) });
      });
      return true;
    },
  });
  vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response())));

  // track() short-circuits to console.debug in development.
  vi.stubEnv("NODE_ENV", "production");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

async function flush(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("analytics transport", () => {
  it("actually sends the event rather than queueing it into nothing", async () => {
    // The bug this replaces: track() pushed to an in-memory array that was
    // never drained, so every event was discarded on navigation.
    track("tool_view", { tool: "compress-pdf" });
    await flush();

    expect(sent).toHaveLength(1);
    expect(sent[0].payload.name).toBe("tool_view");
  });

  it("uses sendBeacon so a download click survives the page closing", async () => {
    // download_clicked is frequently the last thing before the tab closes; a
    // plain fetch there is routinely cancelled in flight.
    track("download_clicked", { tool: "compress-pdf" });
    await flush();

    expect(sent).toHaveLength(1);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("falls back to fetch when sendBeacon refuses", async () => {
    vi.stubGlobal("navigator", { sendBeacon: () => false });

    track("tool_view", { tool: "merge-pdf" });
    await flush();

    expect(globalThis.fetch).toHaveBeenCalledOnce();
  });

  it("never throws into the caller when the transport fails", () => {
    vi.stubGlobal("navigator", {
      sendBeacon: () => {
        throw new Error("blocked by extension");
      },
    });
    vi.stubGlobal("fetch", () => {
      throw new Error("offline");
    });

    // A blocked beacon must not take down the tool the user came for.
    expect(() => track("processing_completed", { tool: "compress-pdf" })).not.toThrow();
  });

  it("sends nothing at all during server rendering", () => {
    vi.stubGlobal("window", undefined);

    expect(() => track("page_view")).not.toThrow();
    expect(sent).toHaveLength(0);
  });

  it("buckets file sizes so an individual document is not identifiable", () => {
    // A byte-exact size is close to a fingerprint for a specific file.
    expect(sizeBucketKb(1_234_567)).toBe(1200);
    expect(sizeBucketKb(1_249_999)).toBe(1200);
    expect(sizeBucketKb(49_000)).toBe(0);

    // Two different files in the same bracket must be indistinguishable.
    expect(sizeBucketKb(2_010_000)).toBe(sizeBucketKb(2_040_000));
  });

  it("carries no filename or document content", async () => {
    track("file_selected", {
      tool: "compress-pdf",
      engine: "client",
      fileSizeBucketKb: sizeBucketKb(2_400_000),
      fileCount: 1,
    });
    await flush();

    // Checked against the event data only. The top-level url is the tool page
    // the user is on — "/compress-pdf" legitimately contains ".pdf" — and
    // asserting over the whole payload confuses a route with a document.
    const data = JSON.stringify(sent[0].payload.data).toLowerCase();

    for (const forbidden of ["resume", "filename", "content", ".docx"]) {
      expect(data, `event data leaked "${forbidden}"`).not.toContain(forbidden);
    }

    // Positively assert the shape: only these keys are ever transmitted.
    expect(Object.keys(sent[0].payload.data).sort()).toEqual([
      "engine",
      "fileCount",
      "fileSizeBucketKb",
      "tool",
    ]);
  });
});
