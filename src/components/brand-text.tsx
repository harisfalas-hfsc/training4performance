import { cn } from "@/lib/utils";

export function T4P({ className }: { className?: string }) {
  return <span className={cn("font-semibold text-brand-blue", className)}>T4P</span>;
}

export function Training4Performance({ className }: { className?: string }) {
  return (
    <span className={cn("font-semibold text-brand-blue", className)}>
      Training 4 Performance
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
