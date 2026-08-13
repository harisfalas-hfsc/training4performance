import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The "4" in T4P / Training 4 Performance is rendered as the brand mark.
 * It inherits the surrounding font size (1em) and uses the exact supplied
 * artwork. Both variants stay mounted so theme changes swap instantly.
 */
export function Glyph4({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="4"
      className={cn("t4p-glyph relative inline-block h-[1.05em] w-[1.05em] shrink-0 align-[-0.16em]", className)}
    >
      <img aria-hidden="true" src="/glyph-4.png?v=3" alt="" className="t4p-glyph-light absolute inset-0 size-full object-contain" />
      <img aria-hidden="true" src="/glyph-4-dark.png?v=3" alt="" className="t4p-glyph-dark absolute inset-0 size-full object-contain" />
    </span>
  );
}

export function T4P({ className }: { className?: string }) {
  return (
    <span className={cn("font-semibold text-brand-blue whitespace-nowrap", className)}>
      T<Glyph4 />P
    </span>
  );
}

export function Training4Performance({ className }: { className?: string }) {
  return (
    <span className={cn("font-semibold text-brand-blue", className)}>
      Training <Glyph4 /> Performance
    </span>
  );
}

/** Theme-aware renderer for brand names embedded in longer copy. */
export function BrandCopy({ children }: { children: string }) {
  const parts = children.split(/(Training (?:4|for) Performance|T4P|C4P)/gi);

  return (
    <>
      {parts.map((part, index): ReactNode => {
        const normalized = part.toLowerCase();
        if (normalized === "t4p") return <T4P key={index} />;
        if (normalized === "c4p") {
          return <span key={index} className="font-semibold text-brand-blue">C<Glyph4 />P</span>;
        }
        if (normalized === "training 4 performance" || normalized === "training for performance") {
          return <Training4Performance key={index} />;
        }
        return <Fragment key={index}>{part}</Fragment>;
      })}
    </>
  );
}
