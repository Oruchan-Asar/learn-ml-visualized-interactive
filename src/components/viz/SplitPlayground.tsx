"use client";

import { useMemo, useRef, useCallback, type ReactNode, type PointerEvent } from "react";
import { scaleLinear } from "d3";
import styles from "./SplitPlayground.module.css";

export interface SplitPoint {
  x: number;
  label: string;
}

export interface SplitPlaygroundProps {
  /** Fixed dataset — plotted along a single numeric feature, colored by (exactly two) class labels. */
  points: SplitPoint[];
  domain?: [number, number];
  /** Where the split currently sits (controlled). */
  threshold: number;
  onChange: (next: number) => void;
  width?: number;
  height?: number;
  readout?: ReactNode;
  /** Recolors the split line, e.g. once a checkpoint has passed. */
  passed?: boolean;
}

const DEFAULT_DOMAIN: [number, number] = [0, 11];

export function SplitPlayground({
  points,
  domain = DEFAULT_DOMAIN,
  threshold,
  onChange,
  width = 560,
  height = 140,
  readout,
  passed = false,
}: SplitPlaygroundProps) {
  const margin = 30;
  const [dMin, dMax] = domain;
  const labels = useMemo(() => [...new Set(points.map((p) => p.label))], [points]);

  const scaleX = useMemo(
    () => scaleLinear().domain([dMin, dMax]).range([margin, width - margin]),
    [dMin, dMax, width],
  );

  const rowY = (label: string) => (label === labels[0] ? height / 2 - 24 : height / 2 + 24);

  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const updateFromClient = useCallback(
    (clientX: number) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const scaleFactor = width / rect.width;
      const localX = (clientX - rect.left) * scaleFactor;
      onChange(Math.min(dMax, Math.max(dMin, scaleX.invert(localX))));
    },
    [scaleX, width, dMin, dMax, onChange],
  );

  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    dragging.current = true;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    updateFromClient(e.clientX);
  };
  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    if (dragging.current) updateFromClient(e.clientX);
  };
  const onPointerUp = () => {
    dragging.current = false;
  };

  const lineX = scaleX(threshold);
  const step = (dMax - dMin) / 100;

  return (
    <div className={styles.wrap}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className={styles.svg}
        role="img"
        aria-label="Interactive split threshold — drag the vertical line, watch each side's class mix change."
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <line x1={margin} y1={height / 2} x2={width - margin} y2={height / 2} className={styles.axis} />

        {points.map((p, i) => (
          <circle
            key={i}
            cx={scaleX(p.x)}
            cy={rowY(p.label)}
            r={7}
            className={p.label === labels[0] ? styles.pointA : styles.pointB}
          />
        ))}

        <line
          x1={lineX}
          y1={12}
          x2={lineX}
          y2={height - 12}
          className={passed ? styles.splitLinePassed : styles.splitLine}
        />
        <circle
          cx={lineX}
          cy={12}
          r={8}
          className={passed ? styles.handlePassed : styles.handle}
          tabIndex={0}
          role="slider"
          aria-label={`Split threshold: ${threshold.toFixed(1)}`}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") onChange(Math.max(dMin, threshold - step));
            if (e.key === "ArrowRight") onChange(Math.min(dMax, threshold + step));
          }}
        />
      </svg>
      {readout && <div className={styles.readout}>{readout}</div>}
    </div>
  );
}
