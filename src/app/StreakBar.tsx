"use client";

import { CURRICULUM } from "@/lib/curriculum";
import { useCurrentStreak } from "@/lib/mastery/useCurrentStreak";
import { useMasteredCount } from "@/lib/mastery/useMasteredCount";
import styles from "./StreakBar.module.css";

const ALL_SLUGS = CURRICULUM.map((c) => c.slug);
const TOTAL = CURRICULUM.length;

export function StreakBar() {
  const streak = useCurrentStreak();
  const mastered = useMasteredCount(ALL_SLUGS);
  const pct = Math.round((mastered / TOTAL) * 100);

  return (
    <div className={styles.bar}>
      <div className={styles.streak}>
        <span className={streak > 0 ? styles.flameActive : styles.flame} aria-hidden="true">
          🔥
        </span>
        <span className={styles.streakCount}>{streak > 0 ? `${streak}-day streak` : "Pass a checkpoint to start a streak"}</span>
      </div>
      <div className={styles.progress} role="img" aria-label={`${mastered} of ${TOTAL} chapters mastered`}>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${pct}%` }} />
        </div>
        <span className={styles.progressLabel}>
          {mastered} / {TOTAL} mastered
        </span>
      </div>
    </div>
  );
}
