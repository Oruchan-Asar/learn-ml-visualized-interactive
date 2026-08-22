"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import type { ChapterMeta } from "@/lib/curriculum";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";

export interface HomeSearchProps {
  curriculum: ChapterMeta[];
}

/** Its own component so the hook is called once per card, not inside a .map callback. */
function MasteryCheck({ slug }: { slug: string }) {
  const passed = useCheckpointPassed(slug);
  if (!passed) return null;
  return (
    <span className={styles.masteryCheck} aria-label="Checkpoint passed">
      ✓
    </span>
  );
}

/**
 * 150 chapters across 19 parts is too much to dump on screen fully expanded — the home page used to
 * open every part by default. Parts now start collapsed, and a search box filters by title/blurb,
 * auto-expanding only the parts that still have a match so the rest of the page stays out of the way.
 */
export function HomeSearch({ curriculum }: HomeSearchProps) {
  const [query, setQuery] = useState("");
  const [openParts, setOpenParts] = useState<Set<string>>(new Set());
  const parts = useMemo(() => [...new Set(curriculum.map((c) => c.part))], [curriculum]);

  const q = query.trim().toLowerCase();
  const isSearching = q.length > 0;
  const matches = (c: ChapterMeta) => `${c.title} ${c.blurb} ${c.part}`.toLowerCase().includes(q);

  // `<details>` fires `toggle` for a React-driven `open` change (e.g. isSearching flipping) just as much
  // as for a real click — treating every toggle as "flip the stored state" fights the controlled `open`
  // prop and oscillates forever. Setting from the DOM's actual `open` value instead makes it idempotent.
  function syncPartOpen(part: string, isOpen: boolean) {
    setOpenParts((prev) => {
      if (prev.has(part) === isOpen) return prev;
      const next = new Set(prev);
      if (isOpen) next.add(part);
      else next.delete(part);
      return next;
    });
  }

  return (
    <>
      <div className={styles.searchRow}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${curriculum.length} chapters…`}
          className={styles.searchInput}
          aria-label="Search chapters by title or topic"
        />
      </div>

      {parts.map((part) => {
        const chaptersInPart = curriculum.filter((c) => c.part === part);
        const visible = isSearching ? chaptersInPart.filter(matches) : chaptersInPart;
        if (isSearching && visible.length === 0) return null;
        const open = isSearching || openParts.has(part);

        return (
          <details
            key={part}
            className={styles.partSection}
            open={open}
            onToggle={(e) => !isSearching && syncPartOpen(part, e.currentTarget.open)}
          >
            <summary className={styles.partSummary}>
              <span className={styles.partTitle}>{part}</span>
              <span className={styles.partCount}>
                {isSearching ? `${visible.length} match${visible.length === 1 ? "" : "es"}` : `${chaptersInPart.length} chapters`}
              </span>
            </summary>
            <div className={styles.cardList}>
              {visible.map((c) => (
                <Link key={c.slug} href={`/chapter/${c.slug}`} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <span className={styles.cardNumber}>Chapter {c.chapterNumber}</span>
                    <MasteryCheck slug={c.slug} />
                  </div>
                  <h2 className={styles.cardTitle}>{c.title}</h2>
                  <p className={styles.cardBlurb}>{c.blurb}</p>
                </Link>
              ))}
            </div>
          </details>
        );
      })}

      {isSearching && parts.every((part) => curriculum.filter((c) => c.part === part).filter(matches).length === 0) && (
        <p className={styles.noResults}>No chapters match &ldquo;{query}&rdquo;.</p>
      )}
    </>
  );
}
