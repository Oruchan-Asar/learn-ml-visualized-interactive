"use client";

import Link from "next/link";
import type { CourseInfo } from "@/lib/courses";
import { useMasteredCount } from "@/lib/mastery/useMasteredCount";
import { useCurrentStreak } from "@/lib/mastery/useCurrentStreak";
import styles from "./page.module.css";

export function CourseCard({ course }: { course: CourseInfo }) {
  const slugs = course.curriculum.map((c) => c.slug);
  const mastered = useMasteredCount(slugs);
  const streak = useCurrentStreak(course.slug);
  const total = slugs.length;
  const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;

  return (
    <Link href={course.homeHref} className={styles.courseCard}>
      <span className={styles.courseEyebrow}>{course.eyebrow}</span>
      <h2 className={styles.courseTitle}>{course.title}</h2>
      <p className={styles.courseBlurb}>{course.blurb}</p>
      <div className={styles.courseFooter}>
        <span className={styles.courseStreak} aria-label={streak > 0 ? `${streak}-day streak` : "No streak yet"}>
          <span className={streak > 0 ? styles.courseFlameActive : styles.courseFlame} aria-hidden="true">
            🔥
          </span>
          {streak > 0 ? `${streak}-day streak` : "No streak yet"}
        </span>
        <span>
          {total} chapter{total === 1 ? "" : "s"}
        </span>
        <div className={styles.courseProgress}>
          <div className={styles.courseProgressFill} style={{ width: `${pct}%` }} />
        </div>
        <span>{mastered} mastered</span>
      </div>
    </Link>
  );
}
