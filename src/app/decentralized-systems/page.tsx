import Link from "next/link";
import styles from "./page.module.css";
import { getCourse } from "@/lib/courses";
import { HomeSearch } from "@/components/home/HomeSearch";
import { StreakBar } from "@/components/home/StreakBar";

const COURSE = getCourse("decentralized-systems");

export default function DecentralizedSystemsCoursePage() {
  return (
    <div className={styles.page}>
      <header className={styles.masthead}>
        <span className={styles.eyebrow}>{COURSE.eyebrow}</span>
        <h1 className={styles.title}>Decentralized Systems</h1>
        <p className={styles.subtitle}>{COURSE.blurb}</p>
        <p className={styles.links}>
          <Link href="/" className={styles.backLink}>
            ← All courses
          </Link>
        </p>
      </header>

      <StreakBar slugs={COURSE.curriculum.map((c) => c.slug)} />

      <HomeSearch curriculum={COURSE.curriculum} chapterBasePath={COURSE.chapterBasePath} />
    </div>
  );
}
