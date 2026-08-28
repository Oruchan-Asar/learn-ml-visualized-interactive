"use client";

import { useCurrentStreak } from "@/lib/mastery/useCurrentStreak";
import { useMasteredCount } from "@/lib/mastery/useMasteredCount";
import styles from "./StreakBar.module.css";

export interface StreakBarProps {
  /** Chapter slugs whose mastery counts toward this bar's progress — pass one course's slugs, or all of them. */
  slugs: string[];
}

/** The daily streak itself is global (any checkpoint, any course, keeps it alive); only the progress count is scoped to `slugs`. */
export function StreakBar({ slugs }: StreakBarProps) {
  const streak = useCurrentStreak();
  const mastered = useMasteredCount(slugs);
  const total = slugs.length;
  const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;

  return (
    <div className={styles.bar}>
      <div className={styles.streak}>
        <span className={streak > 0 ? styles.flameActive : styles.flame} aria-hidden="true">
          🔥
        </span>
        <span className={styles.streakCount}>{streak > 0 ? `${streak}-day streak` : "Pass a checkpoint to start a streak"}</span>
      </div>
      <div className={styles.progress} role="img" aria-label={`${mastered} of ${total} chapters mastered`}>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${pct}%` }} />
        </div>
        <span className={styles.progressLabel}>
          {mastered} / {total} mastered
        </span>
      </div>
    </div>
  );
}
