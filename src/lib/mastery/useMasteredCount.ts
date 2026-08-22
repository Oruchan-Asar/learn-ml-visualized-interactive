"use client";

import { useCallback, useSyncExternalStore } from "react";
import { getMasteredCount, subscribe } from "./store";

/** How many of the given concept IDs have ever been passed. `conceptIds` should be a stable reference
 * (e.g. a module-level array) — it's only read inside the snapshot function, not a dependency. */
export function useMasteredCount(conceptIds: string[]): number {
  const getSnapshot = useCallback(() => getMasteredCount(conceptIds), [conceptIds]);
  const getServerSnapshot = useCallback(() => 0, []);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
