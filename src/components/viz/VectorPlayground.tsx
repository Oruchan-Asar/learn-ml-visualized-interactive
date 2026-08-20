"use client";

import { useId, useMemo, useRef, useCallback, type ReactNode } from "react";
import { scaleLinear } from "d3";
import styles from "./VectorPlayground.module.css";

export interface VectorSpec {
  x: number;
  y: number;
  draggable?: boolean;
}

export interface VectorPlaygroundProps {
  /** Vectors are drawn from the origin. When there's more than one, index 0 is styled "primary" (neutral, fixed reference) and the rest "secondary" (colorable). A single vector is always "secondary". */
  vectors: VectorSpec[];
  onChangeVector?: (index: number, next: { x: number; y: number }) => void;
  /** Symmetric domain applied to both axes, so angles render undistorted. */
  domain?: [number, number];
  size?: number;
  readout?: ReactNode;
  /** Recolors the secondary vector, e.g. once a checkpoint has passed. */
  passed?: boolean;
  /** A fixed background scatter, e.g. the data cloud a direction vector is being fit to. */
  cloudPoints?: { x: number; y: number }[];
  /** Small markers along a vector's line, e.g. each cloud point's scalar projection onto it. */
  projectedPoints?: { x: number; y: number }[];
}

const DEFAULT_DOMAIN: [number, number] = [-6, 6];

export function VectorPlayground({
  vectors,
  onChangeVector,
  domain = DEFAULT_DOMAIN,
  size = 320,
  readout,
  passed = false,
  cloudPoints,
  projectedPoints,
}: VectorPlaygroundProps) {
  const margin = 24;
  const [dMin, dMax] = domain;
  const uid = useId().replace(/[^a-zA-Z0-9-]/g, "");
  const primaryArrowId = `vec-arrow-primary-${uid}`;
  const secondaryArrowId = `vec-arrow-secondary-${uid}`;
  const secondaryArrowPassedId = `vec-arrow-secondary-passed-${uid}`;

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
      if (idx === null || !onChangeVector) return;
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const scaleFactor = size / rect.width;
      const localX = (clientX - rect.left) * scaleFactor;
      const localY = (clientY - rect.top) * scaleFactor;
      onChangeVector(idx, {
        x: Math.min(dMax, Math.max(dMin, scaleX.invert(localX))),
        y: Math.min(dMax, Math.max(dMin, scaleY.invert(localY))),
      });
    },
    [scaleX, scaleY, size, dMin, dMax, onChangeVector],
  );

  const originX = scaleX(0);
  const originY = scaleY(0);
  const step = (dMax - dMin) / 100;

  return (
    <div className={styles.wrap}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${size} ${size}`}
        className={styles.svg}
        role="img"
        aria-label="Interactive vector plane — drag an arrow's tip to change it."
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
        <defs>
          <marker
            id={primaryArrowId}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <polygon points="0,0 10,5 0,10" className={styles.arrowPrimary} />
          </marker>
          <marker
            id={secondaryArrowId}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <polygon points="0,0 10,5 0,10" className={styles.arrowSecondary} />
          </marker>
          <marker
            id={secondaryArrowPassedId}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <polygon points="0,0 10,5 0,10" className={styles.arrowSecondaryPassed} />
          </marker>
        </defs>

        <line x1={margin} y1={originY} x2={size - margin} y2={originY} className={styles.axis} />
        <line x1={originX} y1={margin} x2={originX} y2={size - margin} className={styles.axis} />

        {cloudPoints?.map((p, i) => (
          <circle key={i} cx={scaleX(p.x)} cy={scaleY(p.y)} r={5} className={styles.cloudPoint} />
        ))}

        {projectedPoints?.map((p, i) => (
          <circle key={i} cx={scaleX(p.x)} cy={scaleY(p.y)} r={4} className={styles.projectedPoint} />
        ))}

        {vectors.map((v, i) => {
          const isPrimary = i === 0 && vectors.length > 1;
          const isPassedSecondary = !isPrimary && passed;
          const x2 = scaleX(v.x);
          const y2 = scaleY(v.y);
          const lineClass = isPrimary
            ? styles.vecPrimary
            : isPassedSecondary
              ? styles.vecSecondaryPassed
              : styles.vecSecondary;
          const markerId = isPrimary
            ? primaryArrowId
            : isPassedSecondary
              ? secondaryArrowPassedId
              : secondaryArrowId;
          const handleClass = isPrimary
            ? styles.handlePrimary
            : isPassedSecondary
              ? styles.handleSecondaryPassed
              : styles.handleSecondary;
          return (
            <g key={i}>
              <line
                x1={originX}
                y1={originY}
                x2={x2}
                y2={y2}
                className={lineClass}
                markerEnd={`url(#${markerId})`}
              />
              {v.draggable && (
                <circle
                  cx={x2}
                  cy={y2}
                  r={8}
                  className={handleClass}
                  tabIndex={0}
                  role="slider"
                  aria-label={`Vector${vectors.length > 1 ? (isPrimary ? " A" : " B") : ""}: (${v.x.toFixed(1)}, ${v.y.toFixed(1)})`}
                  onPointerDown={(e) => {
                    draggingIndex.current = i;
                    (e.target as Element).setPointerCapture?.(e.pointerId);
                    updateFromClient(e.clientX, e.clientY);
                  }}
                  onKeyDown={(e) => {
                    if (!onChangeVector) return;
                    if (e.key === "ArrowLeft") onChangeVector(i, { x: v.x - step, y: v.y });
                    if (e.key === "ArrowRight") onChangeVector(i, { x: v.x + step, y: v.y });
                    if (e.key === "ArrowUp") onChangeVector(i, { x: v.x, y: v.y + step });
                    if (e.key === "ArrowDown") onChangeVector(i, { x: v.x, y: v.y - step });
                  }}
                />
              )}
            </g>
          );
        })}
      </svg>
      {readout && <div className={styles.readout}>{readout}</div>}
    </div>
  );
}
