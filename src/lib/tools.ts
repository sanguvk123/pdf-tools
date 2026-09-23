/**
 * Central tool registry.
 *
 * This is the single source of truth for: the homepage grid, tool page
 * metadata, internal linking, related tools and the sitemap. Adding a tool
 * here wires it into navigation and SEO; the page itself supplies the engine.
 */

export type ToolCategory = "pdf" | "image" | "convert";

/** Where the work happens. The UI never exposes this to the user. */
export type ToolEngine = "client" | "server";

export type IconKey =
  | "merge"
  | "compress"
  | "split"
  | "word"
  | "excel"
  | "image"
  | "pdf"
  | "rotate"
  | "trash"
  | "extract"
  | "lock";

export interface FaqItem {
  q: string;
  a: string;
}

export interface Tool {
  /** URL segment, e.g. "compress-pdf" -> /compress-pdf */
  slug: string;
  /** Short label used in grids and navigation. */
  name: string;
  /** One-line explanation shown on the card. */
  tagline: string;
  /** H1 on the tool page. */
  heading: string;
  /** Understated subtitle below the H1. */
  subtitle: string;
  /** <title> — unique per page. */
  metaTitle: string;
  /** Meta description — unique per page. */
  metaDescription: string;
  category: ToolCategory;
  icon: IconKey;
  engine: ToolEngine;
  /** Accepted input, as an <input accept> string. */
  accept: string;
  /** Human-readable list of accepted formats, for error copy. */
  acceptLabel: string;
  /** Whether the tool takes more than one file. */
  multiple: boolean;
  /** Per-file cap in megabytes. */
  maxFileSizeMb: number;
  /** Verb used on the primary button, e.g. "Compress PDF". */
  action: string;
  /** Present-tense processing copy, e.g. "Compressing your PDF". */
  actionProgressive: string;
  /** Success headline, e.g. "PDF compressed". */
  successHeadline: string;
  /** Shown on the homepage grid. */
  featured: boolean;
  faq: FaqItem[];
}

