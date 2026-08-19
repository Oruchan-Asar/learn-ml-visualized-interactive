"use client";

import { useMemo, useRef, useCallback, type ReactNode, type PointerEvent } from "react";
import { scaleLinear, line as d3line, curveMonotoneX } from "d3";
import styles from "./CurvePlayground.module.css";

export interface CurvePlaygroundProps {
  /** The function being visualized. */
  fn: (x: number) => number;
  /** Its derivative — drives the tangent line and any readout. */
  derivative: (x: number) => number;
  /** Domain of x shown on screen. */
  domain: [number, number];
  /** Current x position of the draggable point (controlled). */
  value: number;
  onChange: (x: number) => void;
  width?: number;
  height?: number;
  showTangent?: boolean;
  /** Optional overlay content, e.g. a live formula readout. */
  readout?: ReactNode;
  /** Highlights the handle a different color, e.g. once a checkpoint has passed. */
  passed?: boolean;
}

const SAMPLES = 120;

export function CurvePlayground({
  fn,
  derivative,
  domain,
  value,
  onChange,
  width = 480,
  height = 260,
  showTangent = true,
  readout,
  passed = false,
}: CurvePlaygroundProps) {
  const margin = { top: 20, right: 24, bottom: 16, left: 24 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const [xMin, xMax] = domain;

  const points = useMemo(() => {
    const pts: [number, number][] = [];
    for (let i = 0; i <= SAMPLES; i++) {
      const x = xMin + ((xMax - xMin) * i) / SAMPLES;
      pts.push([x, fn(x)]);
    }
    return pts;
  }, [fn, xMin, xMax]);

  const [yMin, yMax] = useMemo(() => {
    const ys = points.map((p) => p[1]);
    return [Math.min(...ys), Math.max(...ys)];
  }, [points]);
  const yPad = (yMax - yMin) * 0.15 || 1;

  const xScale = useMemo(
    () => scaleLinear().domain([xMin, xMax]).range([0, innerW]),
    [xMin, xMax, innerW],
  );
  const yScale = useMemo(
    () => scaleLinear().domain([yMin - yPad, yMax + yPad]).range([innerH, 0]),
    [yMin, yMax, yPad, innerH],
  );

  const pathD = useMemo(() => {
    const gen = d3line<[number, number]>()
      .x((d) => xScale(d[0]))
      .y((d) => yScale(d[1]))
      .curve(curveMonotoneX);
    return gen(points) ?? "";
  }, [points, xScale, yScale]);

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

  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    dragging.current = true;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    updateFromClientX(e.clientX);
  };
  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    if (dragging.current) updateFromClientX(e.clientX);
  };
  const onPointerUp = () => {
    dragging.current = false;
  };

  const py = fn(value);
  const slope = derivative(value);
  const span = (xMax - xMin) * 0.16;
  const tx1 = Math.max(xMin, value - span);
  const tx2 = Math.min(xMax, value + span);
  const ty1 = py + slope * (tx1 - value);
  const ty2 = py + slope * (tx2 - value);

  const step = (xMax - xMin) / 200;

  return (
    <div className={styles.wrap}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className={styles.svg}
        role="img"
        aria-label="Interactive curve — drag the point along it, or focus it and use the arrow keys."
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <g transform={`translate(${margin.left},${margin.top})`}>
          {yMin <= 0 && yMax >= 0 && (
            <line x1={0} x2={innerW} y1={yScale(0)} y2={yScale(0)} className={styles.axis} />
          )}
          <path d={pathD} className={styles.curve} />
          {showTangent && (
            <line
              x1={xScale(tx1)}
              y1={yScale(ty1)}
              x2={xScale(tx2)}
              y2={yScale(ty2)}
              className={styles.tangent}
            />
          )}
          <circle
            cx={xScale(value)}
            cy={yScale(py)}
            r={7}
            className={passed ? styles.handlePassed : styles.handle}
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
