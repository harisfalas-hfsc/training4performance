import { useEffect, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";

/**
 * Tracks navigation history *inside* the platform only, so the header back
 * button never sends a coach out to the public website.
 */
const stack: string[] = [];

export function usePlatformBack() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [, bump] = useState(0);

  useEffect(() => {
    const last = stack[stack.length - 1];
    if (last === pathname) return;
    if (stack[stack.length - 2] === pathname) stack.pop();
    else stack.push(pathname);
    bump((v) => v + 1);
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
