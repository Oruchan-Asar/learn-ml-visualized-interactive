"use client";

import type { ReactNode } from "react";
import styles from "./ConvolutionPlayground.module.css";

export interface ConvolutionPlaygroundProps {
  image: number[][];
  kernelSize: number;
  featureMap: number[][];
  /** Top-left corner of the current kernel window (controlled). */
  windowRow: number;
  windowCol: number;
  maxResponse: number;
  width?: number;
  readout?: ReactNode;
  /** Set false to hide the kernel-window outline, e.g. when displaying an already-computed feature map. */
  showWindow?: boolean;
}

export function ConvolutionPlayground({
  image,
  kernelSize,
  featureMap,
  windowRow,
  windowCol,
  maxResponse,
  width = 480,
  readout,
  showWindow = true,
}: ConvolutionPlaygroundProps) {
  const imageSize = image.length;
  const cell = 32;
  const gap = 18;
  const imagePixels = imageSize * cell;
  const featureCell = 32;
  const featureSize = featureMap.length;
  const featurePixels = featureSize * featureCell;
  const height = Math.max(imagePixels, featurePixels) + 16;
  const featureX = imagePixels + gap;

  return (
    <div className={styles.wrap}>
      <svg viewBox={`0 0 ${width} ${height}`} className={styles.svg} role="img" aria-label="A small image on the left, the kernel window highlighted, and the resulting feature map on the right.">
        {image.map((row, r) =>
          row.map((v, c) => (
            <rect
              key={`${r}-${c}`}
              x={c * cell}
              y={r * cell}
              width={cell - 1}
              height={cell - 1}
              className={v > 0 ? styles.pixelLight : styles.pixelDark}
            />
          )),
        )}
        {showWindow && (
          <rect
            x={windowCol * cell}
            y={windowRow * cell}
            width={kernelSize * cell - 1}
            height={kernelSize * cell - 1}
            className={styles.windowOutline}
          />
        )}

        {featureMap.map((row, r) =>
          row.map((v, c) => {
            const isCurrent = r === windowRow && c === windowCol;
            const normalized = maxResponse !== 0 ? Math.abs(v) / Math.abs(maxResponse) : 0;
            return (
              <g key={`f-${r}-${c}`}>
                <rect
                  x={featureX + c * featureCell}
                  y={r * featureCell}
                  width={featureCell - 1}
                  height={featureCell - 1}
                  className={isCurrent ? styles.featureCellActive : styles.featureCell}
                  fillOpacity={0.15 + normalized * 0.7}
                />
                <text
                  x={featureX + c * featureCell + featureCell / 2}
                  y={r * featureCell + featureCell / 2 + 4}
                  textAnchor="middle"
                  className={styles.featureText}
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
