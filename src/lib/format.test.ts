import { describe, expect, it } from "vitest";
import {
  formatBytes,
  formatPageRanges,
  outputName,
  parsePageRanges,
  reductionPercent,
  stripExtension,
} from "@/lib/format";

describe("formatBytes", () => {
  it("formats across unit boundaries", () => {
    expect(formatBytes(640)).toBe("640 bytes");
    expect(formatBytes(912_000)).toBe("912 KB");
    expect(formatBytes(8_400_000)).toBe("8.4 MB");
    expect(formatBytes(1_500_000_000)).toBe("1.5 GB");
  });

  it("returns a placeholder for invalid input", () => {
    expect(formatBytes(-1)).toBe("—");
    expect(formatBytes(Number.NaN)).toBe("—");
  });
});

describe("reductionPercent", () => {
  it("reports the saving for a smaller output", () => {
    expect(reductionPercent(8_400_000, 1_700_000)).toBe(80);
  });

  it("never reports a negative saving when the output grew", () => {
    expect(reductionPercent(1000, 1400)).toBe(0);
  });

  it("handles an empty input safely", () => {
    expect(reductionPercent(0, 0)).toBe(0);
  });
});

describe("filename helpers", () => {
  it("strips the extension but keeps dotfiles intact", () => {
    expect(stripExtension("Resume.pdf")).toBe("Resume");
    expect(stripExtension("report.final.pdf")).toBe("report.final");
    expect(stripExtension("noextension")).toBe("noextension");
  });

  it("builds a suffixed output name", () => {
    expect(outputName("Resume.pdf", "compressed", "pdf")).toBe(
      "Resume-compressed.pdf",
    );
  });
});

describe("parsePageRanges", () => {
  it("parses mixed singles and ranges into sorted unique pages", () => {
    expect(parsePageRanges("1-3, 8, 11-12", 20)).toEqual([1, 2, 3, 8, 11, 12]);
  });

  it("clamps to the document and drops out-of-range pages", () => {
    expect(parsePageRanges("1-99", 3)).toEqual([1, 2, 3]);
    expect(parsePageRanges("40", 3)).toEqual([]);
  });

  it("accepts a reversed range", () => {
    expect(parsePageRanges("5-3", 10)).toEqual([3, 4, 5]);
  });

  it("ignores malformed input instead of throwing", () => {
    expect(parsePageRanges("abc, , --, 2", 5)).toEqual([2]);
    expect(parsePageRanges("", 5)).toEqual([]);
  });

  it("de-duplicates overlapping ranges", () => {
    expect(parsePageRanges("1-3, 2-4", 10)).toEqual([1, 2, 3, 4]);
  });
});

describe("formatPageRanges", () => {
  it("collapses consecutive pages", () => {
    expect(formatPageRanges([1, 2, 3, 5, 9, 10])).toBe("1-3, 5, 9-10");
  });

  it("returns an empty string with no pages", () => {
    expect(formatPageRanges([])).toBe("");
  });

  it("round-trips with parsePageRanges", () => {
    const pages = parsePageRanges("2-4, 7", 10);
    expect(parsePageRanges(formatPageRanges(pages), 10)).toEqual(pages);
  });
});
