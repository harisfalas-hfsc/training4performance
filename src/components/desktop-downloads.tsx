import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export const DOWNLOADS = {
  mac: "/__l5e/assets-v1/616d6a24-792d-4370-acbb-3cde2b8fa610/T4P-Installer-macOS.dmg",
  windows: "/__l5e/assets-v1/72fbae55-9780-4178-be0b-11cf8cf65ade/T4P-Setup-Windows.exe",
};

/** Apple brand mark — official monochrome glyph on a light chip. */
function AppleGlyph(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <path
        fill="#111111"
        d="M16.365 1.43c0 1.14-.42 2.2-1.12 2.99-.84.96-2.2 1.7-3.32 1.61a3.6 3.6 0 0 1 1.13-2.9c.79-.86 2.16-1.53 3.31-1.7ZM20.5 17.02c-.55 1.26-.81 1.82-1.52 2.94-.99 1.56-2.39 3.5-4.12 3.51-1.54.02-1.94-1-4.03-.99-2.09.01-2.53 1.01-4.07.99-1.73-.02-3.05-1.77-4.04-3.33C-.05 15.8-.35 10.7 1.34 8c1.2-1.93 3.1-3.06 4.88-3.06 1.82 0 2.96 1 4.46 1 1.46 0 2.35-1 4.45-1 1.59 0 3.27.87 4.47 2.36-3.93 2.16-3.29 7.78.9 9.72Z"
      />
    </svg>
  );
}

/** Windows brand mark — the four-colour logo. */
function WindowsGlyph(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden {...props}>
      <rect x="1.5" y="1.5" width="9.5" height="9.5" fill="#F25022" />
      <rect x="13" y="1.5" width="9.5" height="9.5" fill="#7FBA00" />
      <rect x="1.5" y="13" width="9.5" height="9.5" fill="#00A4EF" />
      <rect x="13" y="13" width="9.5" height="9.5" fill="#FFB900" />
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
          className="inline-flex w-44 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:border-brand-blue hover:text-brand-blue"
        >
          <AppleGlyph className="size-5 shrink-0" />
          macOS
        </a>
        <a
          href={DOWNLOADS.windows}
          className="inline-flex w-44 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:border-brand-blue hover:text-brand-blue"
        >
          <WindowsGlyph className="size-5 shrink-0" />
          Windows
        </a>
      </div>
      <Link
        to="/download"
        className="text-xs font-medium text-brand-blue underline-offset-4 hover:underline"
      >
        How to install (Windows &amp; macOS)
      </Link>
    </div>
  );
}

