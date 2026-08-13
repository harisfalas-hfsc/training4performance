import { isAdminEmail } from "@/lib/admin";

export function requireOwner(claims: Record<string, unknown>) {
  const email = claims["email"] as string | undefined;
  if (!isAdminEmail(email)) throw new Error("Forbidden: owner access required");
}