type ScopeListener = (userId: string | null, migrateLegacy: boolean) => void;

let activeUserId: string | null = null;
let legacyMigrationAllowed = false;
const listeners = new Set<ScopeListener>();

export function setWorkspaceScope(userId: string | null, migrateLegacy = false) {
  if (activeUserId === userId && legacyMigrationAllowed === migrateLegacy) return;
  activeUserId = userId;
  legacyMigrationAllowed = migrateLegacy;
  listeners.forEach((listener) => listener(userId, migrateLegacy));
}

export function getWorkspaceScope() {
  return { userId: activeUserId, migrateLegacy: legacyMigrationAllowed };
}

export function scopedStorageKey(base: string, userId = activeUserId) {
  return userId ? `${base}.${userId}` : null;
}

export function subscribeWorkspaceScope(listener: ScopeListener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}