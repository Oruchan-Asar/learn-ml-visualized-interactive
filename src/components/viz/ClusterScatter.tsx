"use client";

import { useMemo, type ReactNode } from "react";
import { scaleLinear } from "d3";
import styles from "./ClusterScatter.module.css";

export interface ClusterPoint {
  x: number;
  y: number;
  /** A cluster id (colored by a small fixed palette, cycling if there are more clusters than colors),
   * or "noise" for a point that belongs to no cluster (rendered as a dashed hollow ring instead). */
  group: number | "noise";
}

export interface ClusterScatterProps {
  points: ClusterPoint[];
  domain?: [number, number];
  size?: number;
  readout?: ReactNode;
}

const DEFAULT_DOMAIN: [number, number] = [-1, 11];
const GROUP_CLASSES = [styles.point0, styles.point1, styles.point2];

/** A scatter of points colored by cluster id, with noise points drawn as dashed hollow rings instead
 * of a solid fill — used for clustering methods (like DBSCAN) that can leave points unassigned. */
export function ClusterScatter({ points, domain = DEFAULT_DOMAIN, size = 320, readout }: ClusterScatterProps) {
  const margin = 20;
  const [dMin, dMax] = domain;

  const scaleX = useMemo(() => scaleLinear().domain([dMin, dMax]).range([margin, size - margin]), [dMin, dMax, size]);
  const scaleY = useMemo(() => scaleLinear().domain([dMin, dMax]).range([size - margin, margin]), [dMin, dMax, size]);

  return (
    <div className={styles.wrap}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className={styles.svg}
        role="img"
        aria-label="A scatter of points colored by cluster, with unassigned points drawn as dashed hollow rings."
      >
        {points.map((p, i) => (
          <circle
            key={i}
            cx={scaleX(p.x)}
            cy={scaleY(p.y)}
            r={7}
            className={p.group === "noise" ? styles.noisePoint : GROUP_CLASSES[p.group % GROUP_CLASSES.length]}
          />
        ))}
      </svg>
      {readout && <div className={styles.readout}>{readout}</div>}
    </div>
  );
}
