# PDF Utility

Fast, private PDF tools. One problem, one action, one result.

Twelve tools share a single interaction model: drop a file, confirm one
plain-language option, download the result. No account, no watermarks, and
most operations never send your file anywhere.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

| Command            | Purpose                          |
| ------------------ | -------------------------------- |
| `npm run dev`      | Development server               |
| `npm run build`    | Production build                 |
| `npm start`        | Serve the production build       |
| `npm test`         | Unit tests (Vitest)              |
| `npm run lint`     | ESLint                           |
| `npm run typecheck`| TypeScript, no emit              |

## Architecture

### The universal tool

Every tool is the same three pieces:

```
app/<slug>/page.tsx      Server component: metadata, SEO copy, FAQ, schema
  └── <Tool>.tsx         Client island: declares options, picks an engine
        └── ToolShell    Renders the state machine into the shared layout
```

A tool page never implements upload handling, progress, cancellation, errors
or downloads. It declares *what* its options are and *which* engine runs the
work; [`ToolShell`](src/components/ToolShell.tsx) and
[`useToolRunner`](src/lib/useToolRunner.ts) provide everything else. That is
what makes the tools feel identical — learn one, you know them all.

Adding a tool means adding an entry to
[`TOOLS`](src/lib/tools.ts) and a page that composes the existing primitives.
The registry drives the homepage grid, navigation, related-tool links and the
sitemap, so nothing has to be wired up twice.

### State machine

All tools run the same reducer
([`toolMachine.ts`](src/lib/toolMachine.ts)):

```
IDLE → VALIDATING → READY → PROCESSING → SUCCESS
                      ↓          ↓
              PASSWORD_REQUIRED  ERROR
```

Transitions are explicit, so inconsistent intermediate states are not
representable: a stale result cannot sit next to a newly selected file, and
progress arriving after cancellation cannot revive a finished run.

### Engines

Work happens in one of two places behind an identical interface:

- **Client** — a Web Worker ([`pdf.worker.ts`](src/workers/pdf.worker.ts))
  running pdf-lib and, for image work, pdf.js. The main thread never blocks,
  so the page stays scrollable and cancellable throughout.
- **Server** — a streaming route ([`api/convert`](src/app/api/convert/route.ts))
  for conversions that need more than a browser offers.

Both satisfy the same `RunFn` signature, so the UI cannot tell them apart —
which is the point. The user should not have to care where their file is
processed.

| Tool                         | Engine |
| ---------------------------- | ------ |
| Merge, Split, Compress       | Client |
| Rotate, Delete, Extract      | Client |
| JPG→PDF, Image→PDF, PDF→JPG  | Client |
| PDF→Word, PDF→Excel          | Server |

### Performance

- **No heavy library on the homepage.** pdf-lib and pdf.js are behind dynamic
  imports on the routes that need them; the homepage ships neither.
- **Engines warm up early.** The worker chunk starts downloading the moment a
  file is selected, overlapping with the user reading the options, so clicking
  the button does not wait on a network fetch.
- **Honest progress.** A determinate bar appears only when the real completed
  fraction is known. Otherwise the stage is named ("Rendering page 3 of 12").
  No invented percentages.
- **Static everything.** Every page except the conversion endpoint is
  prerendered.

### Privacy

Client-side tools never transmit the file. The server route holds the upload in
memory for the duration of the request, writes nothing to disk, and streams the
result straight back — there is no job store to clean up.

## Errors

Engines throw `ToolError` with a code; the UI renders only the mapped human
copy from [`errors.ts`](src/lib/errors.ts). A raw message like
`Ghostscript exited with status 1` cannot reach a user. Unexpected server
failures are logged with their cause and reported generically.

Password-protected and non-PDF files are detected the moment they are
selected, before any processing begins, so nobody waits to find out.

## Tests

76 unit tests cover the logic worth protecting: the state machine's transition
rules, page-range parsing, file validation, the ZIP writer (verified against
the reference CRC32 check value), real PDF operations via pdf-lib, and text
extraction via pdf.js — including the column-gap behaviour that spreadsheet
export depends on.

```bash
npm test
```

## Project layout

```
src/
  app/            Routes. One folder per tool, plus the conversion API.
  components/     Design system and shared tool UI.
  lib/            Registry, state machine, engines, helpers.
  workers/        Off-main-thread PDF and image operations.
  server/         Server-only text extraction and document building.
```
