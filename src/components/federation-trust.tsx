import { cn } from "@/lib/utils";

const federations = [
  { name: "UEFA", src: "/federations/uefa.png" },
  { name: "FIFA", src: "/federations/fifa.png" },
  { name: "Cyprus FA", src: "/federations/cyprus-fa.png" },
  { name: "Hellenic FA", src: "/federations/hellenic-fa.png" },
  { name: "Premier League", src: "/federations/premier-league.png" },
  { name: "Serie A", src: "/federations/serie-a.png" },
  { name: "Bundesliga", src: "/federations/bundesliga.png" },
  { name: "La Liga", src: "/federations/laliga.png" },
  { name: "Ligue 1", src: "/federations/ligue-1.png" },
  { name: "Eredivisie", src: "/federations/eredivisie.png" },
];

export function FederationTrust({ className }: { className?: string }) {
  return (
    <div className={cn("text-center", className)}>
      <p className="mx-auto max-w-3xl text-sm font-semibold uppercase tracking-wide text-foreground">
        Trusted at the highest level — compatible with S&amp;C coaches and performance staff from
        leading football federations and leagues worldwide.
      </p>
      <div
        className="mt-5 flex flex-nowrap items-center justify-center gap-2 overflow-x-auto sm:flex-wrap sm:gap-4 sm:overflow-visible"
        aria-label="Federations and leagues we are compatible with"
      >
        {federations.map((f) => (
          <span
            key={f.name}
            title={f.name}
            className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-white p-1.5 shadow-sm sm:h-14 sm:w-14"
          >
            <img
              src={f.src}
              alt={`${f.name} logo`}
              loading="lazy"
              className="h-full w-full object-contain"
            />
          </span>
        ))}
      </div>
    </div>
  );
}


export function FederationTrustBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "panel border-brand-blue/20 bg-gradient-to-br from-brand-blue/6 to-brand-green/5 p-6",
        className,
      )}
    >
      <FederationTrust />
    </div>
  );
}
