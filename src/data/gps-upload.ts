import { PROVIDER_MAP } from "@/data/performance";

export type ProviderId = "Catapult" | "STATSports" | "GPEXE" | "Polar" | "Unknown";

export interface ProviderSignature {
  id: ProviderId;
  filePatterns: string[];
  headerHints: string[];
  delimiter: string;
}

export const PROVIDER_SIGNATURES: ProviderSignature[] = [
  { id: "Catapult", filePatterns: ["catapult", "openfield", "10hz"], headerHints: ["Total Distance (m)", "Player Load", "Velocity Band 6 Distance"], delimiter: "," },
  { id: "STATSports", filePatterns: ["statsports", "apex", "sonra"], headerHints: ["HSR Distance", "Max Speed (km/h)", "Dynamic Stress Load"], delimiter: "," },
  { id: "GPEXE", filePatterns: ["gpexe", "exelio"], headerHints: ["High Velocity Running", "Acc Events > 3 m/s²", "Metabolic Power"], delimiter: ";" },
  { id: "Polar", filePatterns: ["polar", "teampro"], headerHints: ["Distance (m)", "Speed max", "Sprints"], delimiter: "," },
];

/** Detect the provider from the file name, with the mapped metric fields for that provider. */
export function detectProvider(fileName: string): {
  provider: ProviderId;
  confidence: number;
  signature?: ProviderSignature;
  mappedFields: Array<{ raw: string; internal: string }>;
} {
  const name = fileName.toLowerCase();
  const sig = PROVIDER_SIGNATURES.find((s) => s.filePatterns.some((p) => name.includes(p)));
  if (!sig) {
    return { provider: "Unknown", confidence: 0, mappedFields: [] };
  }
  const mappedFields = PROVIDER_MAP.filter((m) => m.provider === sig.id).map((m) => ({ raw: m.raw, internal: m.internal }));
  return {
    provider: sig.id,
    confidence: mappedFields.length ? 0.98 : 0.7,
    signature: sig,
    mappedFields: mappedFields.length ? mappedFields : sig.headerHints.map((h) => ({ raw: h, internal: "UNMAPPED" })),
  };
}

export const ACCEPTED_EXTENSIONS = [".csv", ".xlsx", ".xls"];

export const isAcceptedFile = (fileName: string) =>
  ACCEPTED_EXTENSIONS.some((ext) => fileName.toLowerCase().endsWith(ext));
