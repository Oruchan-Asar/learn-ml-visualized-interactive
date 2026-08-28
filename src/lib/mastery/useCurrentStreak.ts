"use client";

import { useCallback, useSyncExternalStore } from "react";
import { getStreak, subscribeStreak } from "./streak";

/**
 * The current consecutive-day learning streak for one course. Returns a number rather than the whole
 * StreakState object — useSyncExternalStore compares snapshots with Object.is, and a freshly parsed
 * object would look like a new value on every render even when nothing changed.
 */
export function useCurrentStreak(courseSlug: string): number {
  const getSnapshot = useCallback(() => getStreak(courseSlug).currentStreak, [courseSlug]);
  const getServerSnapshot = useCallback(() => 0, []);
  return useSyncExternalStore(subscribeStreak, getSnapshot, getServerSnapshot);
}
