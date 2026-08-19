import type { ReactNode } from "react";
import styles from "./BayesGrid.module.css";

export interface BayesGridProps {
  /** P(A) — the base rate. */
  prior: number;
  /** P(B|A). */
  sensitivity: number;
  /** P(B|not A). */
  falsePositiveRate: number;
  size?: number;
  readout?: ReactNode;
}

const GRID_SIZE = 10;
const TOTAL = GRID_SIZE * GRID_SIZE;

type Category = "tp" | "fp" | "fn" | "tn";

export function BayesGrid({ prior, sensitivity, falsePositiveRate, size = 280, readout }: BayesGridProps) {
  const tp = Math.round(TOTAL * prior * sensitivity);
  const fn = Math.round(TOTAL * prior * (1 - sensitivity));
  const fp = Math.round(TOTAL * (1 - prior) * falsePositiveRate);
  const tn = Math.max(0, TOTAL - tp - fn - fp);

  const cells: Category[] = [
    ...(Array(tp).fill("tp") as Category[]),
    ...(Array(fp).fill("fp") as Category[]),
    ...(Array(fn).fill("fn") as Category[]),
    ...(Array(tn).fill("tn") as Category[]),
  ];

  const cellSize = size / GRID_SIZE;
  const gap = 2;

  return (
    <div className={styles.wrap}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className={styles.svg}
        role="img"
        aria-label={`Out of 100 people, ${tp} have the condition and test positive, and ${fp} don't have it but test positive anyway.`}
      >
        {cells.map((cat, i) => {
          const row = Math.floor(i / GRID_SIZE);
          const col = i % GRID_SIZE;
          return (
            <rect
              key={i}
              x={col * cellSize + gap / 2}
              y={row * cellSize + gap / 2}
              width={cellSize - gap}
              height={cellSize - gap}
              rx={2}
              className={styles[cat]}
            />
          );
        })}
      </svg>
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={styles.swatchTp} /> Has it, tests positive
        </span>
        <span className={styles.legendItem}>
          <span className={styles.swatchFp} /> Doesn&rsquo;t, tests positive
        </span>
      </div>
      {readout && <div className={styles.readout}>{readout}</div>}
    </div>
  );
}
