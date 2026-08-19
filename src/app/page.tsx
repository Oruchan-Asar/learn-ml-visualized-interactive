import Link from "next/link";
import styles from "./page.module.css";
import { CURRICULUM } from "@/lib/curriculum";

export default function Home() {
  const parts = [...new Set(CURRICULUM.map((c) => c.part))];

  return (
    <div className={styles.page}>
      <header className={styles.masthead}>
        <span className={styles.eyebrow}>Gradient · Phase 1</span>
        <h1 className={styles.title}>Zero to hero, one chapter at a time.</h1>
        <p className={styles.subtitle}>
          Machine learning, deep learning, explainable AI, and multimodal AI — every formula visualized,
          every chapter tested.
        </p>
      </header>

      {parts.map((part) => (
        <section key={part} className={styles.partSection}>
          <p className={styles.partLabel}>{part}</p>
          <div className={styles.cardList}>
            {CURRICULUM.filter((c) => c.part === part).map((c) => (
              <Link key={c.slug} href={`/chapter/${c.slug}`} className={styles.card}>
                <span className={styles.cardNumber}>Chapter {c.chapterNumber}</span>
                <h2 className={styles.cardTitle}>{c.title}</h2>
                <p className={styles.cardBlurb}>{c.blurb}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
