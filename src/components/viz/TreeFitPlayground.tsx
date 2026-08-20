"use client";

import { useMemo, type ReactNode } from "react";
import { scaleLinear } from "d3";
import styles from "./TreeFitPlayground.module.css";

export interface TreeFitPoint {
  x: number;
  label: string;
  /** Relative importance weight (1 = average) — sizes the dot when present, e.g. for boosting's reweighting. */
  weight?: number;
}

export interface TreeFitRegion {
  start: number;
  end: number;
  prediction: string;
}

export interface TreeFitPlaygroundProps {
  /** Points the tree was trained on — plotted on the top row, colored by the (possibly noisy) label they trained on. */
  trainPoints: TreeFitPoint[];
  /** Points the tree never saw — plotted on the bottom row, colored by their true label. Omit when there's no held-out set. */
  validationPoints?: TreeFitPoint[];
  /** The current tree's leaf intervals, left to right, spanning the full domain. */
  regions: TreeFitRegion[];
  domain: [number, number];
  width?: number;
  height?: number;
  readout?: ReactNode;
}

export function TreeFitPlayground({
  trainPoints,
  validationPoints = [],
  regions,
  domain,
  width = 640,
  height = 170,
  readout,
}: TreeFitPlaygroundProps) {
  const margin = 20;
  const [dMin, dMax] = domain;
  const hasValidation = validationPoints.length > 0;
  const labels = useMemo(
    () => [...new Set([...trainPoints, ...validationPoints].map((p) => p.label))],
    [trainPoints, validationPoints],
  );

  const scaleX = useMemo(
    () => scaleLinear().domain([dMin, dMax]).range([margin, width - margin]),
    [dMin, dMax, width],
  );

  const trainRowY = hasValidation ? height / 2 - 28 : height / 2;
  const validationRowY = height / 2 + 28;
  const bandTop = 14;
  const bandBottom = height - 14;

  const classFill = (label: string) => (label === labels[0] ? styles.classA : styles.classB);

  return (
    <div className={styles.wrap}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={styles.svg}
        role="img"
        aria-label={
          hasValidation
            ? "Decision tree fit — background bands show the tree's predicted class, dots show training points (top) and held-out validation points (bottom)."
            : "Decision tree fit — background bands show the ensemble's predicted class, dots show each point's current importance weight as size."
        }
      >
        {regions.map((r, i) => (
          <rect
            key={i}
            x={scaleX(r.start)}
            y={bandTop}
            width={Math.max(0, scaleX(r.end) - scaleX(r.start))}
            height={bandBottom - bandTop}
            className={r.prediction === labels[0] ? styles.bandA : styles.bandB}
          />
        ))}

        {regions.slice(1).map((r, i) => (
          <line
            key={i}
            x1={scaleX(r.start)}
            y1={bandTop}
            x2={scaleX(r.start)}
            y2={bandBottom}
            className={styles.boundary}
          />
        ))}

        {trainPoints.map((p, i) => (
          <circle
            key={i}
            cx={scaleX(p.x)}
            cy={trainRowY}
            r={6 * Math.sqrt(p.weight ?? 1)}
            className={classFill(p.label)}
          />
        ))}

        {validationPoints.map((p, i) => (
          <rect
            key={i}
            x={scaleX(p.x) - 5.5}
            y={validationRowY - 5.5}
            width={11}
            height={11}
            transform={`rotate(45 ${scaleX(p.x)} ${validationRowY})`}
            className={`${classFill(p.label)} ${styles.validationMark}`}
          />
        ))}
      </svg>
      {readout && <div className={styles.readout}>{readout}</div>}
    </div>
  );
}
