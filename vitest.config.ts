import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // "server-only" throws when imported outside a React Server Component.
      // The guard is valuable in the app build but meaningless under Vitest,
      // so it is stubbed out here rather than removed from the source.
      "server-only": fileURLToPath(
        new URL("./src/test/serverOnlyStub.ts", import.meta.url),
      ),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
