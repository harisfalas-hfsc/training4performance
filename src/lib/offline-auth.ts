/**
 * Offline authentication.
 *
 * Two separate things live here:
 *
 * 1. The last successful session is kept on the device so a signed-in coach is
 *    never thrown back to the login screen just because there is no internet.
 * 2. A PBKDF2-SHA256 verifier of the password (random salt, 210k iterations) is
 *    stored per device on every successful online sign-in, so the coach can
 *    also *sign in* with no connection. The raw password is never stored, and
 *    the verifier can be deleted from Account → this device.
 */

import type { Session } from "@supabase/supabase-js";

const SESSION_KEY = "t4p.offline.session";
const CREDS_KEY = "t4p.offline.creds";
const PROFILE_KEY = "t4p.offline.profile";
const ITERATIONS = 210_000;

export interface DeviceCredential {
  email: string;
  salt: string;
  hash: string;
  iterations: number;
  savedAt: string;
}

export interface CachedProfileCard {
  userId: string;
  email: string | null;
  fullName: string | null;
  clubName: string | null;
}

function ls(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function readJson<T>(key: string): T | null {
  const s = ls();
  if (!s) return null;
  try {
    const raw = s.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  const s = ls();
  if (!s) return;
  try {
    s.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

/* ------------------------------------------------------------------ */
/* Session                                                             */
/* ------------------------------------------------------------------ */

export function rememberSession(session: Session | null) {
  if (!session?.user?.id) return;
  writeJson(SESSION_KEY, {
    user: session.user,
    access_token: session.access_token,
    expires_at: session.expires_at,
    savedAt: new Date().toISOString(),
  });
}

export interface CachedSession {
  user: Session["user"];
  access_token?: string;
  expires_at?: number;
  savedAt: string;
}

export function cachedSession(): CachedSession | null {
  const s = readJson<CachedSession>(SESSION_KEY);
  return s?.user?.id ? s : null;
}

export function forgetSession() {
  ls()?.removeItem(SESSION_KEY);
}

export function rememberProfileCard(card: CachedProfileCard) {
  writeJson(PROFILE_KEY, card);
}

export function cachedProfileCard(): CachedProfileCard | null {
  return readJson<CachedProfileCard>(PROFILE_KEY);
}

/* ------------------------------------------------------------------ */
/* Password verifier                                                   */
/* ------------------------------------------------------------------ */

function toHex(buf: ArrayBuffer) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function derive(password: string, saltHex: string, iterations: number) {
  const enc = new TextEncoder();
  const salt = new Uint8Array((saltHex.match(/.{2}/g) ?? []).map((h) => parseInt(h, 16)));
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as unknown as BufferSource, iterations, hash: "SHA-256" },
    key,
    256,
  );
  return toHex(bits);
}

/** Called after a successful ONLINE sign-in. Stores only a derived verifier. */
export async function rememberDeviceLogin(email: string, password: string) {
  if (typeof crypto === "undefined" || !crypto.subtle) return;
  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)).buffer);
  const hash = await derive(password, salt, ITERATIONS);
  const list = deviceCredentials().filter((c) => c.email !== email.toLowerCase());
  list.push({ email: email.toLowerCase(), salt, hash, iterations: ITERATIONS, savedAt: new Date().toISOString() });
  writeJson(CREDS_KEY, list.slice(-5));
}

export function deviceCredentials(): DeviceCredential[] {
  return readJson<DeviceCredential[]>(CREDS_KEY) ?? [];
}

export function forgetDeviceCredentials() {
  ls()?.removeItem(CREDS_KEY);
  forgetSession();
}

/** Verifies a typed password against the stored verifier, with no network. */
export async function verifyDeviceLogin(email: string, password: string): Promise<boolean> {
  const cred = deviceCredentials().find((c) => c.email === email.trim().toLowerCase());
  if (!cred || typeof crypto === "undefined" || !crypto.subtle) return false;
  const hash = await derive(password, cred.salt, cred.iterations || ITERATIONS);
  // Constant-time-ish comparison.
  if (hash.length !== cred.hash.length) return false;
  let diff = 0;
  for (let i = 0; i < hash.length; i += 1) diff |= hash.charCodeAt(i) ^ cred.hash.charCodeAt(i);
  return diff === 0;
}

export function hasDeviceCredentialFor(email: string) {
  return deviceCredentials().some((c) => c.email === email.trim().toLowerCase());
}

/* ------------------------------------------------------------------ */
/* Offline (read-only) sign-in state                                   */
/* ------------------------------------------------------------------ */

const OFFLINE_SIGNIN = "t4p.offline.signedIn";

export function markOfflineSignIn(userId: string) {
  try {
    window.sessionStorage.setItem(OFFLINE_SIGNIN, userId);
  } catch {
    /* ignore */
  }
}

export function offlineSignInUser(): string | null {
  try {
    return window.sessionStorage.getItem(OFFLINE_SIGNIN);
  } catch {
    return null;
  }
}

export function clearOfflineSignIn() {
  try {
    window.sessionStorage.removeItem(OFFLINE_SIGNIN);
  } catch {
    /* ignore */
  }
}