export const TOOLS: Tool[] = [
  {
    slug: "merge-pdf",
    name: "Merge PDF",
    tagline: "Combine files into one",
    heading: "Merge PDF",
    subtitle: "Combine multiple PDFs into one document.",
    metaTitle: "Merge PDF — Combine PDF files online, free",
    metaDescription:
      "Combine multiple PDF files into a single document in seconds. Drag to reorder pages, no signup, and your files never leave your device.",
    category: "pdf",
    icon: "merge",
    engine: "client",
    accept: "application/pdf,.pdf",
    acceptLabel: "PDF",
    multiple: true,
    maxFileSizeMb: 100,
    action: "Merge PDFs",
    actionProgressive: "Merging your PDFs",
    successHeadline: "PDFs merged",
    featured: true,
    faq: [
      {
        q: "Is there a limit on how many PDFs I can merge?",
        a: "You can merge as many PDFs as your browser can hold in memory. In practice a few dozen files of up to 100 MB each works comfortably.",
      },
      {
        q: "Can I change the order of the files?",
        a: "Yes. After adding your files, drag them into the order you want, or use the up and down buttons on each row for keyboard access.",
      },
      {
        q: "Do my files get uploaded to a server?",
        a: "No. Merging runs entirely inside your browser, so your documents never leave your device.",
      },
    ],
  },
  {
    slug: "compress-pdf",
    name: "Compress PDF",
    tagline: "Reduce file size",
    heading: "Compress PDF",
    subtitle: "Reduce PDF file size without sacrificing readability.",
    metaTitle: "Compress PDF — Reduce PDF file size online, free",
    metaDescription:
      "Make your PDF smaller in seconds. Pick recommended, smaller or smallest, and download a lighter file. No signup, processed on your device.",
    category: "pdf",
    icon: "compress",
    engine: "client",
    accept: "application/pdf,.pdf",
    acceptLabel: "PDF",
    multiple: false,
    maxFileSizeMb: 100,
    action: "Compress PDF",
    actionProgressive: "Compressing your PDF",
    successHeadline: "PDF compressed",
    featured: true,
    faq: [
      {
        q: "How much smaller will my PDF get?",
        a: "It depends on what is inside. Scanned or image-heavy PDFs often shrink by 60–90%. A PDF that is mostly text is already compact, so the saving is smaller.",
      },
      {
        q: "Will compression ruin the quality?",
        a: "Recommended keeps text sharp and is a good default. Smaller and Smallest trade some image detail for a lighter file.",
      },
      {
        q: "Is my document uploaded anywhere?",
        a: "No. Compression happens in your browser, so the file stays on your device.",
      },
    ],
  },
  {
    slug: "split-pdf",
    name: "Split PDF",
    tagline: "Extract pages",
    heading: "Split PDF",
    subtitle: "Pull out the pages you need.",
    metaTitle: "Split PDF — Extract pages from a PDF online, free",
    metaDescription:
      "Split a PDF into separate files or pull out just the pages you need. Pick pages visually, no signup, processed on your device.",
    category: "pdf",
    icon: "split",
    engine: "client",
    accept: "application/pdf,.pdf",
    acceptLabel: "PDF",
    multiple: false,
    maxFileSizeMb: 100,
    action: "Split PDF",
    actionProgressive: "Splitting your PDF",
    successHeadline: "PDF split",
    featured: true,
    faq: [
      {
        q: "Can I get each page as its own file?",
        a: "Yes. Choose 'Split every page' and you will get a ZIP containing one PDF per page.",
      },
      {
        q: "How do I extract a range of pages?",
        a: "Select the pages you want in the page picker, or type ranges such as 1-3, 8, 11-14.",
      },
      {
        q: "Does splitting change the page quality?",
        a: "No. Pages are copied across exactly as they are, with no re-encoding.",
      },
    ],
  },
  {
    slug: "pdf-to-word",
    name: "PDF → Word",
    tagline: "Convert to editable text",
    heading: "PDF to Word",
    subtitle: "Turn your PDF into an editable Word document.",
    metaTitle: "PDF to Word — Convert PDF to DOCX online, free",
    metaDescription:
      "Convert a PDF into an editable Word document in seconds. Keeps your text intact, no signup and no watermarks.",
    category: "convert",
    icon: "word",
    engine: "server",
    accept: "application/pdf,.pdf",
    acceptLabel: "PDF",
    multiple: false,
    maxFileSizeMb: 100,
    action: "Convert to Word",
    actionProgressive: "Converting your PDF",
    successHeadline: "Word document ready",
    featured: true,
    faq: [
      {
        q: "What format do I get back?",
        a: "A .docx file that opens in Microsoft Word, Google Docs, Pages and LibreOffice.",
      },
      {
        q: "Will the layout be identical?",
        a: "Text and reading order are preserved. Very complex layouts may need small adjustments after conversion.",
      },
      {
        q: "Can it convert scanned pages?",
        a: "Scanned pages are images rather than text. Pages with no extractable text are reported so you know what came through.",
      },
    ],
  },
  {
    slug: "pdf-to-jpg",
    name: "PDF → JPG",
    tagline: "Convert pages to images",
    heading: "PDF to JPG",
    subtitle: "Turn every page into a high-quality image.",
    metaTitle: "PDF to JPG — Convert PDF pages to images online, free",
    metaDescription:
      "Convert each page of your PDF into a sharp JPG image. Download a single page or all pages as a ZIP. No signup, runs on your device.",
    category: "image",
    icon: "image",
    engine: "client",
    accept: "application/pdf,.pdf",
    acceptLabel: "PDF",
    multiple: false,
    maxFileSizeMb: 100,
    action: "Convert to JPG",
    actionProgressive: "Converting your pages",
    successHeadline: "Images ready",
    featured: true,
    faq: [
      {
        q: "What resolution are the images?",
        a: "Pages are rendered at roughly 150 DPI, which is sharp on screen and good enough for most printing.",
      },
      {
        q: "How do I get all the pages?",
        a: "Multi-page PDFs are packaged as a ZIP so every page arrives in one download.",
      },
      {
        q: "Can I get PNG instead?",
        a: "Yes, switch the format option to PNG before converting.",
      },
    ],
  },
  {
    slug: "pdf-to-png",
    name: "PDF → PNG",
    tagline: "Convert pages to PNG",
    heading: "PDF to PNG",
    subtitle: "Turn every page into a lossless PNG image.",
    metaTitle: "PDF to PNG — Convert PDF pages to PNG online, free",
    metaDescription:
      "Convert PDF pages into high-quality PNG images. Lossless output keeps text and line art crisp. No signup, runs entirely on your device.",
    category: "image",
    icon: "image",
    engine: "client",
    accept: "application/pdf,.pdf",
    acceptLabel: "PDF",
    multiple: false,
    maxFileSizeMb: 100,
    action: "Convert to PNG",
    actionProgressive: "Converting your pages",
    successHeadline: "PNG images ready",
    featured: false,
    faq: [
      {
        q: "Why choose PNG over JPG?",
        a: "PNG is lossless, so text, diagrams and line art stay perfectly sharp with no compression artefacts. The trade-off is a larger file. For pages that are mostly photos, JPG is usually the better choice.",
      },
      {
        q: "Do PNGs keep a transparent background?",
        a: "No. PDF pages are rendered on a white background so the image matches what you see in a PDF reader.",
      },
      {
        q: "How do I get all the pages?",
        a: "Multi-page PDFs are packaged as a ZIP, so every page arrives in a single download.",
      },
    ],
  },
  {
    slug: "jpg-to-pdf",
    name: "JPG → PDF",
    tagline: "Create a PDF from photos",
    heading: "JPG to PDF",
    subtitle: "Turn your images into a single PDF.",
    metaTitle: "JPG to PDF — Convert images to PDF online, free",
    metaDescription:
      "Combine JPG and PNG images into one clean PDF. Drag to reorder, choose page size, no signup and nothing leaves your device.",
    category: "image",
    icon: "pdf",
    engine: "client",
    accept: "image/jpeg,image/png,.jpg,.jpeg,.png",
    acceptLabel: "JPG or PNG",
    multiple: true,
    maxFileSizeMb: 50,
    action: "Create PDF",
    actionProgressive: "Building your PDF",
    successHeadline: "PDF created",
    featured: true,
    faq: [
      {
        q: "Can I control the page order?",
        a: "Yes. Drag the images into the order you want before creating the PDF.",
      },
      {
        q: "What page size is used?",
        a: "By default each page matches its image. You can switch to A4 or Letter if you plan to print.",
      },
      {
        q: "Which image formats are supported?",
        a: "JPG and PNG. Other formats can be handled by the Image to PDF tool.",
      },
    ],
  },
  {
    slug: "pdf-to-excel",
    name: "PDF → Excel",
    tagline: "Convert tables to sheets",
    heading: "PDF to Excel",
    subtitle: "Pull tables out of your PDF into a spreadsheet.",
    metaTitle: "PDF to Excel — Convert PDF tables to spreadsheets online",
    metaDescription:
      "Extract tables from a PDF into an editable spreadsheet. Download as CSV or XLSX, no signup and no watermarks.",
    category: "convert",
    icon: "excel",
    engine: "server",
    accept: "application/pdf,.pdf",
    acceptLabel: "PDF",
    multiple: false,
    maxFileSizeMb: 100,
    action: "Convert to Excel",
    actionProgressive: "Extracting your tables",
    successHeadline: "Spreadsheet ready",
    featured: true,
    faq: [
      {
        q: "What kind of tables work best?",
        a: "Tables with clear columns convert most accurately. Very irregular layouts may need tidying afterwards.",
      },
      {
        q: "What file do I get?",
        a: "A spreadsheet file that opens in Excel, Numbers, Google Sheets and LibreOffice Calc.",
      },
      {
        q: "What if my PDF is a scan?",
        a: "A scanned page holds no table data, only pixels, so there is nothing to extract. Pages without usable text are reported back to you.",
      },
    ],
  },
  {
    slug: "image-to-pdf",
    name: "Image → PDF",
    tagline: "Any image into a PDF",
    heading: "Image to PDF",
    subtitle: "Turn images of any common format into a PDF.",
    metaTitle: "Image to PDF — Convert PNG, JPG, WebP and GIF to PDF",
    metaDescription:
      "Convert PNG, JPG, WebP, GIF and BMP images into one PDF. Reorder pages, pick page size, and keep everything on your device.",
    category: "image",
    icon: "pdf",
    engine: "client",
    accept: "image/*",
    acceptLabel: "PNG, JPG, WebP, GIF or BMP",
    multiple: true,
    maxFileSizeMb: 50,
    action: "Create PDF",
    actionProgressive: "Building your PDF",
    successHeadline: "PDF created",
    featured: true,
    faq: [
      {
        q: "Which formats can I use?",
        a: "PNG, JPG, WebP, GIF and BMP. Anything your browser can display will be converted.",
      },
      {
        q: "Can I mix formats in one PDF?",
        a: "Yes. Add a mix of images and they will all be placed into the same document.",
      },
      {
        q: "Are transparent PNGs supported?",
        a: "Yes. Transparent areas are placed on a white page background.",
      },
    ],
  },
  {
    slug: "rotate-pdf",
    name: "Rotate PDF",
    tagline: "Fix page orientation",
    heading: "Rotate PDF",
    subtitle: "Turn pages the right way up.",
    metaTitle: "Rotate PDF — Turn PDF pages online, free",
    metaDescription:
      "Rotate every page or just the ones that are sideways, then save the corrected PDF. No signup, runs entirely on your device.",
    category: "pdf",
    icon: "rotate",
    engine: "client",
    accept: "application/pdf,.pdf",
    acceptLabel: "PDF",
    multiple: false,
    maxFileSizeMb: 100,
    action: "Rotate PDF",
    actionProgressive: "Rotating your pages",
    successHeadline: "PDF rotated",
    featured: false,
    faq: [
      {
        q: "Can I rotate only some pages?",
        a: "Yes. Select the pages you want to turn, or apply the rotation to the whole document at once.",
      },
      {
        q: "Is the rotation permanent?",
        a: "Yes. The saved PDF opens in the corrected orientation in every reader.",
      },
    ],
  },
  {
    slug: "delete-pages-pdf",
    name: "Delete pages",
    tagline: "Remove unwanted pages",
    heading: "Delete PDF pages",
    subtitle: "Remove the pages you do not need.",
    metaTitle: "Delete PDF pages — Remove pages from a PDF online, free",
    metaDescription:
      "Remove unwanted pages from a PDF and download the tidied document. Pick pages visually, no signup, processed on your device.",
    category: "pdf",
    icon: "trash",
    engine: "client",
    accept: "application/pdf,.pdf",
    acceptLabel: "PDF",
    multiple: false,
    maxFileSizeMb: 100,
    action: "Delete pages",
    actionProgressive: "Removing your pages",
    successHeadline: "Pages removed",
    featured: false,
    faq: [
      {
        q: "Can I get the deleted pages back?",
        a: "Your original file is untouched. The download is a new copy without the pages you selected.",
      },
      {
        q: "Can I remove a range of pages at once?",
        a: "Yes. Type ranges such as 2-5, 9 to remove several pages in one go.",
      },
    ],
  },
  {
    slug: "extract-pages-pdf",
    name: "Extract pages",
    tagline: "Save selected pages",
    heading: "Extract PDF pages",
    subtitle: "Save just the pages you want as a new PDF.",
    metaTitle: "Extract PDF pages — Save selected pages as a new PDF",
    metaDescription:
      "Pick the pages you want and save them as a new PDF. Keeps original quality, no signup, runs entirely in your browser.",
    category: "pdf",
    icon: "extract",
    engine: "client",
    accept: "application/pdf,.pdf",
    acceptLabel: "PDF",
    multiple: false,
    maxFileSizeMb: 100,
    action: "Extract pages",
    actionProgressive: "Extracting your pages",
    successHeadline: "Pages extracted",
    featured: false,
    faq: [
      {
        q: "Do the extracted pages keep their quality?",
        a: "Yes. Pages are copied exactly, with no re-encoding or quality loss.",
      },
      {
        q: "Can I keep the pages in a different order?",
        a: "Pages are saved in document order. To reorder, extract them and then merge the results in the order you want.",
      },
    ],
  },
];

