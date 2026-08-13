import { useMemo, useState, type ReactNode } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface Option {
  value: string;
  label: string;
  hint?: string;
}

/** Labelled single-choice drop-down — one consistent control everywhere. */
export function SelectField({
  label,
  value,
  onChange,
  options,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  className?: string;
}) {
  return (
    <label className={`flex min-w-0 flex-col gap-1 ${className}`}>
      <span className="eyebrow">{label}</span>
      <select className="control w-full" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
            {option.hint ? ` (${option.hint})` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * Labelled multi-choice drop-down with a search box — replaces walls of
 * check/uncheck buttons. Shows "3 selected" once more than one is picked.
 */
export function MultiSelectField({
  label,
  values,
  onChange,
  options,
  placeholder = "Choose…",
  searchPlaceholder = "Search…",
  max,
  className = "",
  emptyText = "Nothing to choose yet.",
  footer,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  options: Option[];
  placeholder?: string;
  searchPlaceholder?: string;
  max?: number;
  className?: string;
  emptyText?: string;
  footer?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((option) => option.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  const toggle = (value: string) => {
    if (values.includes(value)) return onChange(values.filter((item) => item !== value));
    if (max === 1) return onChange([value]);
    if (max && values.length >= max) return;
    onChange([...values, value]);
  };

  const text =
    values.length === 0
      ? placeholder
      : values.length === 1
        ? (options.find((option) => option.value === values[0])?.label ?? placeholder)
        : `${values.length} selected`;

  return (
    <div className={`flex min-w-0 flex-col gap-1 ${className}`}>
      <span className="eyebrow">{label}</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button type="button" className="control flex w-full items-center justify-between gap-2 text-left text-sm">
            <span className={`truncate ${values.length ? "" : "text-muted-foreground"}`}>{text}</span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[min(20rem,calc(100vw-2rem))] p-0">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
          {max === 1 ? null : (
            <div className="flex items-center justify-between border-b border-border px-3 py-1.5 text-xs">
              <button
                type="button"
                className="font-semibold text-primary disabled:opacity-40"
                disabled={Boolean(max)}
                onClick={() => onChange(filtered.map((option) => option.value))}
              >
                Select all
              </button>
              <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => onChange([])}>
                Clear
              </button>
            </div>
          )}
          <div className="max-h-64 overflow-auto py-1">
            {filtered.map((option) => {
              const active = values.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggle(option.value)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-secondary"
                >
                  <span
                    className={`flex size-4 shrink-0 items-center justify-center rounded border ${
                      active ? "border-primary bg-primary text-primary-foreground" : "border-border"
                    }`}
                  >
                    {active ? <Check className="size-3" /> : null}
                  </span>
                  <span className="truncate">{option.label}</span>
                  {option.hint ? <span className="ml-auto shrink-0 text-xs text-muted-foreground">{option.hint}</span> : null}
                </button>
              );
            })}
            {!filtered.length ? <p className="px-3 py-4 text-sm text-muted-foreground">{emptyText}</p> : null}
          </div>
          {footer}
        </PopoverContent>
      </Popover>
    </div>
  );
}
