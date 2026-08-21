"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import type { ChapterMeta } from "@/lib/curriculum";

export interface HomeSearchProps {
  curriculum: ChapterMeta[];
}

/**
 * 154 chapters across 19 parts is too much to dump on screen fully expanded — the home page used to
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

  const totalShipped = curriculum.filter((c) => c.status === "shipped").length;

  function togglePart(part: string) {
    setOpenParts((prev) => {
      const next = new Set(prev);
      if (next.has(part)) next.delete(part);
      else next.add(part);
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
        <span className={styles.searchCount}>
          {totalShipped} / {curriculum.length} shipped
        </span>
      </div>

      {parts.map((part) => {
        const chaptersInPart = curriculum.filter((c) => c.part === part);
        const visible = isSearching ? chaptersInPart.filter(matches) : chaptersInPart;
        if (isSearching && visible.length === 0) return null;
        const shippedInPart = chaptersInPart.filter((c) => c.status === "shipped").length;
        const open = isSearching || openParts.has(part);

        return (
          <details key={part} className={styles.partSection} open={open} onToggle={() => !isSearching && togglePart(part)}>
            <summary className={styles.partSummary}>
              <span className={styles.partTitle}>{part}</span>
              <span className={styles.partCount}>
                {isSearching ? `${visible.length} match${visible.length === 1 ? "" : "es"}` : `${shippedInPart} / ${chaptersInPart.length} shipped`}
              </span>
            </summary>
            <div className={styles.cardList}>
              {visible.map((c) =>
                c.status === "shipped" ? (
                  <Link key={c.slug} href={`/chapter/${c.slug}`} className={styles.card}>
                    <span className={styles.cardNumber}>Chapter {c.chapterNumber}</span>
                    <h2 className={styles.cardTitle}>{c.title}</h2>
                    <p className={styles.cardBlurb}>{c.blurb}</p>
                  </Link>
                ) : (
                  <div key={c.slug} className={styles.cardPlanned} aria-disabled="true">
                    <div className={styles.cardHeader}>
                      <span className={styles.cardNumber}>
                        Chapter {c.chapterNumber}
                        {c.capstone && " · Capstone"}
                      </span>
                      <span className={styles.plannedTag}>Planned</span>
                    </div>
                    <h2 className={styles.cardTitle}>{c.title}</h2>
                    <p className={styles.cardBlurb}>{c.blurb}</p>
                  </div>
                ),
              )}
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
