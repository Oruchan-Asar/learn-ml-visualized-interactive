"use client";

import type { ReactNode } from "react";
import styles from "./DropoutLayer.module.css";

export interface DropoutLayerProps {
  activations: number[];
  mask: boolean[];
  width?: number;
  height?: number;
  readout?: ReactNode;
}

export function DropoutLayer({ activations, mask, width = 480, height = 160, readout }: DropoutLayerProps) {
  const margin = 40;
  const n = activations.length;
  const xs = activations.map((_, i) => margin + ((width - 2 * margin) * i) / Math.max(1, n - 1));
  const y = height / 2;
  const outX = width - 20;

  return (
    <div className={styles.wrap}>
      <svg viewBox={`0 0 ${width} ${height}`} className={styles.svg} role="img" aria-label="A layer of neurons — dropped ones fade out, survivors feed the output.">
        {xs.map((x, i) => (
          <line key={i} x1={x} y1={y} x2={outX} y2={y} className={mask[i] ? styles.edgeActive : styles.edgeDropped} />
        ))}
        {xs.map((x, i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={18} className={mask[i] ? styles.neuronActive : styles.neuronDropped} />
            <text x={x} y={y + 4} textAnchor="middle" className={styles.value}>
              {activations[i].toFixed(1)}
            </text>
          </g>
        ))}
        <circle cx={outX} cy={y} r={14} className={styles.outputNode} />
      </svg>
      {readout && <div className={styles.readout}>{readout}</div>}
    </div>
  );
}
