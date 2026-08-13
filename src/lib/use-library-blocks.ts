import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { isDemoMode } from "@/lib/access";
import { useAuth } from "@/lib/auth";
import { listLibraryBlocks, type LibraryBlock } from "@/lib/library.functions";

const demoBlocks: LibraryBlock[] = [];

/**
 * The ready-made T4P blocks.
 * Signed-in coaches read them from the cloud (row-level security hides them
 * once a subscription ends); the public demo uses a static set so a visitor
 * can browse and reuse them exactly like a subscriber.
 */
export function useOfficialLibrary(enabled = true) {
  const { hasAccess } = useAuth();
  const demo = isDemoMode();
  const fetchBlocks = useServerFn(listLibraryBlocks);

  const query = useQuery({
    queryKey: ["library-blocks"],
    queryFn: () => fetchBlocks(),
    enabled: enabled && !demo && hasAccess,
  });

  if (demo) return { blocks: demoBlocks, loading: false, locked: false };
  // Expired / canceled accounts keep their own saved blocks but lose the T4P set.
  if (!hasAccess) return { blocks: [] as LibraryBlock[], loading: false, locked: true };
  return { blocks: query.data ?? [], loading: enabled && query.isPending, locked: false };
}
