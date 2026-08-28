"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { getCourse, type CourseInfo } from "@/lib/courses";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "./ChapterFrame.module.css";

const ML_COURSE = getCourse("ml-zero-to-hero");

export interface ChapterFrameProps {
  slug: string;
  children: ReactNode;
  /** Defaults to the ML course, so every existing chapter page needs no changes. */
  course?: CourseInfo;
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

export function ChapterFrame({ slug, children, course = ML_COURSE }: ChapterFrameProps) {
  const { curriculum, homeHref, chapterBasePath, glossaryHref } = course;
  const meta = curriculum.find((c) => c.slug === slug);
  if (!meta) throw new Error(`Unknown chapter slug: ${slug}`);
  const index = curriculum.findIndex((c) => c.slug === slug);
  const prev = index > 0 ? curriculum[index - 1] : null;
  const next = index < curriculum.length - 1 ? curriculum[index + 1] : null;
  const parts = [...new Set(curriculum.map((c) => c.part))];

  // The current chapter's part auto-expands, but for a chapter deep into the curriculum that part can
  // still sit far below the fold in the (independently scrollable) contents list — scroll it into view
  // on every navigation so the sidebar always opens already focused on where you actually are.
  const currentLinkRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    currentLinkRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [slug]);

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <Link href={homeHref} className={styles.back}>
          ← All chapters
        </Link>
        {glossaryHref && (
          <Link href={glossaryHref} className={styles.glossary}>
            Glossary
          </Link>
        )}
        <p className={styles.position}>
          Chapter {index + 1} of {curriculum.length}
        </p>

        <details className={styles.overview} open>
          <summary>Contents</summary>
          <div className={styles.overviewBody}>
            {parts.map((part) => {
              const chaptersInPart = curriculum.filter((c) => c.part === part);
              const isCurrentPart = part === meta.part;
              return (
                <details key={part} className={styles.overviewPart} open={isCurrentPart}>
                  <summary className={styles.overviewPartSummary}>
                    <span>{part}</span>
                    <span className={styles.overviewPartCount}>{chaptersInPart.length}</span>
                  </summary>
                  <ol className={styles.overviewPartList}>
                    {chaptersInPart.map((c) => {
                      const isCurrent = c.slug === slug;
                      return (
                        <li key={c.slug}>
                          <Link
                            href={`${chapterBasePath}/${c.slug}`}
                            ref={isCurrent ? currentLinkRef : undefined}
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
            <Link href={`${chapterBasePath}/${prev.slug}`} className={styles.navLink}>
              <span className={styles.navEyebrow}>← Previous</span>
              <span className={styles.navTitle}>{prev.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link href={`${chapterBasePath}/${next.slug}`} className={`${styles.navLink} ${styles.navNext}`}>
              <span className={styles.navEyebrow}>Next →</span>
              <span className={styles.navTitle}>{next.title}</span>
            </Link>
          ) : (
            <span className={styles.navEnd}>You&rsquo;ve reached the end of the curriculum.</span>
          )}
        </nav>
      </div>
    </div>
  );
}
