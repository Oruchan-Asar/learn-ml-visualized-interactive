import Link from "next/link";
import styles from "./page.module.css";
import { CURRICULUM } from "@/lib/curriculum";
import { HomeSearch } from "./HomeSearch";
import { StreakBar } from "./StreakBar";

export default function Home() {
  return (
    <div className={styles.page}>
      <header className={styles.masthead}>
        <span className={styles.eyebrow}>Gradient · Phase 1</span>
        <h1 className={styles.title}>Zero to hero, one chapter at a time.</h1>
        <p className={styles.subtitle}>
          Machine learning, deep learning, explainable AI, and multimodal AI — every formula visualized,
          every chapter tested.
        </p>
        <Link href="/glossary" className={styles.glossaryLink}>
          Glossary of abbreviations →
        </Link>
      </header>

      <StreakBar />

      <HomeSearch curriculum={CURRICULUM} />
    </div>
  );
}
