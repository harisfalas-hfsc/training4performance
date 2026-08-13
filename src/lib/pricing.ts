/**
 * Single source of truth for T4P pricing.
 * One team subscription, billed yearly (365 days), renews automatically.
 */
export const PRICE_EUR = 699;
export const PRICE_LABEL = "€699";
export const PRICE_PER = "per season, per team";
export const PRICE_FULL = "€699 / season";
export const PRICE_SCHEMA = "699.00";

/** Adds 365 days to a date. */
export function addSeason(date: Date) {
  const d = new Date(date.getTime());
  d.setUTCDate(d.getUTCDate() + 365);
  return d;
}

export function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Current 365-day billing period starting today. */
export function currentBillingPeriod(now = new Date()) {
  return { start: isoDate(now), end: isoDate(addSeason(now)) };
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}
