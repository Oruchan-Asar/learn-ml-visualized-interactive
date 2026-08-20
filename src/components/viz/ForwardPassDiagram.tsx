"use client";

import type { ReactNode } from "react";
import styles from "./ForwardPassDiagram.module.css";

export interface DiagramNeuron {
  weights: number[];
  bias: number;
  label: string;
}

export interface ForwardPassDiagramProps {
  inputs: number[];
  inputLabels: string[];
  neurons: DiagramNeuron[];
  preActivations: number[];
  outputs: number[];
  width?: number;
  height?: number;
  readout?: ReactNode;
}

export function ForwardPassDiagram({
  inputs,
  inputLabels,
  neurons,
  preActivations,
  outputs,
  width = 480,
  height = 280,
  readout,
}: ForwardPassDiagramProps) {
  const inputX = 70;
  const neuronX = width - 90;
  const inputYs = inputs.map((_, i) => (height / (inputs.length + 1)) * (i + 1));
  const neuronYs = neurons.map((_, i) => (height / (neurons.length + 1)) * (i + 1));

  return (
    <div className={styles.wrap}>
      <svg viewBox={`0 0 ${width} ${height}`} className={styles.svg} role="img" aria-label="A small neural network layer — edges are line weight and color by sign and magnitude, nodes show live values.">
        {neurons.map((n, ni) =>
          n.weights.map((w, ii) => (
            <line
              key={`${ni}-${ii}`}
              x1={inputX}
              y1={inputYs[ii]}
              x2={neuronX}
              y2={neuronYs[ni]}
              className={w >= 0 ? styles.edgePositive : styles.edgeNegative}
              strokeWidth={Math.max(1, Math.min(5, Math.abs(w) * 2))}
            />
          )),
        )}

        {inputs.map((value, i) => (
          <g key={i}>
            <circle cx={inputX} cy={inputYs[i]} r={22} className={styles.inputNode} />
            <text x={inputX} y={inputYs[i] - 30} className={styles.label} textAnchor="middle">
              {inputLabels[i]}
            </text>
            <text x={inputX} y={inputYs[i] + 5} className={styles.value} textAnchor="middle">
              {value.toFixed(1)}
            </text>
          </g>
        ))}

        {neurons.map((n, i) => (
          <g key={i}>
            <circle cx={neuronX} cy={neuronYs[i]} r={26} className={outputs[i] > 0 ? styles.neuronActive : styles.neuronNode} />
            <text x={neuronX} y={neuronYs[i] - 34} className={styles.label} textAnchor="middle">
              {n.label}: z = {preActivations[i].toFixed(2)}
            </text>
            <text x={neuronX} y={neuronYs[i] + 5} className={styles.value} textAnchor="middle">
              {outputs[i].toFixed(2)}
            </text>
          </g>
        ))}
      </svg>
      {readout && <div className={styles.readout}>{readout}</div>}
    </div>
  );
}
