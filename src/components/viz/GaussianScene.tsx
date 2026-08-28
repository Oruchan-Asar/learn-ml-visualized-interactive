"use client";

import { useMemo, useRef, useCallback, type ReactNode } from "react";
import { scaleLinear } from "d3";
import styles from "./GaussianScene.module.css";

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface GaussianSpec {
  mu: { x: number; y: number };
  sigma: { x: number; y: number };
  opacity: number;
  color: RGB;
  draggable?: boolean;
  label?: string;
}

export interface GaussianSceneProps {
  /** Painter's order: index 0 is drawn first (bottom), later items drawn on top. Pass farthest-to-nearest
   * so the visual stacking matches the depth-sorted compositing math (nearest ends up "on top"). */
  gaussians: GaussianSpec[];
  onChangeMu?: (index: number, next: { x: number; y: number }) => void;
  queryPoint?: { x: number; y: number };
  onChangeQueryPoint?: (next: { x: number; y: number }) => void;
  /** The composited color at the query point, painted into its marker. */
  queryColor?: RGB;
  domain?: [number, number];
  size?: number;
  readout?: ReactNode;
}

function toCss(c: RGB, alpha = 1): string {
  return `rgba(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, ${alpha})`;
}

const DEFAULT_DOMAIN: [number, number] = [-6, 6];

/** A top-down scene of overlapping Gaussian "blobs" (1-sigma and 2-sigma contours), each optionally
 * draggable by its center, plus an optional query-pixel marker. Used across the 3D Gaussian Splatting
 * chapters as a 2D cross-section stand-in for what would otherwise need a full 3D renderer. */
export function GaussianScene({
  gaussians,
  onChangeMu,
  queryPoint,
  onChangeQueryPoint,
  queryColor,
  domain = DEFAULT_DOMAIN,
  size = 300,
  readout,
}: GaussianSceneProps) {
  const margin = 24;
  const [dMin, dMax] = domain;

  const scaleX = useMemo(() => scaleLinear().domain([dMin, dMax]).range([margin, size - margin]), [dMin, dMax, size]);
  const scaleY = useMemo(() => scaleLinear().domain([dMin, dMax]).range([size - margin, margin]), [dMin, dMax, size]);
  const unitScale = (size - 2 * margin) / (dMax - dMin);

  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef<{ kind: "gaussian"; index: number } | { kind: "query" } | null>(null);

  const updateFromClient = useCallback(
    (clientX: number, clientY: number) => {
      const d = dragging.current;
      if (!d) return;
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const scaleFactor = size / rect.width;
      const localX = (clientX - rect.left) * scaleFactor;
      const localY = (clientY - rect.top) * scaleFactor;
      const next = {
        x: Math.min(dMax, Math.max(dMin, scaleX.invert(localX))),
        y: Math.min(dMax, Math.max(dMin, scaleY.invert(localY))),
      };
      if (d.kind === "gaussian" && onChangeMu) onChangeMu(d.index, next);
      if (d.kind === "query" && onChangeQueryPoint) onChangeQueryPoint(next);
    },
    [scaleX, scaleY, size, dMin, dMax, onChangeMu, onChangeQueryPoint],
  );

  return (
    <div className={styles.wrap}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${size} ${size}`}
        className={styles.svg}
        role="img"
        aria-label="A 2D scene of overlapping Gaussian ellipses, with a query pixel marker."
        onPointerMove={(e) => {
          if (dragging.current) updateFromClient(e.clientX, e.clientY);
        }}
        onPointerUp={() => {
          dragging.current = null;
        }}
        onPointerLeave={() => {
          dragging.current = null;
        }}
      >
        {gaussians.map((g, i) => {
          const cx = scaleX(g.mu.x);
          const cy = scaleY(g.mu.y);
          const rx1 = Math.max(1, g.sigma.x * unitScale);
          const ry1 = Math.max(1, g.sigma.y * unitScale);
          return (
            <g key={i}>
              <ellipse cx={cx} cy={cy} rx={rx1 * 2} ry={ry1 * 2} style={{ fill: toCss(g.color, g.opacity * 0.12) }} />
              <ellipse
                cx={cx}
                cy={cy}
                rx={rx1}
                ry={ry1}
                style={{ fill: toCss(g.color, g.opacity * 0.45), stroke: toCss(g.color, 0.9), strokeWidth: 1.5 }}
              />
              {g.draggable && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={7}
                  style={{ fill: toCss(g.color, 1) }}
                  className={styles.handle}
                  tabIndex={0}
                  role="slider"
                  aria-label={`${g.label ?? `Gaussian ${i + 1}`} center: (${g.mu.x.toFixed(1)}, ${g.mu.y.toFixed(1)})`}
                  onPointerDown={(e) => {
                    dragging.current = { kind: "gaussian", index: i };
                    (e.target as Element).setPointerCapture?.(e.pointerId);
                    updateFromClient(e.clientX, e.clientY);
                  }}
                />
              )}
              {g.label && (
                <text x={cx} y={cy - ry1 - 8} textAnchor="middle" className={styles.gaussianLabel}>
                  {g.label}
                </text>
              )}
            </g>
          );
        })}

        {queryPoint && (
          <g>
            <line
              x1={scaleX(queryPoint.x) - 8}
              y1={scaleY(queryPoint.y)}
              x2={scaleX(queryPoint.x) + 8}
              y2={scaleY(queryPoint.y)}
              className={styles.crosshair}
            />
            <line
              x1={scaleX(queryPoint.x)}
              y1={scaleY(queryPoint.y) - 8}
              x2={scaleX(queryPoint.x)}
              y2={scaleY(queryPoint.y) + 8}
              className={styles.crosshair}
            />
            <circle
              cx={scaleX(queryPoint.x)}
              cy={scaleY(queryPoint.y)}
              r={onChangeQueryPoint ? 9 : 5}
              className={styles.queryMarker}
              style={queryColor ? { fill: toCss(queryColor, 1) } : undefined}
              tabIndex={onChangeQueryPoint ? 0 : undefined}
              role={onChangeQueryPoint ? "slider" : undefined}
              aria-label={onChangeQueryPoint ? `Query pixel: (${queryPoint.x.toFixed(1)}, ${queryPoint.y.toFixed(1)})` : undefined}
              onPointerDown={
                onChangeQueryPoint
                  ? (e) => {
                      dragging.current = { kind: "query" };
                      (e.target as Element).setPointerCapture?.(e.pointerId);
                      updateFromClient(e.clientX, e.clientY);
                    }
                  : undefined
              }
            />
          </g>
        )}
      </svg>
      {readout && <div className={styles.readout}>{readout}</div>}
    </div>
  );
}
