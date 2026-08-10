/** Owner account for T4P. */
export const ADMIN_EMAILS = ["harisfalas@gmail.com"];

export const isAdminEmail = (email?: string | null) =>
  Boolean(email && ADMIN_EMAILS.includes(email.toLowerCase()));

export const ACCESS_MONTH_OPTIONS = [1, 2, 3, 6, 12, 24] as const;
