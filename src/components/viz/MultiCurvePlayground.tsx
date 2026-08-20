"use client";

import { useMemo, type ReactNode } from "react";
import { scaleLinear, line as d3line, curveMonotoneX } from "d3";
import styles from "./MultiCurvePlayground.module.css";

export interface CurvePoint {
  x: number;
  y: number;
}

export interface CurveLine {
  points: CurvePoint[];
  /** "true" is the dashed reference curve; "fit" is a faint background fit; "fitHighlight" is bold/emphasized. */
  variant: "true" | "fit" | "fitHighlight";
}

export interface MultiCurvePlaygroundProps {
  curves: CurveLine[];
  domain: [number, number];
  rangeDomain: [number, number];
  /** Optional scatter dots, e.g. one highlighted dataset's noisy training points. */
  scatterPoints?: CurvePoint[];
  width?: number;
  height?: number;
  readout?: ReactNode;
}

export function MultiCurvePlayground({
  curves,
  domain,
  rangeDomain,
  scatterPoints,
  width = 480,
  height = 280,
  readout,
}: MultiCurvePlaygroundProps) {
  const margin = { top: 16, right: 20, bottom: 16, left: 24 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  const [xMin, xMax] = domain;
  const [yMin, yMax] = rangeDomain;

  const xScale = useMemo(() => scaleLinear().domain([xMin, xMax]).range([0, innerW]), [xMin, xMax, innerW]);
  const yScale = useMemo(() => scaleLinear().domain([yMin, yMax]).range([innerH, 0]), [yMin, yMax, innerH]);

  const lineGen = useMemo(
    () =>
      d3line<CurvePoint>()
        .x((d) => xScale(d.x))
        .y((d) => yScale(d.y))
        .curve(curveMonotoneX),
    [xScale, yScale],
  );

  const classFor = (variant: CurveLine["variant"]) =>
    variant === "true" ? styles.curveTrue : variant === "fitHighlight" ? styles.curveHighlight : styles.curveFit;

  return (
    <div className={styles.wrap}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={styles.svg}
        role="img"
        aria-label="Multiple fitted curves overlaid on the true function — a wider spread of fits means higher variance."
      >
        <g transform={`translate(${margin.left},${margin.top})`}>
          {curves.map((c, i) => (
            <path key={i} d={lineGen(c.points) ?? ""} className={classFor(c.variant)} />
          ))}
          {scatterPoints?.map((p, i) => (
            <circle key={i} cx={xScale(p.x)} cy={yScale(p.y)} r={4} className={styles.scatterPoint} />
          ))}
        </g>
      </svg>
      {readout && <div className={styles.readout}>{readout}</div>}
    </div>
  );
}
