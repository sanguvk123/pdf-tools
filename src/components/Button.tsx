import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-hover disabled:bg-line-strong disabled:text-faint",
  secondary:
    "border border-line-strong bg-surface text-ink hover:border-faint disabled:text-faint",
  ghost: "text-muted hover:bg-line/60 hover:text-ink",
};

const SIZES: Record<Size, string> = {
  md: "h-9 px-3.5 text-[13.5px]",
  // Large touch target for the primary action on mobile.
  lg: "h-12 px-6 text-[15px]",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium",
        "transition-all duration-150 active:scale-[0.99]",
        "disabled:cursor-not-allowed disabled:active:scale-100",
        VARIANTS[variant],
        SIZES[size],
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
      {...rest}
    />
  );
}
