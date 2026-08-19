"use client";

import { useId, useMemo, useRef, useCallback, type ReactNode, type PointerEvent } from "react";
import { scaleLinear } from "d3";
import styles from "./ContourPlayground.module.css";

export interface ContourPlaygroundProps {
  /** The scalar field being visualized. */
  fn: (x: number, y: number) => number;
  /** Its gradient — drives the direction arrow at the probe point. */
  gradient: (x: number, y: number) => { x: number; y: number };
  /** Symmetric domain applied to both axes. */
  domain?: [number, number];
  /** Current probe point (controlled). */
  value: { x: number; y: number };
  onChange: (next: { x: number; y: number }) => void;
  size?: number;
  readout?: ReactNode;
  /** Recolors the point and arrow, e.g. once a checkpoint has passed. */
  passed?: boolean;
  /** Past probe points (e.g. gradient-descent steps), rendered as a fading trail. */
  trail?: { x: number; y: number }[];
}

const DEFAULT_DOMAIN: [number, number] = [-6, 6];
const GRID = 24;
const ARROW_LENGTH = 46;

export function ContourPlayground({
  fn,
  gradient,
  domain = DEFAULT_DOMAIN,
  value,
  onChange,
  size = 320,
  readout,
  passed = false,
  trail,
}: ContourPlaygroundProps) {
  const margin = 16;
  const [dMin, dMax] = domain;
  const uid = useId().replace(/[^a-zA-Z0-9-]/g, "");
  const arrowId = `contour-arrow-${uid}`;
  const arrowPassedId = `contour-arrow-passed-${uid}`;

  const scaleX = useMemo(
    () => scaleLinear().domain([dMin, dMax]).range([margin, size - margin]),
    [dMin, dMax, size],
  );
  const scaleY = useMemo(
    () => scaleLinear().domain([dMin, dMax]).range([size - margin, margin]),
    [dMin, dMax, size],
  );
  const cellSize = (size - margin * 2) / GRID;

  const cells = useMemo(() => {
    const samples: { x: number; y: number; v: number }[] = [];
    let maxValue = 0;
    for (let i = 0; i < GRID; i++) {
      for (let j = 0; j < GRID; j++) {
        const x = dMin + ((i + 0.5) / GRID) * (dMax - dMin);
        const y = dMin + ((j + 0.5) / GRID) * (dMax - dMin);
        const v = fn(x, y);
        samples.push({ x, y, v });
        if (v > maxValue) maxValue = v;
      }
    }
    return samples.map((s) => {
      const normalized = maxValue > 0 ? s.v / maxValue : 0;
      const opacity = Math.max(0, 1 - normalized) ** 1.6 * 0.55;
      return { x: s.x, y: s.y, opacity };
    });
  }, [fn, dMin, dMax]);

  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const updateFromClient = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const scaleFactor = size / rect.width;
      const localX = (clientX - rect.left) * scaleFactor;
      const localY = (clientY - rect.top) * scaleFactor;
      onChange({
        x: Math.min(dMax, Math.max(dMin, scaleX.invert(localX))),
        y: Math.min(dMax, Math.max(dMin, scaleY.invert(localY))),
      });
    },
    [scaleX, scaleY, size, dMin, dMax, onChange],
  );

  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    dragging.current = true;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    updateFromClient(e.clientX, e.clientY);
  };
  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    if (dragging.current) updateFromClient(e.clientX, e.clientY);
  };
  const onPointerUp = () => {
    dragging.current = false;
  };

  const px = scaleX(value.x);
  const py = scaleY(value.y);
  const grad = gradient(value.x, value.y);
  const gradMag = Math.hypot(grad.x, grad.y);
  const hasArrow = gradMag > 1e-6;
  const dirX = hasArrow ? grad.x / gradMag : 0;
  const dirY = hasArrow ? grad.y / gradMag : 0;
  // Screen space flips the y-axis, so a +y data direction points "up" (-y in pixels).
  const tipX = px + dirX * ARROW_LENGTH;
  const tipY = py - dirY * ARROW_LENGTH;

  const step = (dMax - dMin) / 100;

  return (
    <div className={styles.wrap}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${size} ${size}`}
        className={styles.svg}
        role="img"
        aria-label="Interactive scalar field — drag the point, watch the gradient arrow respond."
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <defs>
          <marker
            id={arrowId}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <polygon points="0,0 10,5 0,10" className={styles.arrowHead} />
          </marker>
          <marker
            id={arrowPassedId}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <polygon points="0,0 10,5 0,10" className={styles.arrowHeadPassed} />
          </marker>
        </defs>

        {cells.map((c, i) => (
          <rect
            key={i}
            x={scaleX(c.x) - cellSize / 2}
            y={scaleY(c.y) - cellSize / 2}
            width={cellSize + 0.5}
            height={cellSize + 0.5}
            className={styles.cell}
            fillOpacity={c.opacity}
          />
        ))}

        {trail?.map((p, i) => (
          <circle
            key={i}
            cx={scaleX(p.x)}
            cy={scaleY(p.y)}
            r={4}
            className={styles.trailDot}
            opacity={0.25 + (0.55 * i) / Math.max(1, trail.length - 1)}
          />
        ))}

        {hasArrow && (
          <line
            x1={px}
            y1={py}
            x2={tipX}
            y2={tipY}
            className={passed ? styles.arrowLinePassed : styles.arrowLine}
            markerEnd={`url(#${passed ? arrowPassedId : arrowId})`}
          />
        )}

        <circle
          cx={px}
          cy={py}
          r={8}
          className={passed ? styles.handlePassed : styles.handle}
          tabIndex={0}
          role="slider"
          aria-label={`Point: (${value.x.toFixed(1)}, ${value.y.toFixed(1)})`}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") onChange({ x: value.x - step, y: value.y });
            if (e.key === "ArrowRight") onChange({ x: value.x + step, y: value.y });
            if (e.key === "ArrowUp") onChange({ x: value.x, y: value.y + step });
            if (e.key === "ArrowDown") onChange({ x: value.x, y: value.y - step });
          }}
        />
      </svg>
      {readout && <div className={styles.readout}>{readout}</div>}
    </div>
  );
}
