"use client";

import styles from "./KernelHeatmap.module.css";

export interface KernelHeatmapProps {
  kernel: number[][];
  label?: string;
  width?: number;
}

/** A small NxN kernel as a diverging heatmap — warm for positive weights, cool for negative, opacity by magnitude. */
export function KernelHeatmap({ kernel, label, width = 130 }: KernelHeatmapProps) {
  const size = kernel.length;
  const cell = width / size;
  const maxAbs = Math.max(1e-6, ...kernel.flat().map(Math.abs));

  return (
    <div className={styles.wrap}>
      <svg viewBox={`0 0 ${width} ${width}`} className={styles.svg} role="img" aria-label={label ?? "A kernel, shown as a heatmap of its weights."}>
        {kernel.map((row, r) =>
          row.map((v, c) => {
            const normalized = Math.abs(v) / maxAbs;
            return (
              <g key={`${r}-${c}`}>
                <rect
                  x={c * cell}
                  y={r * cell}
                  width={cell - 1}
                  height={cell - 1}
                  className={v >= 0 ? styles.cellPositive : styles.cellNegative}
                  fillOpacity={0.15 + normalized * 0.8}
                />
                <text x={c * cell + cell / 2} y={r * cell + cell / 2 + 4} textAnchor="middle" className={styles.cellText}>
                  {v.toFixed(1)}
                </text>
              </g>
            );
          }),
        )}
      </svg>
      {label && <div className={styles.label}>{label}</div>}
    </div>
  );
}
