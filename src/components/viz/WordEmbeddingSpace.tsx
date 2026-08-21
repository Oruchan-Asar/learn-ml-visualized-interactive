"use client";

import { useMemo, type ReactNode } from "react";
import { scaleLinear } from "d3";
import styles from "./WordEmbeddingSpace.module.css";

export interface EmbeddingPoint {
  label: string;
  x: number;
  y: number;
  /** Distinguishes points from different sources/modalities visually — e.g. images vs. captions vs. audio. Defaults to a circle. */
  shape?: "circle" | "square" | "triangle";
}

export interface WordEmbeddingSpaceProps {
  words: EmbeddingPoint[];
  /** Label of the word currently treated as the query (e.g. clicked, or one leg of an analogy). */
  queryLabel?: string | null;
  /** Label of the word currently highlighted as the answer/nearest neighbor. */
  nearestLabel?: string | null;
  /** An extra, non-word point to plot, e.g. the result of analogy arithmetic. */
  extraPoint?: { x: number; y: number; label: string } | null;
  onSelectWord?: (label: string) => void;
  domain?: [number, number];
  size?: number;
  readout?: ReactNode;
}

const DEFAULT_DOMAIN: [number, number] = [-1, 4];

export function WordEmbeddingSpace({
  words,
  queryLabel = null,
  nearestLabel = null,
  extraPoint = null,
  onSelectWord,
  domain = DEFAULT_DOMAIN,
  size = 320,
  readout,
}: WordEmbeddingSpaceProps) {
  const margin = 36;
  const [dMin, dMax] = domain;

  const scaleX = useMemo(() => scaleLinear().domain([dMin, dMax]).range([margin, size - margin]), [dMin, dMax, size]);
  const scaleY = useMemo(() => scaleLinear().domain([dMin, dMax]).range([size - margin, margin]), [dMin, dMax, size]);

  return (
    <div className={styles.wrap}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className={styles.svg}
        role="img"
        aria-label="A 2D embedding space — each point is an item, positioned so distance reflects meaning."
      >
        {extraPoint && (
          <g>
            <line
              x1={scaleX(extraPoint.x) - 8}
              y1={scaleY(extraPoint.y) - 8}
              x2={scaleX(extraPoint.x) + 8}
              y2={scaleY(extraPoint.y) + 8}
              className={styles.extraMark}
            />
            <line
              x1={scaleX(extraPoint.x) - 8}
              y1={scaleY(extraPoint.y) + 8}
              x2={scaleX(extraPoint.x) + 8}
              y2={scaleY(extraPoint.y) - 8}
              className={styles.extraMark}
            />
            <text x={scaleX(extraPoint.x)} y={scaleY(extraPoint.y) - 14} textAnchor="middle" className={styles.extraLabel}>
              {extraPoint.label}
            </text>
          </g>
        )}

        {words.map((w) => {
          const isQuery = w.label === queryLabel;
          const isNearest = w.label === nearestLabel;
          const cx = scaleX(w.x);
          const cy = scaleY(w.y);
          const r = isQuery || isNearest ? 9 : 6;
          const pointClass = isQuery ? styles.pointQuery : isNearest ? styles.pointNearest : styles.point;
          return (
            <g
              key={w.label}
              onClick={onSelectWord ? () => onSelectWord(w.label) : undefined}
              className={onSelectWord ? styles.clickable : undefined}
            >
              {w.shape === "square" ? (
                <rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} className={pointClass} />
              ) : w.shape === "triangle" ? (
                <polygon points={`${cx},${cy - r} ${cx - r},${cy + r} ${cx + r},${cy + r}`} className={pointClass} />
              ) : (
                <circle cx={cx} cy={cy} r={r} className={pointClass} />
              )}
              <text x={cx} y={cy - 14} textAnchor="middle" className={styles.wordLabel}>
                {w.label}
              </text>
            </g>
          );
        })}
      </svg>
      {readout && <div className={styles.readout}>{readout}</div>}
    </div>
  );
}
