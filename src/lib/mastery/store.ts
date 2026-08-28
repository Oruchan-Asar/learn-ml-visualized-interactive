import { markActiveToday } from "./streak";
import { getCourseForChapter } from "@/lib/courses";

export interface CheckpointResult {
  passed: boolean;
  attempts: number;
  lastAttemptAt: number;
}

const key = (conceptId: string) => `gradient:mastery:${conceptId}`;

type Listener = () => void;
const listeners = new Set<Listener>();

/** Lets `useCheckpointPassed` react when a result is written, without polling. */
export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCheckpointResult(conceptId: string): CheckpointResult | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(key(conceptId));
  return raw ? (JSON.parse(raw) as CheckpointResult) : null;
}

/** Records one attempt. `passed` only ever turns true → stays true across retries. */
export function recordCheckpointAttempt(conceptId: string, passed: boolean): CheckpointResult {
  const prev = getCheckpointResult(conceptId);
  const result: CheckpointResult = {
    passed: passed || Boolean(prev?.passed),
    attempts: (prev?.attempts ?? 0) + 1,
    lastAttemptAt: Date.now(),
  };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(key(conceptId), JSON.stringify(result));
  }
  if (result.passed) {
    const course = getCourseForChapter(conceptId);
    if (course) markActiveToday(course.slug);
  }
  listeners.forEach((listener) => listener());
  return result;
}

/** How many of the given concepts have ever been passed. */
export function getMasteredCount(conceptIds: string[]): number {
  return conceptIds.reduce((count, id) => count + (getCheckpointResult(id)?.passed ? 1 : 0), 0);
}
