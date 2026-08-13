import { cn } from "@/lib/utils";

const federations = [
  { name: "UEFA", src: "/federations/uefa.svg" },
  { name: "UEFA Champions League", src: "/federations/champions-league.svg" },
  { name: "FIFA", src: "/federations/fifa.svg" },
  { name: "Cyprus FA", src: "/federations/cyprus-fa.png" },
  { name: "Hellenic FA", src: "/federations/hellenic-fa.svg" },
  { name: "Premier League", src: "/federations/premier-league.png" },
  { name: "Serie A", src: "/federations/serie-a.svg" },
  { name: "Bundesliga", src: "/federations/bundesliga.svg" },
  { name: "La Liga", src: "/federations/laliga.svg" },
  { name: "Ligue 1", src: "/federations/ligue-1.svg" },
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
        className="mt-5 flex flex-wrap items-center justify-center gap-5 sm:gap-7"
        aria-label="Federations and leagues we are compatible with"
      >
        {federations.map((f) => (
          <img
            key={f.name}
            src={f.src}
            alt={`${f.name} logo`}
            title={f.name}
            loading="lazy"
            className="h-10 w-10 shrink-0 object-contain sm:h-12 sm:w-12"
          />
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
