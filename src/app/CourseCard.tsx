"use client";

import Link from "next/link";
import type { CourseInfo } from "@/lib/courses";
import { useMasteredCount } from "@/lib/mastery/useMasteredCount";
import styles from "./page.module.css";

export function CourseCard({ course }: { course: CourseInfo }) {
  const slugs = course.curriculum.map((c) => c.slug);
  const mastered = useMasteredCount(slugs);
  const total = slugs.length;
  const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;

  return (
    <Link href={course.homeHref} className={styles.courseCard}>
      <span className={styles.courseEyebrow}>{course.eyebrow}</span>
      <h2 className={styles.courseTitle}>{course.title}</h2>
      <p className={styles.courseBlurb}>{course.blurb}</p>
      <div className={styles.courseFooter}>
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
