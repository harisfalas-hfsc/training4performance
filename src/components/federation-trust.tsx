import { cn } from "@/lib/utils";

const federations = [
  { name: "UEFA", color: "#001B5E", text: "#ffffff" },
  { name: "FIFA", color: "#326295", text: "#ffffff" },
  { name: "Cyprus FA", color: "#0052B4", text: "#ffffff" },
  { name: "Hellenic FA", color: "#0D5EAF", text: "#ffffff" },
  { name: "Premier League", color: "#38003C", text: "#ffffff" },
  { name: "Serie A", color: "#008B8B", text: "#ffffff" },
  { name: "Bundesliga", color: "#D4102A", text: "#ffffff" },
  { name: "La Liga", color: "#FF4B00", text: "#ffffff" },
  { name: "Ligue 1", color: "#DBE4EB", text: "#111111" },
  { name: "Eredivisie", color: "#E36C0A", text: "#ffffff" },
];

export function FederationTrust({ className }: { className?: string }) {
  return (
    <div className={cn("text-center", className)}>
      <p className="mx-auto max-w-3xl text-sm font-semibold uppercase tracking-wide text-foreground">
        Trusted at the highest level — compatible with S&amp;C coaches and performance staff from
        leading football federations and leagues worldwide.
      </p>
      <div
        className="mt-5 flex flex-wrap items-center justify-center gap-3"
        aria-label="Federations and leagues we are compatible with"
      >
        {federations.map((f) => (
          <span
            key={f.name}
            className="inline-flex items-center rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wider shadow-sm"
            style={{ backgroundColor: f.color, color: f.text }}
            title={f.name}
          >
            {f.name}
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
