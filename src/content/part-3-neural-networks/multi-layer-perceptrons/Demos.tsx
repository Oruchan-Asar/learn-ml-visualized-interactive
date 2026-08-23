"use client";

import { useEffect, useId, useState } from "react";
import { ForwardPassDiagram } from "@/components/viz/ForwardPassDiagram";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  HIDDEN_A_W,
  HIDDEN_A_B,
  HIDDEN_B_W,
  HIDDEN_B_B,
  OUTPUT_W,
  XOR_POINTS,
  OUTPUT_BIAS_DOMAIN,
  DEFAULT_OUTPUT_BIAS,
  TARGET_CORRECT_COUNT,
  forward,
  countCorrect,
} from "@/lib/math-core/multi-layer-perceptrons";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "multi-layer-perceptrons";

const HIDDEN_NEURONS = [
  { weights: [...HIDDEN_A_W], bias: HIDDEN_A_B, label: "A" },
  { weights: [...HIDDEN_B_W], bias: HIDDEN_B_B, label: "B" },
];

function CornerPicker({
  corner,
  onSelect,
}: {
  corner: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div className={styles.buttons}>
      {XOR_POINTS.map((p, i) => (
        <button
          key={i}
          type="button"
          className={i === corner ? styles.buttonPrimary : styles.button}
          onClick={() => onSelect(i)}
        >
          ({p.x1},{p.x2})
        </button>
      ))}
    </div>
  );
}

function NetworkView({ x1, x2, outputBias }: { x1: number; x2: number; outputBias: number }) {
  const { hA, hB, z1A, z1B, zOut, y } = forward(x1, x2, outputBias);
  return (
    <>
      <ForwardPassDiagram
        inputs={[x1, x2]}
        inputLabels={["x1", "x2"]}
        neurons={HIDDEN_NEURONS}
        preActivations={[z1A, z1B]}
        outputs={[hA, hB]}
        readout={`hidden layer: hA = ${hA}, hB = ${hB}`}
      />
      <ForwardPassDiagram
        inputs={[hA, hB]}
        inputLabels={["hA", "hB"]}
        neurons={[{ weights: [...OUTPUT_W], bias: outputBias, label: "out" }]}
        preActivations={[zOut]}
        outputs={[y]}
        readout={`output: y = ${y}`}
      />
    </>
  );
}

function truthTableReadout(outputBias: number): string {
  return XOR_POINTS.map((p) => {
    const y = forward(p.x1, p.x2, outputBias).y;
    return `(${p.x1},${p.x2})→${y}${y === p.target ? "✓" : "✗"}`;
  }).join("  ");
}

/** Intuition beat: click through XOR's 4 corners with the hand-solved network — no formulas yet, just watch it get every one right. */
export function IntuitionDemo() {
  const [corner, setCorner] = useState(0);
  const p = XOR_POINTS[corner];
  return (
    <>
      <NetworkView x1={p.x1} x2={p.x2} outputBias={-1.5} />
      <div className={styles.controls}>
        <CornerPicker corner={corner} onSelect={setCorner} />
      </div>
    </>
  );
}

/** Play beat: same network, now the output neuron's bias is draggable — watch the truth table live. */
export function PlayDemo() {
  const [corner, setCorner] = useState(0);
  const [outputBias, setOutputBias] = useState(DEFAULT_OUTPUT_BIAS);
  const id = useId();
  const p = XOR_POINTS[corner];
  return (
    <>
      <NetworkView x1={p.x1} x2={p.x2} outputBias={outputBias} />
      <div className={styles.controls}>
        <CornerPicker corner={corner} onSelect={setCorner} />
        <div className={styles.sliderRow}>
          <label htmlFor={id}>output bias c = {outputBias.toFixed(2)}</label>
          <input
            id={id}
            type="range"
            min={OUTPUT_BIAS_DOMAIN[0]}
            max={OUTPUT_BIAS_DOMAIN[1]}
            step={0.05}
            value={outputBias}
            onChange={(e) => setOutputBias(Number(e.target.value))}
          />
        </div>
        <p>{truthTableReadout(outputBias)} — {countCorrect(outputBias)}/4 correct</p>
      </div>
    </>
  );
}

/** Checkpoint: drag the output bias until the network gets all four XOR rows right at once. */
export function MlpCheckpoint() {
  const [corner, setCorner] = useState(0);
  const [outputBias, setOutputBias] = useState(DEFAULT_OUTPUT_BIAS);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const id = useId();
  const p = XOR_POINTS[corner];
  const correct = countCorrect(outputBias);

  const passed = withinTolerance(correct, TARGET_CORRECT_COUNT, 0.5);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Drag the output neuron&rsquo;s bias until the network gets all <strong>4 of 4</strong> XOR rows right.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag the slider to try it"
    >
      <NetworkView x1={p.x1} x2={p.x2} outputBias={outputBias} />
      <div className={styles.controls}>
        <CornerPicker corner={corner} onSelect={setCorner} />
        <div className={styles.sliderRow}>
          <label htmlFor={id}>output bias c = {outputBias.toFixed(2)}</label>
          <input
            id={id}
            type="range"
            min={OUTPUT_BIAS_DOMAIN[0]}
            max={OUTPUT_BIAS_DOMAIN[1]}
            step={0.05}
            value={outputBias}
            onChange={(e) => {
              setHasInteracted(true);
              setOutputBias(Number(e.target.value));
            }}
          />
        </div>
        <p>{truthTableReadout(outputBias)} — {correct}/4 correct</p>
      </div>
    </CheckpointFrame>
  );
}
