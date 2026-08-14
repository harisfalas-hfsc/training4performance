import { cn } from "@/lib/utils";

export const DOWNLOADS = {
  mac: "/__l5e/assets-v1/2e0c04ba-ef1f-4cee-8589-f1848a29e69a/T4P-macOS.zip",
  windows: "/__l5e/assets-v1/d76be498-8b24-49fc-91b3-0243929f9c57/T4P-Windows.zip",
};

function AppleGlyph(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M16.365 1.43c0 1.14-.42 2.2-1.12 2.99-.84.96-2.2 1.7-3.32 1.61a3.6 3.6 0 0 1 1.13-2.9c.79-.86 2.16-1.53 3.31-1.7ZM20.5 17.02c-.55 1.26-.81 1.82-1.52 2.94-.99 1.56-2.39 3.5-4.12 3.51-1.54.02-1.94-1-4.03-.99-2.09.01-2.53 1.01-4.07.99-1.73-.02-3.05-1.77-4.04-3.33C-.05 15.8-.35 10.7 1.34 8c1.2-1.93 3.1-3.06 4.88-3.06 1.82 0 2.96 1 4.46 1 1.46 0 2.35-1 4.45-1 1.59 0 3.27.87 4.47 2.36-3.93 2.16-3.29 7.78.9 9.72Z" />
    </svg>
  );
}

function WindowsGlyph(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M3 5.6 10.2 4.6v7.03H3V5.6Zm0 12.8 7.2 1v-6.93H3v5.93ZM11.3 4.44 21 3v8.63h-9.7V4.44Zm0 8.26H21V21l-9.7-1.4V12.7Z" />
    </svg>
  );
}

export function DesktopDownloads({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <p className="font-display text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
        Download
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <a
          href={DOWNLOADS.mac}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:border-brand-blue hover:text-brand-blue"
        >
          <AppleGlyph className="size-4" />
          macOS
        </a>
        <a
          href={DOWNLOADS.windows}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:border-brand-blue hover:text-brand-blue"
        >
          <WindowsGlyph className="size-4" />
          Windows
        </a>
      </div>
    </div>
  );
}
