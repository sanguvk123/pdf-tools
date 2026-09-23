import type { IconKey } from "@/lib/tools";

/**
 * Inline stroke icons. Kept as a small local set rather than an icon package
 * so the homepage ships no extra JavaScript for decoration.
 */
const PATHS: Record<IconKey, React.ReactNode> = {
  merge: (
    <>
      <path d="M4 5h6a4 4 0 0 1 4 4v6a4 4 0 0 0 4 4h2" />
      <path d="M4 19h6a4 4 0 0 0 4-4V9a4 4 0 0 1 4-4h2" />
      <path d="m17 2 3 3-3 3" />
      <path d="m17 16 3 3-3 3" />
    </>
  ),
  compress: (
    <>
      <path d="M4 9h16" />
      <path d="M4 15h16" />
      <path d="m9 5 3-3 3 3" />
      <path d="m9 19 3 3 3-3" />
    </>
  ),
  split: (
    <>
      <path d="M12 3v18" strokeDasharray="3 3" />
      <rect x="3" y="5" width="6" height="14" rx="1.5" />
      <rect x="15" y="5" width="6" height="14" rx="1.5" />
    </>
  ),
  word: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="m9 12 1.3 5L12 13l1.7 4L15 12" />
    </>
  ),
  text: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h4" />
    </>
  ),
  excel: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="m9.5 12 5 5" />
      <path d="m14.5 12-5 5" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="m4 17 4.5-4.5a2 2 0 0 1 2.8 0L20 21" />
    </>
  ),
  pdf: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 17v-4h1.6a1.4 1.4 0 0 1 0 2.8H9" />
      <path d="M14 17v-4h1.4a2 2 0 0 1 0 4z" />
    </>
  ),
  rotate: (
    <>
      <path d="M21 12a9 9 0 1 1-2.6-6.4" />
      <path d="M21 4v5h-5" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M6 7v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7" />
      <path d="M10 11v6M14 11v6" />
    </>
  ),
  extract: (
    <>
      <path d="M9 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3" />
      <path d="M13 8h8" />
      <path d="m17 4 4 4-4 4" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      <path d="M12 15v2" />
    </>
  ),
};

interface IconProps {
  name: IconKey;
  className?: string;
}

export function Icon({ name, className = "h-5 w-5" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
