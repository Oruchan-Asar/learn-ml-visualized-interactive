import Link from "next/link";
import styles from "./page.module.css";
import { getCourse } from "@/lib/courses";
import { HomeSearch } from "@/components/home/HomeSearch";
import { StreakBar } from "@/components/home/StreakBar";

const COURSE = getCourse("ml-zero-to-hero");

export default function MlCoursePage() {
  return (
    <div className={styles.page}>
      <header className={styles.masthead}>
        <span className={styles.eyebrow}>{COURSE.eyebrow}</span>
        <h1 className={styles.title}>Zero to hero, one chapter at a time.</h1>
        <p className={styles.subtitle}>{COURSE.blurb}</p>
        <p className={styles.links}>
          <Link href="/" className={styles.backLink}>
            ← All courses
          </Link>
          {COURSE.glossaryHref && (
            <Link href={COURSE.glossaryHref} className={styles.glossaryLink}>
              Glossary of abbreviations →
            </Link>
          )}
        </p>
      </header>

      <StreakBar courseSlug={COURSE.slug} slugs={COURSE.curriculum.map((c) => c.slug)} />

      <HomeSearch curriculum={COURSE.curriculum} chapterBasePath={COURSE.chapterBasePath} />
    </div>
  );
}
