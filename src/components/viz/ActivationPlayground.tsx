"use client";

import { useMemo, useRef, useCallback, type ReactNode } from "react";
import { scaleLinear, line as d3line, curveMonotoneX, curveStepAfter } from "d3";
import styles from "./ActivationPlayground.module.css";

export interface ActivationCurve {
  fn: (x: number) => number;
  label: string;
  /** Picks the stroke style — cycles through a fixed 4-color palette. */
  colorIndex: number;
  /** Step functions render as a stair-step path instead of a smooth curve. */
  stepped?: boolean;
}

export interface ActivationPlaygroundProps {
  curves: ActivationCurve[];
  domain: [number, number];
  rangeDomain: [number, number];
  /** The shared x input (controlled). */
  value: number;
  onChange: (x: number) => void;
  width?: number;
  height?: number;
  readout?: ReactNode;
}

const SAMPLES = 120;
const COLOR_CLASSES = [styles.curve0, styles.curve1, styles.curve2, styles.curve3];
const DOT_CLASSES = [styles.dot0, styles.dot1, styles.dot2, styles.dot3];

export function ActivationPlayground({
  curves,
  domain,
  rangeDomain,
  value,
  onChange,
  width = 480,
  height = 280,
  readout,
}: ActivationPlaygroundProps) {
  const margin = { top: 16, right: 20, bottom: 20, left: 28 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const [xMin, xMax] = domain;
  const [yMin, yMax] = rangeDomain;

  const xScale = useMemo(() => scaleLinear().domain([xMin, xMax]).range([0, innerW]), [xMin, xMax, innerW]);
  const yScale = useMemo(() => scaleLinear().domain([yMin, yMax]).range([innerH, 0]), [yMin, yMax, innerH]);

  const paths = useMemo(() => {
    return curves.map((c) => {
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i <= SAMPLES; i++) {
        const x = xMin + ((xMax - xMin) * i) / SAMPLES;
        pts.push({ x, y: c.fn(x) });
      }
      const gen = d3line<{ x: number; y: number }>()
        .x((d) => xScale(d.x))
        .y((d) => yScale(d.y))
        .curve(c.stepped ? curveStepAfter : curveMonotoneX);
      return gen(pts) ?? "";
    });
  }, [curves, xMin, xMax, xScale, yScale]);

  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const updateFromClientX = useCallback(
    (clientX: number) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const scaleFactor = width / rect.width;
      const localX = (clientX - rect.left) * scaleFactor - margin.left;
      const rawX = xScale.invert(localX);
      onChange(Math.min(xMax, Math.max(xMin, rawX)));
    },
    [xScale, xMin, xMax, width, margin.left, onChange],
  );

  const step = (xMax - xMin) / 200;

  return (
    <div className={styles.wrap}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className={styles.svg}
        role="img"
        aria-label="Four activation functions plotted together — drag the vertical line to compare their outputs at one input."
        onPointerDown={(e) => {
          dragging.current = true;
          (e.target as Element).setPointerCapture?.(e.pointerId);
          updateFromClientX(e.clientX);
        }}
        onPointerMove={(e) => {
          if (dragging.current) updateFromClientX(e.clientX);
        }}
        onPointerUp={() => {
          dragging.current = false;
        }}
        onPointerLeave={() => {
          dragging.current = false;
        }}
      >
        <g transform={`translate(${margin.left},${margin.top})`}>
          {yMin <= 0 && yMax >= 0 && <line x1={0} x2={innerW} y1={yScale(0)} y2={yScale(0)} className={styles.axis} />}
          {xMin <= 0 && xMax >= 0 && <line x1={xScale(0)} x2={xScale(0)} y1={0} y2={innerH} className={styles.axis} />}

          {paths.map((d, i) => (
            <path key={i} d={d} className={COLOR_CLASSES[curves[i].colorIndex % COLOR_CLASSES.length]} />
          ))}

          <line x1={xScale(value)} x2={xScale(value)} y1={0} y2={innerH} className={styles.marker} />

          {curves.map((c, i) => (
            <circle
              key={i}
              cx={xScale(value)}
              cy={yScale(c.fn(value))}
              r={5}
              className={DOT_CLASSES[c.colorIndex % DOT_CLASSES.length]}
            />
          ))}

          <circle
            cx={xScale(value)}
            cy={innerH}
            r={8}
            className={styles.handle}
            tabIndex={0}
            role="slider"
            aria-valuemin={xMin}
            aria-valuemax={xMax}
            aria-valuenow={Number(value.toFixed(2))}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") onChange(Math.max(xMin, value - step));
              if (e.key === "ArrowRight") onChange(Math.min(xMax, value + step));
            }}
          />
        </g>
      </svg>
      {readout && <div className={styles.readout}>{readout}</div>}
    </div>
  );
}