const BY_SLUG = new Map(TOOLS.map((tool) => [tool.slug, tool]));

export function getTool(slug: string): Tool | undefined {
  return BY_SLUG.get(slug);
}

/**
 * Throws if the slug is unknown. Use from tool pages, where a missing entry
 * is a build-time programming error rather than a runtime condition.
 */
export function requireTool(slug: string): Tool {
  const tool = BY_SLUG.get(slug);
  if (!tool) throw new Error(`Unknown tool slug: ${slug}`);
  return tool;
}

export const FEATURED_TOOLS = TOOLS.filter((tool) => tool.featured);

export const CATEGORY_LABELS: Record<ToolCategory, string> = {
  pdf: "PDF Tools",
  image: "Image Tools",
  convert: "Converters",
};

export function toolsInCategory(category: ToolCategory): Tool[] {
  return TOOLS.filter((tool) => tool.category === category);
}

/**
 * Tools to surface after a result, and in the footer of each tool page.
 * Prefers same-category neighbours, then fills up from the featured set so
 * every page always links out to a useful next step.
 */
export function relatedTools(slug: string, limit = 6): Tool[] {
  const current = getTool(slug);
  if (!current) return FEATURED_TOOLS.slice(0, limit);

  const sameCategory = TOOLS.filter(
    (tool) => tool.slug !== slug && tool.category === current.category,
  );
  const rest = TOOLS.filter(
    (tool) => tool.slug !== slug && tool.category !== current.category,
  );

  return [...sameCategory, ...rest].slice(0, limit);
}
