import { cn } from "@/lib/utils";

type Fed = { name: string; src: string; wide?: boolean; darkInvert?: boolean; darkPlate?: "round" | "square" };

const federations: Fed[] = [
  { name: "UEFA", src: "/federations/uefa.svg" },
  { name: "UEFA Champions League", src: "/federations/champions-league.svg", darkInvert: true },
  { name: "FIFA", src: "/federations/fifa.svg", wide: true },
  { name: "Cyprus FA", src: "/federations/cyprus-fa.png", darkPlate: "round" },
  { name: "Hellenic FA", src: "/federations/hellenic-fa.svg" },
  { name: "Premier League", src: "/federations/premier-league.png", darkPlate: "round" },
  { name: "Serie A", src: "/federations/serie-a.svg", darkPlate: "square" },
  { name: "Bundesliga", src: "/federations/bundesliga.svg", wide: true, darkPlate: "square" },
  { name: "La Liga", src: "/federations/laliga.svg", wide: true },
  { name: "Ligue 1", src: "/federations/ligue-1.svg", darkInvert: true },
  { name: "Eredivisie", src: "/federations/eredivisie.png", wide: true, darkInvert: true },
];

export function FederationTrust({ className }: { className?: string }) {
  return (
    <div className={cn("text-center", className)}>
      <p className="mx-auto max-w-3xl text-sm font-semibold uppercase tracking-wide text-foreground">
        Trusted at the highest level — compatible with S&amp;C coaches and performance staff from
        leading football federations and leagues worldwide.
      </p>
      <div
        className="mx-auto mt-5 flex w-full max-w-4xl flex-nowrap items-center justify-center gap-x-1.5 sm:gap-x-3 md:gap-x-5"
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
                ? "h-4 max-w-[30px] sm:h-6 sm:max-w-[72px] md:h-7 md:max-w-[92px]"
                : "h-6 max-w-[22px] sm:h-9 sm:max-w-[42px] md:h-11 md:max-w-[52px]",
              f.darkInvert && "dark:brightness-0 dark:invert",
              f.darkPlate === "round" && "dark:rounded-full dark:bg-white dark:p-0.5",
              f.darkPlate === "square" && "dark:rounded-sm dark:bg-white dark:p-0.5",
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
