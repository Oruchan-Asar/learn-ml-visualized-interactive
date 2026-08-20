"use client";

import type { ReactNode } from "react";
import styles from "./RNNTrace.module.css";

export interface RNNTraceStep {
  t: number;
  token: number[] | null;
  h: number;
}

export interface RNNTraceRow {
  label: string;
  trace: RNNTraceStep[];
  tokenLabels: string[];
}

export interface RNNTraceProps {
  rows: RNNTraceRow[];
  width?: number;
  readout?: ReactNode;
}

/** One or more unrolled RNN traces: a chain of cells passing a hidden state forward through time. */
export function RNNTrace({ rows, width = 480, readout }: RNNTraceProps) {
  const steps = rows[0]?.trace.length ?? 0;
  const cellW = 96;
  const cellH = 64;
  const rowGap = 28;
  const height = rows.length * (cellH + rowGap);
  const maxAbsH = Math.max(1e-6, ...rows.flatMap((r) => r.trace.map((s) => Math.abs(s.h))));

  return (
    <div className={styles.wrap}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={styles.svg}
        role="img"
        aria-label="One or more unrolled recurrent traces, showing the hidden state carried forward from one token to the next."
      >
        {rows.map((row, ri) => {
          const y = ri * (cellH + rowGap);
          return (
            <g key={ri}>
              <text x={0} y={y + cellH / 2 + 4} className={styles.rowLabel}>
                {row.label}
              </text>
              {row.trace.map((step, i) => {
                if (i === steps - 1) return null;
                const x1 = 90 + i * cellW + cellW / 2;
                const x2 = 90 + (i + 1) * cellW + cellW / 2;
                return (
                  <line
                    key={`arrow-${i}`}
                    x1={x1 + 26}
                    y1={y + cellH / 2}
                    x2={x2 - 26}
                    y2={y + cellH / 2}
                    className={styles.arrow}
                    markerEnd={`url(#rnn-arrow)`}
                  />
                );
              })}
              {row.trace.map((step, i) => {
                const x = 90 + i * cellW + cellW / 2;
                const normalized = Math.abs(step.h) / maxAbsH;
                const tokenLabel = step.token ? row.tokenLabels[i - 1] : "start";
                return (
                  <g key={i}>
                    <circle
                      cx={x}
                      cy={y + cellH / 2}
                      r={26}
                      className={step.h >= 0 ? styles.cellPositive : styles.cellNegative}
                      fillOpacity={0.15 + normalized * 0.75}
                    />
                    <text x={x} y={y + cellH / 2 - 34} className={styles.tokenLabel} textAnchor="middle">
                      {tokenLabel}
                    </text>
                    <text x={x} y={y + cellH / 2 + 5} className={styles.hValue} textAnchor="middle">
                      {step.h.toFixed(2)}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
        <defs>
          <marker id="rnn-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <polygon points="0,0 10,5 0,10" className={styles.arrowHead} />
          </marker>
        </defs>
      </svg>
      {readout && <div className={styles.readout}>{readout}</div>}
    </div>
  );
}
