"use client";

import { useMemo, type ReactNode } from "react";
import { scaleLinear } from "d3";
import styles from "./WordEmbeddingSpace.module.css";

export interface EmbeddingPoint {
  label: string;
  x: number;
  y: number;
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
        aria-label="A 2D word embedding space — each point is a word, positioned so distance reflects meaning."
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
          return (
            <g
              key={w.label}
              onClick={onSelectWord ? () => onSelectWord(w.label) : undefined}
              className={onSelectWord ? styles.clickable : undefined}
            >
              <circle
                cx={cx}
                cy={cy}
                r={isQuery || isNearest ? 9 : 6}
                className={isQuery ? styles.pointQuery : isNearest ? styles.pointNearest : styles.point}
              />
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
