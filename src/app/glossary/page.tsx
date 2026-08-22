import type { Metadata } from "next";
import Link from "next/link";
import homeStyles from "../page.module.css";
import styles from "./Glossary.module.css";
import { GlossarySearch } from "./GlossarySearch";

export const metadata: Metadata = {
  title: "Glossary — Gradient",
  description: "Every abbreviation used across the curriculum, spelled out in full, with a link back to where it's introduced.",
};

export default function GlossaryPage() {
  return (
    <div className={homeStyles.page}>
      <Link href="/" className={styles.back}>
        ← All chapters
      </Link>
      <header className={homeStyles.masthead}>
        <span className={homeStyles.eyebrow}>Gradient · Reference</span>
        <h1 className={homeStyles.title}>Glossary</h1>
        <p className={homeStyles.subtitle}>
          Every abbreviation used across the curriculum, spelled out in full — with a link back to the
          chapter where it&rsquo;s introduced.
        </p>
      </header>

      <GlossarySearch />
    </div>
  );
}
