import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { DEMO_T4P_LIBRARY } from "@/data/demo-seed";
import { isDemoMode } from "@/lib/access";
import { useAuth } from "@/lib/auth";
import { listLibraryBlocks, type LibraryBlock } from "@/lib/library.functions";

const demoBlocks: LibraryBlock[] = DEMO_T4P_LIBRARY.map((b) => ({
  ...b,
  notes: null,
  published: true,
  sort_order: 0,
  updated_at: new Date().toISOString(),
}));

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
    enabled: enabled && !demo,
  });

  if (demo) return { blocks: demoBlocks, loading: false, locked: false };
  return { blocks: query.data ?? [], loading: enabled && query.isPending, locked: !hasAccess };
}
