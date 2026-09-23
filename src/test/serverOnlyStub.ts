/**
 * Stub for the "server-only" package under Vitest.
 *
 * The real module throws on import outside a React Server Component, which
 * would block unit tests of server modules. Aliased in vitest.config.ts; the
 * genuine guard still applies in the application build.
 */
export {};
