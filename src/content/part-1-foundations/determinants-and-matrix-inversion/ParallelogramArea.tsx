"use client";

import type { Mat2 } from "@/lib/math-core/matrices";
import { determinant, mapUnitSquare } from "@/lib/math-core/determinants-and-matrix-inversion";
import styles from "./ParallelogramArea.module.css";

const DOMAIN: [number, number] = [-4, 4];
const SIZE = 220;
const MARGIN = 16;

function toPx([x, y]: [number, number]): [number, number] {
  const [lo, hi] = DOMAIN;
  const scale = (SIZE - 2 * MARGIN) / (hi - lo);
  return [MARGIN + (x - lo) * scale, SIZE - MARGIN - (y - lo) * scale];
}

/** The unit square, mapped through m, drawn as a solid parallelogram whose area is exactly |det(m)|. */
export function ParallelogramArea({ matrix }: { matrix: Mat2 }) {
  const det = determinant(matrix);
  const unitCorners: [number, number][] = [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
  ];
  const mapped = mapUnitSquare(matrix);
  const unitPath = unitCorners.map(toPx).map(([x, y]) => `${x},${y}`).join(" ");
  const mappedPath = mapped.map(toPx).map(([x, y]) => `${x},${y}`).join(" ");
  const origin = toPx([0, 0]);

  return (
    <div className={styles.wrap}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className={styles.svg} role="img" aria-label="The unit square mapped through the matrix, forming a parallelogram whose area is the determinant's absolute value.">
        <line x1={MARGIN} y1={origin[1]} x2={SIZE - MARGIN} y2={origin[1]} className={styles.axis} />
        <line x1={origin[0]} y1={MARGIN} x2={origin[0]} y2={SIZE - MARGIN} className={styles.axis} />
        <polygon points={unitPath} className={styles.unitSquare} />
        <polygon points={mappedPath} className={det >= 0 ? styles.parallelogramPositive : styles.parallelogramNegative} />
      </svg>
      <div className={styles.readout}>
        area = |det| = {Math.abs(det).toFixed(1)}, orientation {det >= 0 ? "preserved" : "flipped"}
        {det === 0 && " — collapsed to a line (zero area)"}
      </div>
    </div>
  );
}
