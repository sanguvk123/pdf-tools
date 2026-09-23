import { describe, expect, it } from "vitest";
import { TOOLS } from "@/lib/tools";

/**
 * A false privacy claim is the one bug here that never announces itself: the
 * page looks fine, the tests pass, and the only symptom is that a user was
 * told their file stayed on their device when it did not.
 *
 * The badge beside the upload button is driven by tool.engine, so these guard
 * the data that drives it.
 */
describe("privacy claims", () => {
  it("marks every tool as either browser-based or server-based", () => {
    for (const tool of TOOLS) {
      expect(
        ["client", "server"],
        `${tool.slug} has an unrecognised engine, so the privacy badge cannot describe it`,
      ).toContain(tool.engine);
    }
  });

  it("never claims a server tool keeps files on the device", () => {
    const serverTools = TOOLS.filter((tool) => tool.engine === "server");

    // These tools upload the file. Any copy promising the opposite is a lie,
    // regardless of how the badge happens to render.
    const forbidden =
      /stays? on your device|never leaves|nothing is uploaded|not sent anywhere|entirely on your device|in your browser/i;

    for (const tool of serverTools) {
      const copy = [
        tool.subtitle,
        tool.tagline,
        tool.metaDescription,
        ...tool.faq.flatMap((item) => [item.q, item.a]),
      ].join(" ");

      expect(
        forbidden.test(copy),
        `${tool.slug} runs on the server but its copy implies local processing`,
      ).toBe(false);
    }
  });

  it("tells the user, on every server tool, that the file is uploaded", () => {
    const serverTools = TOOLS.filter((tool) => tool.engine === "server");
    expect(serverTools.length).toBeGreaterThan(0);

    for (const tool of serverTools) {
      const copy = [
        tool.subtitle,
        tool.metaDescription,
        ...tool.faq.flatMap((item) => [item.q, item.a]),
      ].join(" ");

      expect(
        /server|upload/i.test(copy),
        `${tool.slug} uploads the file but never says so`,
      ).toBe(true);
    }
  });
});
