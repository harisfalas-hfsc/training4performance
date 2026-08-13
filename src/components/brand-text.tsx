import { cn } from "@/lib/utils";

/**
 * The "4" in T4P / Training 4 Performance is rendered as the brand mark.
 * It inherits the surrounding font size (1em) and swaps to the light
 * variant in dark mode via the `t4p-glyph` rule in styles.css.
 */
export function Glyph4({ className }: { className?: string }) {
  return (
    <img
      src="/glyph-4.png"
      alt="4"
      aria-hidden="false"
      className={cn(
        "t4p-glyph inline-block h-[0.95em] w-[0.95em] align-[-0.1em] object-contain",
        className,
      )}
    />
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
