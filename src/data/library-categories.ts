/**
 * Sections of the drills & exercise library.
 * The owner fills these from the admin panel; coaches see them inside the
 * Training Designer and on the Library page.
 */
export const LIBRARY_CATEGORIES = [
  "STRENGTH",
  "POWER",
  "SPEED",
  "ESD (ENERGY SYSTEM DEVELOPMENT)",
  "COORDINATION",
  "MOBILITY & STABILITY",
  "REACTION",
  "TECHNICAL / TACTICAL",
  "RECOVERY",
] as const;

export type LibraryCategory = (typeof LIBRARY_CATEGORIES)[number];

export const DEFAULT_LIBRARY_CATEGORY: LibraryCategory = "STRENGTH";

export const normalizeCategory = (value?: string | null): string =>
  (value ?? "").trim().toUpperCase() || DEFAULT_LIBRARY_CATEGORY;
