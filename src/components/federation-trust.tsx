import { cn } from "@/lib/utils";

const federations = [
  { name: "UEFA", src: "/federations/uefa.svg" },
  { name: "UEFA Champions League", src: "/federations/champions-league.svg" },
  { name: "FIFA", src: "/federations/fifa.svg", wide: true },
  { name: "Cyprus FA", src: "/federations/cyprus-fa.png" },
  { name: "Hellenic FA", src: "/federations/hellenic-fa.svg" },
  { name: "Premier League", src: "/federations/premier-league.png" },
  { name: "Serie A", src: "/federations/serie-a.svg" },
  { name: "Bundesliga", src: "/federations/bundesliga.svg", wide: true },
  { name: "La Liga", src: "/federations/laliga.svg", wide: true },
  { name: "Ligue 1", src: "/federations/ligue-1.svg" },
  { name: "Eredivisie", src: "/federations/eredivisie.png", wide: true },
];

export function FederationTrust({ className }: { className?: string }) {
  return (
    <div className={cn("text-center", className)}>
      <p className="mx-auto max-w-3xl text-sm font-semibold uppercase tracking-wide text-foreground">
        Trusted at the highest level — compatible with S&amp;C coaches and performance staff from
        leading football federations and leagues worldwide.
      </p>
      <div
        className="mx-auto mt-5 flex w-full max-w-4xl flex-wrap items-center justify-center gap-x-4 gap-y-4 sm:flex-nowrap sm:gap-x-3 md:gap-x-5"
        aria-label="Federations and leagues we are compatible with"
      >
        {federations.map((f) => (
          <img
            key={f.name}
            src={f.src}
            alt={`${f.name} logo`}
            title={f.name}
            loading="lazy"
            className={cn(
              "w-auto shrink object-contain",
              f.wide
                ? "h-5 max-w-[64px] sm:h-6 sm:max-w-[72px] md:h-7 md:max-w-[92px]"
                : "h-8 max-w-[40px] sm:h-9 sm:max-w-[42px] md:h-11 md:max-w-[52px]",
            )}
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
