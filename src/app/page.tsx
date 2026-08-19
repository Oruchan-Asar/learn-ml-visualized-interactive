import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <header className={styles.masthead}>
        <span className={styles.eyebrow}>Gradient · Phase 0</span>
        <h1 className={styles.title}>Zero to hero, one chapter at a time.</h1>
        <p className={styles.subtitle}>
          Machine learning, deep learning, explainable AI, and multimodal AI — every formula visualized,
          every chapter tested.
        </p>
      </header>

      <p className={styles.partLabel}>Part I — Foundations</p>
      <Link href="/chapter/what-is-a-gradient" className={styles.card}>
        <span className={styles.cardNumber}>Chapter 1</span>
        <h2 className={styles.cardTitle}>What is a gradient?</h2>
        <p className={styles.cardBlurb}>
          Drag a point along a curve, watch the tangent line, and find the exact spot where the gradient
          hits zero.
        </p>
      </Link>
    </div>
  );
}
