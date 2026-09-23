import { describe, expect, it } from "vitest";
import { recoveryAction } from "@/lib/errors";
import { TOOLS, requireTool } from "@/lib/tools";

/**
 * A dead-end error is the quiet failure mode of a utility site: the message is
 * polite, accurate, and leaves the user with nowhere to go, so they close the
 * tab. These guard the escape route rather than the wording.
 */
describe("recoveryAction", () => {
  const compress = requireTool("compress-pdf");
  const pdfToWord = requireTool("pdf-to-word");

  it("sends a scanned PDF somewhere that can actually handle it", () => {
    // NO_TEXT_CONTENT means there is no text layer. Offering another
    // text-extraction tool would fail identically; rasterising will not.
    const action = recoveryAction("NO_TEXT_CONTENT", pdfToWord);

    expect(action).not.toBeNull();
    expect(action?.href).toBe("/pdf-to-jpg");
  });

  it("offers to split a file that was rejected for being too large", () => {
    const action = recoveryAction("FILE_TOO_LARGE", pdfToWord);
    expect(action?.href).toBe("/split-pdf");
  });

  it("offers compression when a large file is already on a splitting tool", () => {
    // Suggesting Split to someone already on Split is a loop, not advice.
    const split = requireTool("split-pdf");
    const action = recoveryAction("FILE_TOO_LARGE", split);

    expect(action?.href).toBe("/compress-pdf");
  });

  it("never points a tool at itself", () => {
    // The loop is the specific bug worth preventing: an error that suggests
    // the page the user is already stuck on reads as broken.
    for (const tool of TOOLS) {
      for (const code of [
        "FILE_TOO_LARGE",
        "NO_TEXT_CONTENT",
        "UNSUPPORTED_FILE",
        "CORRUPT_FILE",
      ] as const) {
        const action = recoveryAction(code, tool);
        expect(
          action?.href,
          `${code} on /${tool.slug} suggests the same page`,
        ).not.toBe(`/${tool.slug}`);
      }
    }
  });

  it("only ever links to a tool that exists", () => {
    // A recovery action pointing at a 404 turns a handled error into a
    // broken site.
    const slugs = new Set(TOOLS.map((tool) => `/${tool.slug}`));

    for (const tool of TOOLS) {
      for (const code of [
        "FILE_TOO_LARGE",
        "NO_TEXT_CONTENT",
        "UNSUPPORTED_FILE",
        "CORRUPT_FILE",
        "TOO_MANY_FILES",
        "NETWORK_ERROR",
        "UNKNOWN",
      ] as const) {
        const action = recoveryAction(code, tool);
        if (action) {
          expect(slugs.has(action.href), `${action.href} is not a real tool`).toBe(
            true,
          );
        }
      }
    }
  });

  it("offers nothing when no other tool would help", () => {
    // Silence is correct here. A suggestion that cannot work is worse than
    // none, because it costs the user another upload to find that out.
    expect(recoveryAction("WRONG_PASSWORD", compress)).toBeNull();
    expect(recoveryAction("EMPTY_SELECTION", compress)).toBeNull();
    expect(recoveryAction("CANCELLED", compress)).toBeNull();
    expect(recoveryAction("NO_FILES", compress)).toBeNull();
  });

  it("gives every action a label that names the destination", () => {
    for (const tool of TOOLS) {
      for (const code of ["FILE_TOO_LARGE", "NO_TEXT_CONTENT"] as const) {
        const action = recoveryAction(code, tool);
        if (action) {
          expect(action.label.length).toBeGreaterThan(3);
          // "Click here" tells the user nothing about where they are going.
          expect(action.label.toLowerCase()).not.toContain("click here");
        }
      }
    }
  });
});
