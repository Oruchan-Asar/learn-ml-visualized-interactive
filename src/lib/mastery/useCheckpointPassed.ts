"use client";

import { useCallback, useSyncExternalStore } from "react";
import { getCheckpointResult, subscribe } from "./store";

/** Whether a concept has ever been passed — reads localStorage without an effect-driven re-render. */
export function useCheckpointPassed(conceptId: string): boolean {
  const getSnapshot = useCallback(() => Boolean(getCheckpointResult(conceptId)?.passed), [conceptId]);
  const getServerSnapshot = useCallback(() => false, []);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
