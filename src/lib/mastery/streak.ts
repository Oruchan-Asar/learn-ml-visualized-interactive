export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastActiveDay: string;
}

const KEY = "gradient:streak";
const EMPTY: StreakState = { currentStreak: 0, longestStreak: 0, lastActiveDay: "" };

type Listener = () => void;
const listeners = new Set<Listener>();

/** Lets `useCurrentStreak` react when the streak changes, without polling. */
export function subscribeStreak(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Whole calendar days between two "YYYY-MM-DD" days, both read as local dates. */
export function daysBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / msPerDay);
}

/**
 * Pure transition, exported for testing without a DOM: given the previous streak state and today's date
 * key, what the new state should be. A day already marked returns `prev` unchanged (by reference, so
 * callers can detect "nothing to persist"); the day right after the last active one extends the streak;
 * any bigger gap (or no prior activity) resets it to 1.
 */
export function computeNextStreak(prev: StreakState, today: string): StreakState {
  if (prev.lastActiveDay === today) return prev;
  const gap = prev.lastActiveDay ? daysBetween(prev.lastActiveDay, today) : null;
  const currentStreak = gap === 1 ? prev.currentStreak + 1 : 1;
  return {
    currentStreak,
    longestStreak: Math.max(prev.longestStreak, currentStreak),
    lastActiveDay: today,
  };
}

export function getStreak(): StreakState {
  if (typeof window === "undefined") return EMPTY;
  const raw = window.localStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as StreakState) : EMPTY;
}

/** Marks today as an active learning day. Call whenever a checkpoint passes. */
export function markActiveToday(): StreakState {
  const prev = getStreak();
  const next = computeNextStreak(prev, todayKey());
  if (next === prev) return prev;

  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  }
  listeners.forEach((listener) => listener());
  return next;
}
