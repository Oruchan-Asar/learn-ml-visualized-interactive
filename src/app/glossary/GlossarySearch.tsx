"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import homeStyles from "../page.module.css";
import styles from "./Glossary.module.css";
import { ABBREVIATIONS } from "@/lib/abbreviations";
import { CURRICULUM } from "@/lib/curriculum";

const titleBySlug = new Map(CURRICULUM.map((c) => [c.slug, c.title]));

export function GlossarySearch() {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const visible = useMemo(() => {
    if (!q) return ABBREVIATIONS;
    return ABBREVIATIONS.filter((entry) => `${entry.abbr} ${entry.longForm}`.toLowerCase().includes(q));
  }, [q]);

  return (
    <>
      <div className={homeStyles.searchRow}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${ABBREVIATIONS.length} abbreviations…`}
          className={homeStyles.searchInput}
          aria-label="Search abbreviations by short or long form"
        />
      </div>

      <p className={styles.count}>
        {query ? `${visible.length} match${visible.length === 1 ? "" : "es"}` : `${ABBREVIATIONS.length} abbreviations`}
      </p>

      <ul className={styles.list}>
        {visible.map((entry) => (
          <li key={entry.abbr} className={styles.entry}>
            <div className={styles.entryHeader}>
              <span className={styles.abbr}>{entry.abbr}</span>
              <span className={styles.longForm}>{entry.longForm}</span>
            </div>
            <div className={styles.chapterLinks}>
              {entry.chapters.map((slug) => (
                <Link key={slug} href={`/chapter/${slug}`} className={styles.chapterLink}>
                  {titleBySlug.get(slug) ?? slug}
                </Link>
              ))}
            </div>
          </li>
        ))}
      </ul>

      {visible.length === 0 && <p className={homeStyles.noResults}>No abbreviations match &ldquo;{query}&rdquo;.</p>}
    </>
  );
}
