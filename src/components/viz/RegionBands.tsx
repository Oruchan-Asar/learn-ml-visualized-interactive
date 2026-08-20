"use client";

import { useMemo, type ReactNode } from "react";
import { scaleLinear } from "d3";
import styles from "./RegionBands.module.css";

export interface RegionBandsPoint {
  x: number;
  label: string;
}

export interface RegionBandsProps {
  /** Fixed dataset, colored by its true (exactly two) class labels. */
  points: RegionBandsPoint[];
  /** Sorted ascending; splits the domain into thresholds.length + 1 regions. */
  thresholds: number[];
  /** Predicted label for each region, left to right — length must be thresholds.length + 1. */
  regionLabels: string[];
  domain?: [number, number];
  width?: number;
  height?: number;
  readout?: ReactNode;
}

const DEFAULT_DOMAIN: [number, number] = [0, 11];

/** Which region index x falls into, given sorted thresholds. */
function regionIndexOf(thresholds: number[], x: number): number {
  let i = 0;
  while (i < thresholds.length && x >= thresholds[i]) i++;
  return i;
}

/** A fixed dataset over shaded background regions — no dragging, just a snapshot of one model's decision regions vs. the true labels. */
export function RegionBands({
  points,
  thresholds,
  regionLabels,
  domain = DEFAULT_DOMAIN,
  width = 560,
  height = 140,
  readout,
}: RegionBandsProps) {
  const margin = 30;
  const [dMin, dMax] = domain;
  const labels = useMemo(() => [...new Set(points.map((p) => p.label))], [points]);

  const scaleX = useMemo(
    () => scaleLinear().domain([dMin, dMax]).range([margin, width - margin]),
    [dMin, dMax, width],
  );

  const bandClass = (label: string) => (label === labels[0] ? styles.regionA : styles.regionB);
  const pointClass = (label: string) => (label === labels[0] ? styles.pointA : styles.pointB);

  const boundaries = [dMin, ...thresholds, dMax];

  return (
    <div className={styles.wrap}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={styles.svg}
        role="img"
        aria-label="A fixed dataset over one model's shaded decision regions — points ringed with a dashed outline are misclassified."
      >
        {regionLabels.map((label, i) => (
          <rect
            key={i}
            x={scaleX(boundaries[i])}
            y={20}
            width={scaleX(boundaries[i + 1]) - scaleX(boundaries[i])}
            height={height - 40}
            className={bandClass(label)}
            fillOpacity={0.14}
          />
        ))}

        {thresholds.map((t, i) => (
          <line key={i} x1={scaleX(t)} y1={12} x2={scaleX(t)} y2={height - 12} className={styles.thresholdLine} />
        ))}

        <line x1={margin} y1={height / 2} x2={width - margin} y2={height / 2} className={styles.axis} />

        {points.map((p, i) => {
          const predicted = regionLabels[regionIndexOf(thresholds, p.x)];
          const wrong = predicted !== p.label;
          return (
            <circle
              key={i}
              cx={scaleX(p.x)}
              cy={height / 2}
              r={7}
              className={`${pointClass(p.label)} ${wrong ? styles.pointWrong : ""}`}
            />
          );
        })}
      </svg>
      {readout && <div className={styles.readout}>{readout}</div>}
    </div>
  );
}
