"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { CURRICULUM, getChapterMeta, getChapterNeighbors, getShippedChapters } from "@/lib/curriculum";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "./ChapterFrame.module.css";

export interface ChapterFrameProps {
  slug: string;
  children: ReactNode;
}

/** Its own component so the hook is called once per chapter row, not inside a .map callback. */
function MasteryCheck({ slug }: { slug: string }) {
  const passed = useCheckpointPassed(slug);
  if (!passed) return null;
  return (
    <span className={styles.masteryCheck} aria-label="Checkpoint passed">
      ✓
    </span>
  );
}

export function ChapterFrame({ slug, children }: ChapterFrameProps) {
  const meta = getChapterMeta(slug);
  const { index, prev, next } = getChapterNeighbors(slug);
  const shippedCount = getShippedChapters().length;
  const parts = [...new Set(CURRICULUM.map((c) => c.part))];

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.back}>
          ← All chapters
        </Link>
        <p className={styles.position}>
          Chapter {index + 1} of {shippedCount}
        </p>

        <details className={styles.overview} open>
          <summary>Contents</summary>
          <div className={styles.overviewBody}>
            {parts.map((part) => {
              const chaptersInPart = CURRICULUM.filter((c) => c.part === part);
              const shippedInPart = chaptersInPart.filter((c) => c.status === "shipped").length;
              const isCurrentPart = part === meta.part;
              return (
                <details key={part} className={styles.overviewPart} open={isCurrentPart}>
                  <summary className={styles.overviewPartSummary}>
                    <span>{part}</span>
                    <span className={styles.overviewPartCount}>
                      {shippedInPart}/{chaptersInPart.length}
                    </span>
                  </summary>
                  <ol className={styles.overviewPartList}>
                    {chaptersInPart.map((c) => {
                      const isCurrent = c.slug === slug;
                      if (c.status !== "shipped") {
                        return (
                          <li key={c.slug}>
                            <span className={styles.overviewLinkPlanned} aria-disabled="true">
                              Chapter {c.chapterNumber} — {c.title}
                            </span>
                          </li>
                        );
                      }
                      return (
                        <li key={c.slug}>
                          <Link
                            href={`/chapter/${c.slug}`}
                            className={isCurrent ? styles.overviewLinkCurrent : styles.overviewLink}
                          >
                            <span>
                              Chapter {c.chapterNumber} — {c.title}
                            </span>
                            <MasteryCheck slug={c.slug} />
                          </Link>
                        </li>
                      );
                    })}
                  </ol>
                </details>
              );
            })}
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
