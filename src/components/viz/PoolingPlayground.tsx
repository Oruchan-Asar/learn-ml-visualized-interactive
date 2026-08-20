"use client";

import type { ReactNode } from "react";
import styles from "./PoolingPlayground.module.css";

export interface PoolingPlaygroundProps {
  featureMap: number[][];
  poolSize: number;
  stride: number;
  pooled: number[][];
  /** Position in the OUTPUT grid (not input pixels) of the currently highlighted window. */
  outputRow: number;
  outputCol: number;
  maxValue: number;
  width?: number;
  readout?: ReactNode;
}

export function PoolingPlayground({
  featureMap,
  poolSize,
  stride,
  pooled,
  outputRow,
  outputCol,
  maxValue,
  width = 460,
  readout,
}: PoolingPlaygroundProps) {
  const inputSize = featureMap.length;
  const cell = 34;
  const gap = 24;
  const inputPixels = inputSize * cell;
  const outputCell = 34;
  const outputSize = pooled.length;
  const outputPixels = outputSize * outputCell;
  const height = Math.max(inputPixels, outputPixels) + 16;
  const outputX = inputPixels + gap;

  return (
    <div className={styles.wrap}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={styles.svg}
        role="img"
        aria-label="A feature map on the left, the pooling window highlighted, and the pooled output on the right."
      >
        {featureMap.map((row, r) =>
          row.map((v, c) => {
            const normalized = maxValue !== 0 ? Math.abs(v) / Math.abs(maxValue) : 0;
            return (
              <g key={`in-${r}-${c}`}>
                <rect
                  x={c * cell}
                  y={r * cell}
                  width={cell - 1}
                  height={cell - 1}
                  className={styles.inputCell}
                  fillOpacity={0.1 + normalized * 0.75}
                />
                <text x={c * cell + cell / 2} y={r * cell + cell / 2 + 4} textAnchor="middle" className={styles.cellText}>
                  {v}
                </text>
              </g>
            );
          }),
        )}
        <rect
          x={outputCol * stride * cell}
          y={outputRow * stride * cell}
          width={poolSize * cell - 1}
          height={poolSize * cell - 1}
          className={styles.windowOutline}
        />

        {pooled.map((row, r) =>
          row.map((v, c) => {
            const isCurrent = r === outputRow && c === outputCol;
            const normalized = maxValue !== 0 ? Math.abs(v) / Math.abs(maxValue) : 0;
            return (
              <g key={`out-${r}-${c}`}>
                <rect
                  x={outputX + c * outputCell}
                  y={r * outputCell}
                  width={outputCell - 1}
                  height={outputCell - 1}
                  className={isCurrent ? styles.outputCellActive : styles.outputCell}
                  fillOpacity={0.15 + normalized * 0.7}
                />
                <text
                  x={outputX + c * outputCell + outputCell / 2}
                  y={r * outputCell + outputCell / 2 + 4}
                  textAnchor="middle"
                  className={styles.cellText}
                >
                  {v}
                </text>
              </g>
            );
          }),
        )}
      </svg>
      {readout && <div className={styles.readout}>{readout}</div>}
    </div>
  );
}
