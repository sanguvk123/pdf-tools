"use client";

export interface Option {
  value: string;
  label: string;
  /** One line of plain-language guidance. Never technical parameters. */
  hint?: string;
}

interface OptionSelectorProps {
  legend: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

/**
 * Radio group rendered as stacked rows. Uses real radio inputs so arrow-key
 * navigation and screen reader semantics come for free.
 */
export function OptionSelector({
  legend,
  options,
  value,
  onChange,
  disabled = false,
}: OptionSelectorProps) {
  return (
    <fieldset disabled={disabled}>
      <legend className="mb-2 text-[13px] font-medium text-ink">{legend}</legend>

      <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
        {options.map((option) => {
          const selected = option.value === value;

          return (
            <label
              key={option.value}
              className={[
                "flex cursor-pointer items-start gap-3 px-3.5 py-3 transition-colors duration-150",
                selected ? "bg-accent-soft/60" : "hover:bg-canvas",
                disabled ? "cursor-not-allowed opacity-60" : "",
              ].join(" ")}
            >
              <input
                type="radio"
                name={legend}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />

              <span
                aria-hidden="true"
                className={[
                  "mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border transition-colors duration-150",
                  selected ? "border-accent bg-accent" : "border-line-strong",
                ].join(" ")}
              >
                {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              </span>

              <span className="min-w-0">
                <span className="block text-[13.5px] font-medium text-ink">
                  {option.label}
                </span>
                {option.hint && (
                  <span className="block text-[12.5px] text-muted">{option.hint}</span>
                )}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
