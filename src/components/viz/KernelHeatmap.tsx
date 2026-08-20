"use client";

import styles from "./KernelHeatmap.module.css";

export interface KernelHeatmapProps {
  kernel: number[][];
  label?: string;
  width?: number;
  /** When present, each cell becomes clickable — e.g. for a "click the highest/lowest cell" checkpoint. */
  onCellClick?: (row: number, col: number) => void;
  /** Cell to ring as the current selection, e.g. after a click. */
  selected?: { row: number; col: number } | null;
}

/** A small NxN kernel as a diverging heatmap — warm for positive weights, cool for negative, opacity by magnitude. */
export function KernelHeatmap({ kernel, label, width = 130, onCellClick, selected }: KernelHeatmapProps) {
  const size = kernel.length;
  const cell = width / size;
  const maxAbs = Math.max(1e-6, ...kernel.flat().map(Math.abs));

  return (
    <div className={styles.wrap}>
      <svg viewBox={`0 0 ${width} ${width}`} className={styles.svg} role="img" aria-label={label ?? "A kernel, shown as a heatmap of its weights."}>
        {kernel.map((row, r) =>
          row.map((v, c) => {
            const normalized = Math.abs(v) / maxAbs;
            const isSelected = selected?.row === r && selected?.col === c;
            return (
              <g key={`${r}-${c}`}>
                <rect
                  x={c * cell}
                  y={r * cell}
                  width={cell - 1}
                  height={cell - 1}
                  className={v >= 0 ? styles.cellPositive : styles.cellNegative}
                  fillOpacity={0.15 + normalized * 0.8}
                  onClick={onCellClick ? () => onCellClick(r, c) : undefined}
                  style={onCellClick ? { cursor: "pointer" } : undefined}
                />
                {isSelected && (
                  <rect
                    x={c * cell + 1}
                    y={r * cell + 1}
                    width={cell - 3}
                    height={cell - 3}
                    className={styles.cellSelected}
                  />
                )}
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
