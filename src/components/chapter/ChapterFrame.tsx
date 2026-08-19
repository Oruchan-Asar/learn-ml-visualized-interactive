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
  const parts = [...new Set(CURRICULUM.map((c) => c.part))];

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.back}>
          ← All chapters
        </Link>
        <p className={styles.position}>
          Chapter {index + 1} of {CURRICULUM.length}
        </p>

        <details className={styles.overview} open>
          <summary>Contents</summary>
          <div className={styles.overviewBody}>
            {parts.map((part) => (
              <div key={part}>
                <p className={styles.overviewPartLabel}>{part}</p>
                <ol className={styles.overviewPartList}>
                  {CURRICULUM.filter((c) => c.part === part).map((c) => {
                    const isCurrent = c.slug === slug;
                    return (
                      <li key={c.slug}>
                        <Link
                          href={`/chapter/${c.slug}`}
                          className={isCurrent ? styles.overviewLinkCurrent : styles.overviewLink}
                        >
                          Chapter {c.chapterNumber} — {c.title}
                          {isCurrent && " (current)"}
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </div>
            ))}
          </div>
        </details>
      </aside>

      <div className={styles.main}>
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
    </div>
  );
}
