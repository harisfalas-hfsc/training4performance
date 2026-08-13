/**
 * Single source of truth for T4P pricing.
 * One team subscription, billed monthly, cancel any time.
 */
export const PRICE_EUR = 69.9;
export const PRICE_LABEL = "€69.90";
export const PRICE_PER = "per month, per team";
export const PRICE_FULL = "€69.90 / month";
export const PRICE_SCHEMA = "69.90";

/** Adds one month to a date (clamping short months). */
export function addMonth(date: Date) {
  const d = new Date(date.getTime());
  const day = d.getUTCDate();
  d.setUTCMonth(d.getUTCMonth() + 1);
  if (d.getUTCDate() < day) d.setUTCDate(0);
  return d;
}

export function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Current monthly billing period starting today. */
export function currentBillingPeriod(now = new Date()) {
  return { start: isoDate(now), end: isoDate(addMonth(now)) };
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}
