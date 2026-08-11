import { useEffect, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";

/**
 * Tracks navigation history *inside* the platform only, so the header back
 * button never sends a coach out to the public website.
 */
let stack: string[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Home of the platform — the back trail always starts here. */
export const PLATFORM_HOME = "/dashboard";

/**
 * Called when the coach jumps home from the logo: the trail restarts, so the
 * back button disappears instead of walking through the sections he left.
 */
export function resetPlatformHistory() {
  stack = [PLATFORM_HOME];
  emit();
}

export function usePlatformBack() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [, bump] = useState(0);

  useEffect(() => {
    const listener = () => bump((v) => v + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    const last = stack[stack.length - 1];
    if (last === pathname) return;
    // Landing on home always restarts the trail — home is the root of the platform.
    if (pathname === PLATFORM_HOME) stack = [PLATFORM_HOME];
    else if (stack[stack.length - 2] === pathname) stack.pop();
    else stack.push(pathname);
    emit();
  }, [pathname]);

  const canGoBack = stack.length > 1;
  const goBack = () => {
    if (stack.length < 2) return;
    const target = stack[stack.length - 2];
    if (!target) return;
    void navigate({ to: target });
  };

  return { canGoBack, goBack };
}
