"use client";

import { useRef, useCallback, type ReactNode } from "react";
import styles from "./DistributionPlayground.module.css";

export interface DistributionPlaygroundProps {
  labels: string[];
  /** Already-normalized probabilities (sum to 1) — this component only renders and reports drags. */
  probabilities: number[];
  /** Fires with a raw vertical drag fraction in [0,1]; the caller decides how to fold it into new weights. */
  onDrag: (index: number, fraction: number) => void;
  width?: number;
  height?: number;
  readout?: ReactNode;
  /** Recolors every bar, e.g. once a checkpoint has passed. */
  passed?: boolean;
}

export function DistributionPlayground({
  labels,
  probabilities,
  onDrag,
  width = 320,
  height = 220,
  readout,
  passed = false,
}: DistributionPlaygroundProps) {
  const margin = { top: 28, right: 16, bottom: 24, left: 16 };
  const plotHeight = height - margin.top - margin.bottom;
  const plotWidth = width - margin.left - margin.right;
  const n = labels.length;
  const gap = 14;
  const barWidth = (plotWidth - gap * (n - 1)) / n;

  const svgRef = useRef<SVGSVGElement>(null);
  const draggingIndex = useRef<number | null>(null);

  const updateFromClientY = useCallback(
    (clientY: number) => {
      const idx = draggingIndex.current;
      if (idx === null) return;
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const scaleFactor = height / rect.height;
      const localY = (clientY - rect.top) * scaleFactor - margin.top;
      const fraction = 1 - localY / plotHeight;
      onDrag(idx, Math.min(1, Math.max(0.02, fraction)));
    },
    [height, plotHeight, margin.top, onDrag],
  );

  return (
    <div className={styles.wrap}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className={styles.svg}
        role="img"
        aria-label="Interactive probability distribution — drag a bar to change its likelihood; the others renormalize."
        onPointerMove={(e) => {
          if (draggingIndex.current !== null) updateFromClientY(e.clientY);
        }}
        onPointerUp={() => {
          draggingIndex.current = null;
        }}
        onPointerLeave={() => {
          draggingIndex.current = null;
        }}
      >
        <line
          x1={margin.left}
          y1={margin.top + plotHeight}
          x2={width - margin.right}
          y2={margin.top + plotHeight}
          className={styles.axis}
        />
        {labels.map((label, i) => {
          const x = margin.left + i * (barWidth + gap);
          const p = probabilities[i] ?? 0;
          const barHeight = p * plotHeight;
          const y = margin.top + plotHeight - barHeight;
          return (
            <g key={label}>
              <rect
                x={x}
                y={margin.top}
                width={barWidth}
                height={plotHeight}
                className={styles.hitArea}
                tabIndex={0}
                role="slider"
                aria-label={`${label}: ${(p * 100).toFixed(0)}%`}
                onPointerDown={(e) => {
                  draggingIndex.current = i;
                  (e.target as Element).setPointerCapture?.(e.pointerId);
                  updateFromClientY(e.clientY);
                }}
                onKeyDown={(e) => {
                  const step = 0.05;
                  if (e.key === "ArrowUp") onDrag(i, Math.min(1, p + step));
                  if (e.key === "ArrowDown") onDrag(i, Math.max(0.02, p - step));
                }}
              />
              <rect x={x} y={y} width={barWidth} height={barHeight} className={passed ? styles.barPassed : styles.bar} />
              <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" className={styles.percentLabel}>
                {(p * 100).toFixed(0)}%
              </text>
              <text
                x={x + barWidth / 2}
                y={margin.top + plotHeight + 17}
                textAnchor="middle"
                className={styles.categoryLabel}
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>
      {readout && <div className={styles.readout}>{readout}</div>}
    </div>
  );
}
