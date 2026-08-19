"use client";

import { useMemo, useRef, useCallback, type ReactNode } from "react";
import { scaleLinear } from "d3";
import styles from "./ScatterFitPlayground.module.css";

export interface DataPoint {
  x: number;
  y: number;
}

export interface ScatterFitPlaygroundProps {
  points: DataPoint[];
  /** Line's y-value at xDomain[0] (controlled). */
  yLeft: number;
  /** Line's y-value at xDomain[1] (controlled). */
  yRight: number;
  onChangeLeft: (y: number) => void;
  onChangeRight: (y: number) => void;
  xDomain: [number, number];
  yDomain: [number, number];
  size?: number;
  readout?: ReactNode;
  /** Recolors the line and handles, e.g. once a checkpoint has passed. */
  passed?: boolean;
  /** Draws each point's vertical miss from the line. */
  showResiduals?: boolean;
}

export function ScatterFitPlayground({
  points,
  yLeft,
  yRight,
  onChangeLeft,
  onChangeRight,
  xDomain,
  yDomain,
  size = 320,
  readout,
  passed = false,
  showResiduals = false,
}: ScatterFitPlaygroundProps) {
  const margin = 24;
  const height = Math.round(size * 0.72);
  const [xMin, xMax] = xDomain;
  const [yMin, yMax] = yDomain;

  const scaleX = useMemo(
    () => scaleLinear().domain([xMin, xMax]).range([margin, size - margin]),
    [xMin, xMax, size],
  );
  const scaleY = useMemo(
    () => scaleLinear().domain([yMin, yMax]).range([height - margin, margin]),
    [yMin, yMax, height],
  );

  const svgRef = useRef<SVGSVGElement>(null);
  const draggingHandle = useRef<"left" | "right" | null>(null);

  const updateFromClientY = useCallback(
    (clientY: number) => {
      const handle = draggingHandle.current;
      if (!handle) return;
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const scaleFactor = height / rect.height;
      const localY = (clientY - rect.top) * scaleFactor;
      const value = Math.min(yMax, Math.max(yMin, scaleY.invert(localY)));
      if (handle === "left") onChangeLeft(value);
      else onChangeRight(value);
    },
    [scaleY, height, yMin, yMax, onChangeLeft, onChangeRight],
  );

  const lineClass = passed ? styles.linePassed : styles.line;
  const handleClass = passed ? styles.handlePassed : styles.handle;

  const xLeftPx = scaleX(xMin);
  const xRightPx = scaleX(xMax);
  const yLeftPx = scaleY(yLeft);
  const yRightPx = scaleY(yRight);

  const slope = (yRight - yLeft) / (xMax - xMin);
  const intercept = yLeft - slope * xMin;
  const step = (yMax - yMin) / 100;

  return (
    <div className={styles.wrap}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${size} ${height}`}
        className={styles.svg}
        role="img"
        aria-label="Interactive scatter plot — drag either end of the line to change how it fits the points."
        onPointerMove={(e) => {
          if (draggingHandle.current) updateFromClientY(e.clientY);
        }}
        onPointerUp={() => {
          draggingHandle.current = null;
        }}
        onPointerLeave={() => {
          draggingHandle.current = null;
        }}
      >
        {showResiduals &&
          points.map((p, i) => {
            const px = scaleX(p.x);
            const py = scaleY(p.y);
            const fittedY = scaleY(slope * p.x + intercept);
            return <line key={i} x1={px} y1={py} x2={px} y2={fittedY} className={styles.residual} />;
          })}

        <line x1={xLeftPx} y1={yLeftPx} x2={xRightPx} y2={yRightPx} className={lineClass} />

        {points.map((p, i) => (
          <circle key={i} cx={scaleX(p.x)} cy={scaleY(p.y)} r={5} className={styles.point} />
        ))}

        <circle
          cx={xLeftPx}
          cy={yLeftPx}
          r={8}
          className={handleClass}
          tabIndex={0}
          role="slider"
          aria-label={`Left end of the line: y = ${yLeft.toFixed(1)}`}
          onPointerDown={(e) => {
            draggingHandle.current = "left";
            (e.target as Element).setPointerCapture?.(e.pointerId);
            updateFromClientY(e.clientY);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp") onChangeLeft(Math.min(yMax, yLeft + step));
            if (e.key === "ArrowDown") onChangeLeft(Math.max(yMin, yLeft - step));
          }}
        />
        <circle
          cx={xRightPx}
          cy={yRightPx}
          r={8}
          className={handleClass}
          tabIndex={0}
          role="slider"
          aria-label={`Right end of the line: y = ${yRight.toFixed(1)}`}
          onPointerDown={(e) => {
            draggingHandle.current = "right";
            (e.target as Element).setPointerCapture?.(e.pointerId);
            updateFromClientY(e.clientY);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp") onChangeRight(Math.min(yMax, yRight + step));
            if (e.key === "ArrowDown") onChangeRight(Math.max(yMin, yRight - step));
          }}
        />
      </svg>
      {readout && <div className={styles.readout}>{readout}</div>}
    </div>
  );
}
