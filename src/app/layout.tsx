import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SITE_ORIGIN } from "@/lib/site";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: "PDF Utility — PDF tools that just work",
    template: "%s | PDF Utility",
  },
  description:
    "Merge, compress, convert, split and edit your PDFs in seconds. No signup, no watermarks, and most tools run entirely on your device.",
  openGraph: {
    type: "website",
    siteName: "PDF Utility",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <head>
        {/*
          Vercel Web Analytics, loaded as a plain script rather than via
          @vercel/analytics. The package depends on a Svelte Vite plugin that
          requires vite 8, while vitest 2 pins vite 5 — installing it means
          --legacy-peer-deps and a test runner on an unsupported dependency
          tree, which is too high a price for a script tag.

          This also activates /_vercel/insights/event. That route 404s until a
          page loads this script, which is why the custom events in
          lib/analytics.ts had nowhere to go.

          defer so it never competes with the tool code for parse time: the
          person came here to compress a PDF, not to be measured.
        */}
        <script defer src="/_vercel/insights/script.js" />

        {/*
          Speed Insights reports real Core Web Vitals from actual visitors.
          Its route already resolved before this was added, but nothing on the
          site loaded the script, so it was measuring nobody — the same silent
          gap as the analytics events.
        */}
        <script defer src="/_vercel/speed-insights/script.js" />
      </head>
      <body className="flex min-h-full flex-col bg-canvas text-ink">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-ink focus:px-3 focus:py-2 focus:text-[13px] focus:text-white"
        >
          Skip to content
        </a>
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
