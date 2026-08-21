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
export function KernelHeatmap({ kernel, label, width = 160, onCellClick, selected }: KernelHeatmapProps) {
  const size = kernel.length;
  const cell = width / size;
  const maxAbs = Math.max(1e-6, ...kernel.flat().map(Math.abs));
  // Font size was a fixed 11 regardless of grid size, so a 7x7+ grid (much smaller cells than the 3x3
  // this was designed around) rendered text larger than its own cell, overlapping every neighbor.
  // Scale with the cell instead, and drop the label entirely once a cell is too small to hold it.
  const fontSize = Math.min(9, cell * 0.3);
  const showText = cell >= 9;

  return (
    <div className={styles.wrap}>
      <svg
        viewBox={`0 0 ${width} ${width}`}
        className={styles.svg}
        role="img"
        aria-label={label ?? "A kernel, shown as a heatmap of its weights."}
        style={{ maxWidth: width }}
      >
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
                {showText && (
                  <text
                    x={c * cell + cell / 2}
                    y={r * cell + cell / 2 + fontSize * 0.35}
                    textAnchor="middle"
                    className={styles.cellText}
                    style={{ fontSize }}
                  >
                    {v.toFixed(1)}
                  </text>
                )}
              </g>
            );
          }),
        )}
      </svg>
      {label && <div className={styles.label}>{label}</div>}
    </div>
  );
}
