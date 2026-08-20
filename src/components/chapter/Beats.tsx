import type { ReactNode } from "react";
import styles from "./Beats.module.css";

function Beat({ eyebrow, children }: { eyebrow: string; children: ReactNode }) {
  return (
    <section className={styles.beat}>
      <span className={styles.eyebrow}>{eyebrow}</span>
      {children}
    </section>
  );
}

/** Poses the question the concept answers — one sentence, no formula yet. */
export function Hook({ children }: { children: ReactNode }) {
  return (
    <Beat eyebrow="Hook">
      <div className={styles.hook}>{children}</div>
    </Beat>
  );
}

/** Builds a feel for the mechanism via a manipulable visualization. */
export function Intuition({ children }: { children: ReactNode }) {
  return (
    <Beat eyebrow="Intuition">
      <div className={styles.prose}>{children}</div>
    </Beat>
  );
}

/** Names what was just seen — the formula, term by term. */
export function Formalize({ children }: { children: ReactNode }) {
  return (
    <Beat eyebrow="Formalize">
      <div className={styles.prose}>{children}</div>
    </Beat>
  );
}

/** The same visualization, now linked to the formula's variables. */
export function Play({ children }: { children: ReactNode }) {
  return (
    <Beat eyebrow="Play">
      <div className={styles.prose}>{children}</div>
    </Beat>
  );
}

/** A step-by-step numeric walkthrough with real numbers. */
export function WorkedExample({ children }: { children: ReactNode }) {
  return (
    <Beat eyebrow="Worked example">
      <div className={styles.prose}>{children}</div>
    </Beat>
  );
}

/** Wraps a sequence of <Step> blocks inside a WorkedExample, numbering them in order. */
export function Steps({ children }: { children: ReactNode }) {
  return <ol className={styles.steps}>{children}</ol>;
}

/** One numbered step of a worked example: a short label plus its math/prose. */
export function Step({ label, children }: { label: string; children: ReactNode }) {
  return (
    <li className={styles.step}>
      <span className={styles.stepNumber} aria-hidden="true" />
      <div className={styles.stepBody}>
        <span className={styles.stepLabel}>{label}</span>
        <div className={styles.stepContent}>{children}</div>
      </div>
    </li>
  );
}

/** The anchor for later spaced review: one formula, one sentence. */
export function Summary({ children }: { children: ReactNode }) {
  return (
    <Beat eyebrow="Summary">
      <div className={`${styles.summaryCard} ${styles.prose}`}>{children}</div>
    </Beat>
  );
}
