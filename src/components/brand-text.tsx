import { cn } from "@/lib/utils";

/**
 * The "4" in T4P / Training 4 Performance is rendered as the brand mark.
 * It inherits the surrounding font size (1em). Both theme assets are
 * rendered and CSS switches their visibility, avoiding unreliable
 * `content: url()` replacement on image elements.
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
      <img
        src="/glyph-4.png"
        alt=""
        aria-hidden="true"
        className="t4p-glyph-light absolute inset-0 size-full object-contain"
      />
      <img
        src="/glyph-4-dark.png"
        alt=""
        aria-hidden="true"
        className="t4p-glyph-dark absolute inset-0 hidden size-full object-contain"
      />
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
