"use client";

import { useMemo, useRef, useCallback, type ReactNode, type PointerEvent } from "react";
import { scaleLinear } from "d3";
import styles from "./AttentionPlayground.module.css";

export interface AttentionToken {
  label: string;
  x: number;
  y: number;
}

export interface AttentionPlaygroundProps {
  tokens: AttentionToken[];
  /** Attention weight for each token, same length and order as `tokens`, summing to 1. */
  weights: number[];
  query: { x: number; y: number };
  onChangeQuery?: (next: { x: number; y: number }) => void;
  domain?: [number, number];
  size?: number;
  readout?: ReactNode;
}

const DEFAULT_DOMAIN: [number, number] = [-3, 3];

export function AttentionPlayground({
  tokens,
  weights,
  query,
  onChangeQuery,
  domain = DEFAULT_DOMAIN,
  size = 320,
  readout,
}: AttentionPlaygroundProps) {
  const margin = 32;
  const [dMin, dMax] = domain;

  const scaleX = useMemo(() => scaleLinear().domain([dMin, dMax]).range([margin, size - margin]), [dMin, dMax, size]);
  const scaleY = useMemo(() => scaleLinear().domain([dMin, dMax]).range([size - margin, margin]), [dMin, dMax, size]);

  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const updateFromClient = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg || !onChangeQuery) return;
      const rect = svg.getBoundingClientRect();
      const scaleFactor = size / rect.width;
      const localX = (clientX - rect.left) * scaleFactor;
      const localY = (clientY - rect.top) * scaleFactor;
      onChangeQuery({
        x: Math.min(dMax, Math.max(dMin, scaleX.invert(localX))),
        y: Math.min(dMax, Math.max(dMin, scaleY.invert(localY))),
      });
    },
    [scaleX, scaleY, size, dMin, dMax, onChangeQuery],
  );

  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    if (!onChangeQuery) return;
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

  const qx = scaleX(query.x);
  const qy = scaleY(query.y);

  return (
    <div className={styles.wrap}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${size} ${size}`}
        className={styles.svg}
        role="img"
        aria-label="An attention query point over a set of fixed token vectors, sized by how much attention weight each one receives."
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <line x1={margin} y1={scaleY(0)} x2={size - margin} y2={scaleY(0)} className={styles.axis} />
        <line x1={scaleX(0)} y1={margin} x2={scaleX(0)} y2={size - margin} className={styles.axis} />

        {tokens.map((t, i) => {
          const cx = scaleX(t.x);
          const cy = scaleY(t.y);
          const w = weights[i] ?? 0;
          const r = 10 + w * 30;
          return (
            <g key={t.label}>
              <circle cx={cx} cy={cy} r={r} className={styles.tokenPoint} fillOpacity={0.2 + w * 0.7} />
              <text x={cx} y={cy - r - 8} textAnchor="middle" className={styles.tokenLabel}>
                {t.label}
              </text>
              <text x={cx} y={cy + 4} textAnchor="middle" className={styles.weightLabel}>
                {w.toFixed(2)}
              </text>
            </g>
          );
        })}

        <g className={onChangeQuery ? styles.draggable : undefined}>
          <line x1={qx - 9} y1={qy - 9} x2={qx + 9} y2={qy + 9} className={styles.queryMark} />
          <line x1={qx - 9} y1={qy + 9} x2={qx + 9} y2={qy - 9} className={styles.queryMark} />
          <text x={qx} y={qy - 16} textAnchor="middle" className={styles.queryLabel}>
            query
          </text>
        </g>
      </svg>
      {readout && <div className={styles.readout}>{readout}</div>}
    </div>
  );
}
