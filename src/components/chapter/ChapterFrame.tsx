import type { ReactNode } from "react";
import Link from "next/link";
import styles from "./ChapterFrame.module.css";

export interface ChapterFrameProps {
  partLabel: string;
  chapterNumber: number;
  title: string;
  children: ReactNode;
}

export function ChapterFrame({ partLabel, chapterNumber, title, children }: ChapterFrameProps) {
  return (
    <div className={styles.page}>
      <Link href="/" className={styles.back}>
        ← All chapters
      </Link>
      <header className={styles.masthead}>
        <span className={styles.partLabel}>
          {partLabel} · Chapter {chapterNumber}
        </span>
        <h1 className={styles.title}>{title}</h1>
      </header>
      <article>{children}</article>
    </div>
  );
}
