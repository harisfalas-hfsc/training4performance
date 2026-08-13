import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The "4" in T4P / Training 4 Performance is rendered as the brand mark.
 * It inherits the surrounding font size (1em). The two parts of the mark are
 * CSS masks coloured from semantic theme tokens, so changing theme updates
 * the glyph immediately without swapping or caching a different image.
 */
export function Glyph4({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="4"
      className={cn(
        "t4p-glyph relative inline-block h-[0.95em] w-[0.95em] align-[-0.1em]",
        className,
      )}
    >
      <span aria-hidden="true" className="t4p-glyph-primary absolute inset-0" />
      <span aria-hidden="true" className="t4p-glyph-accent absolute inset-0" />
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

export function SmartyAssistant({ className }: { className?: string }) {
  return (
    <span className={cn("font-semibold text-brand-blue", className)}>
      Smarty Assistant
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
