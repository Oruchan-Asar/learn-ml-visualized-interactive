"use client";

import { useMemo, useRef, useCallback, type ReactNode } from "react";
import { scaleLinear } from "d3";
import styles from "./ClusterPlayground.module.css";

export interface ClusterPoint {
  x: number;
  y: number;
}

export interface ClusterPlaygroundProps {
  /** Fixed data points, unlabeled — colored live by whichever centroid they're currently assigned to. */
  points: ClusterPoint[];
  centroids: ClusterPoint[];
  /** Same length as points; each value is an index into centroids. */
  assignments: number[];
  onChangeCentroid?: (index: number, next: { x: number; y: number }) => void;
  domain?: [number, number];
  size?: number;
  readout?: ReactNode;
}

const DEFAULT_DOMAIN: [number, number] = [0, 10];
const CLUSTER_CLASSES = ["cluster0", "cluster1"] as const;

export function ClusterPlayground({
  points,
  centroids,
  assignments,
  onChangeCentroid,
  domain = DEFAULT_DOMAIN,
  size = 320,
  readout,
}: ClusterPlaygroundProps) {
  const margin = 20;
  const [dMin, dMax] = domain;

  const scaleX = useMemo(
    () => scaleLinear().domain([dMin, dMax]).range([margin, size - margin]),
    [dMin, dMax, size],
  );
  const scaleY = useMemo(
    () => scaleLinear().domain([dMin, dMax]).range([size - margin, margin]),
    [dMin, dMax, size],
  );

  const svgRef = useRef<SVGSVGElement>(null);
  const draggingIndex = useRef<number | null>(null);

  const updateFromClient = useCallback(
    (clientX: number, clientY: number) => {
      const idx = draggingIndex.current;
      if (idx === null || !onChangeCentroid) return;
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const scaleFactor = size / rect.width;
      const localX = (clientX - rect.left) * scaleFactor;
      const localY = (clientY - rect.top) * scaleFactor;
      onChangeCentroid(idx, {
        x: Math.min(dMax, Math.max(dMin, scaleX.invert(localX))),
        y: Math.min(dMax, Math.max(dMin, scaleY.invert(localY))),
      });
    },
    [scaleX, scaleY, size, dMin, dMax, onChangeCentroid],
  );

  const step = (dMax - dMin) / 100;

  return (
    <div className={styles.wrap}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${size} ${size}`}
        className={styles.svg}
        role="img"
        aria-label="Interactive cluster plane — drag a centroid marker, watch nearby points change color."
        onPointerMove={(e) => {
          if (draggingIndex.current !== null) updateFromClient(e.clientX, e.clientY);
        }}
        onPointerUp={() => {
          draggingIndex.current = null;
        }}
        onPointerLeave={() => {
          draggingIndex.current = null;
        }}
      >
        {points.map((p, i) => (
          <circle
            key={i}
            cx={scaleX(p.x)}
            cy={scaleY(p.y)}
            r={6}
            className={styles[CLUSTER_CLASSES[assignments[i] % CLUSTER_CLASSES.length]]}
          />
        ))}

        {centroids.map((c, i) => {
          const cx = scaleX(c.x);
          const cy = scaleY(c.y);
          const s = 9;
          return (
            <g key={i}>
              <rect
                x={cx - s}
                y={cy - s}
                width={s * 2}
                height={s * 2}
                transform={`rotate(45 ${cx} ${cy})`}
                className={styles[`${CLUSTER_CLASSES[i % CLUSTER_CLASSES.length]}Centroid`]}
                tabIndex={onChangeCentroid ? 0 : undefined}
                role={onChangeCentroid ? "slider" : undefined}
                aria-label={onChangeCentroid ? `Centroid ${i + 1}: (${c.x.toFixed(1)}, ${c.y.toFixed(1)})` : undefined}
                onPointerDown={
                  onChangeCentroid
                    ? (e) => {
                        draggingIndex.current = i;
                        (e.target as Element).setPointerCapture?.(e.pointerId);
                        updateFromClient(e.clientX, e.clientY);
                      }
                    : undefined
                }
                onKeyDown={
                  onChangeCentroid
                    ? (e) => {
                        if (e.key === "ArrowLeft") onChangeCentroid(i, { x: c.x - step, y: c.y });
                        if (e.key === "ArrowRight") onChangeCentroid(i, { x: c.x + step, y: c.y });
                        if (e.key === "ArrowUp") onChangeCentroid(i, { x: c.x, y: c.y + step });
                        if (e.key === "ArrowDown") onChangeCentroid(i, { x: c.x, y: c.y - step });
                      }
                    : undefined
                }
              />
            </g>
          );
        })}
      </svg>
      {readout && <div className={styles.readout}>{readout}</div>}
    </div>
  );
}
