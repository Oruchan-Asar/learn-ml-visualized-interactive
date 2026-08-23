"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { WordEmbeddingSpace, type EmbeddingPoint } from "@/components/viz/WordEmbeddingSpace";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  HIGH_DIM_POINTS,
  LABELS,
  INIT_EMBEDDING,
  type Point2D,
  computeP,
  computeQ,
  klDivergence,
  train,
  distance,
} from "@/lib/math-core/non-linear-dimensionality-reduction-tsne";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "non-linear-dimensionality-reduction-tsne";
const DOMAIN: [number, number] = [-4, 4];

/** t-SNE's embedding has no fixed scale — it drifts outward as training continues. Rescale it to fit
 * the display domain without changing the relative arrangement. */
function normalize(points: Point2D[]): EmbeddingPoint[] {
  const maxAbs = Math.max(1e-6, ...points.flatMap((p) => [Math.abs(p.x), Math.abs(p.y)]));
  const scale = 3 / maxAbs;
  return points.map((p, i) => ({ label: LABELS[i], x: p.x * scale, y: p.y * scale }));
}

const P = computeP(HIGH_DIM_POINTS);

/** Intuition beat: compare the jumbled starting layout to the fully trained one. */
export function IntuitionDemo() {
  const [trained, setTrained] = useState(false);
  const embedding = trained ? train(P, INIT_EMBEDDING, 300) : INIT_EMBEDDING;
  const d12 = distance(embedding[0], embedding[1]);
  const d34 = distance(embedding[2], embedding[3]);
  const d13 = distance(embedding[0], embedding[2]);

  return (
    <>
      <div className={styles.buttons}>
        <button type="button" className={!trained ? styles.buttonActive : styles.button} onClick={() => setTrained(false)}>
          Before training
        </button>
        <button type="button" className={trained ? styles.buttonActive : styles.button} onClick={() => setTrained(true)}>
          After 300 steps
        </button>
      </div>
      <WordEmbeddingSpace
        words={normalize(embedding)}
        domain={DOMAIN}
        readout={`P1↔P2 = ${d12.toFixed(2)}, P3↔P4 = ${d34.toFixed(2)}, P1↔P3 = ${d13.toFixed(2)}`}
      />
    </>
  );
}

function StepsSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const id = useId();
  return (
    <div className={styles.sliderRow}>
      <label htmlFor={id}>training steps = {value}</label>
      <input id={id} type="range" min={0} max={60} step={2} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

/** Play beat: drag the training-steps slider and watch KL divergence and the embedding respond — not always smoothly. */
export function PlayDemo() {
  const [steps, setSteps] = useState(0);
  const embedding = useMemo(() => train(P, INIT_EMBEDDING, steps), [steps]);
  const kl = klDivergence(P, computeQ(embedding));

  return (
    <>
      <WordEmbeddingSpace words={normalize(embedding)} domain={DOMAIN} readout={`KL divergence = ${kl.toFixed(3)}`} />
      <div className={styles.controls}>
        <StepsSlider value={steps} onChange={setSteps} />
      </div>
    </>
  );
}

const KL_TARGET = 0.1;

/** Checkpoint: drag training steps until KL divergence drops below target. */
export function TsneCheckpoint() {
  const [steps, setSteps] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const embedding = useMemo(() => train(P, INIT_EMBEDDING, steps), [steps]);
  const kl = klDivergence(P, computeQ(embedding));
  const passed = kl < KL_TARGET;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Drag the training-steps slider until KL divergence drops below <strong>{KL_TARGET}</strong>.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag steps to try it"
    >
      <WordEmbeddingSpace words={normalize(embedding)} domain={DOMAIN} readout={`KL divergence = ${kl.toFixed(3)}`} />
      <div className={styles.controls}>
        <StepsSlider
          value={steps}
          onChange={(v) => {
            setHasInteracted(true);
            setSteps(v);
          }}
        />
      </div>
    </CheckpointFrame>
  );
}
