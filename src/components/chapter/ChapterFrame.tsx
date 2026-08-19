import type { ReactNode } from "react";
import Link from "next/link";
import { CURRICULUM, getChapterMeta, getChapterNeighbors } from "@/lib/curriculum";
import styles from "./ChapterFrame.module.css";

export interface ChapterFrameProps {
  slug: string;
  children: ReactNode;
}

export function ChapterFrame({ slug, children }: ChapterFrameProps) {
  const meta = getChapterMeta(slug);
  const { index, prev, next } = getChapterNeighbors(slug);

  return (
    <div className={styles.page}>
      <Link href="/" className={styles.back}>
        ← All chapters
      </Link>

      <details className={styles.overview}>
        <summary>
          Overview — chapter {index + 1} of {CURRICULUM.length}
        </summary>
        <ol className={styles.overviewList}>
          {CURRICULUM.map((c) => {
            const isCurrent = c.slug === slug;
            return (
              <li key={c.slug}>
                <Link
                  href={`/chapter/${c.slug}`}
                  className={isCurrent ? styles.overviewLinkCurrent : styles.overviewLink}
                >
                  {c.part} · Chapter {c.chapterNumber} — {c.title}
                  {isCurrent && " (current)"}
                </Link>
              </li>
            );
          })}
        </ol>
      </details>

      <header className={styles.masthead}>
        <span className={styles.partLabel}>
          {meta.part} · Chapter {meta.chapterNumber}
        </span>
        <h1 className={styles.title}>{meta.title}</h1>
      </header>

      <article>{children}</article>

      <nav className={styles.chapterNav} aria-label="Chapter navigation">
        {prev ? (
          <Link href={`/chapter/${prev.slug}`} className={styles.navLink}>
            <span className={styles.navEyebrow}>← Previous</span>
            <span className={styles.navTitle}>{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/chapter/${next.slug}`} className={`${styles.navLink} ${styles.navNext}`}>
            <span className={styles.navEyebrow}>Next →</span>
            <span className={styles.navTitle}>{next.title}</span>
          </Link>
        ) : (
          <span className={styles.navEnd}>You&rsquo;ve reached the end — more chapters coming soon.</span>
        )}
      </nav>
    </div>
  );
}
