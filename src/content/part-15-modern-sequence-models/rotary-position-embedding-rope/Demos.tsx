"use client";

import { useEffect, useState } from "react";
import { VectorPlayground } from "@/components/viz/VectorPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  Q0,
  K0,
  ropeVector,
  ropeDot,
  plainDot,
  POSITIONS,
} from "@/lib/math-core/rotary-position-embedding-rope";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "rotary-position-embedding-rope";

/** Intuition beat: step the query's position 0-4 while the key stays put at position 0, watching it rotate and the dot product move with it. */
export function IntuitionDemo() {
  const [posQ, setPosQ] = useState(0);
  const rotatedQ = ropeVector(Q0, posQ);
  const dot = ropeDot(posQ, 0);

  return (
    <>
      <div className={styles.buttons}>
        {POSITIONS.map((p) => (
          <button key={p} type="button" className={p === posQ ? styles.buttonActive : styles.button} onClick={() => setPosQ(p)}>
            pos = {p}
          </button>
        ))}
      </div>
      <VectorPlayground
        vectors={[
          { x: K0[0], y: K0[1] },
          { x: rotatedQ[0], y: rotatedQ[1] },
        ]}
        domain={[-2, 2]}
        readout={`key fixed at position 0; query rotated to position ${posQ} → dot product = ${dot.toFixed(3)} (plain dot product would be ${plainDot().toFixed(3)})`}
      />
    </>
  );
}

/** Play beat: slide the query's position continuously. The key never moves — only the angle between the two vectors does, and the dot product traces it live. */
export function PlayDemo() {
  const [posQ, setPosQ] = useState(0);
  const rotatedQ = ropeVector(Q0, posQ);
  const dot = ropeDot(posQ, 0);

  return (
    <>
      <VectorPlayground
        vectors={[
          { x: K0[0], y: K0[1] },
          { x: rotatedQ[0], y: rotatedQ[1] },
        ]}
        domain={[-2, 2]}
        readout={`position = ${posQ.toFixed(2)} → dot product = ${dot.toFixed(3)}`}
      />
      <div className={styles.controls}>
        <div className={styles.sliderRow}>
          <label>position of Q</label>
          <input
            type="range"
            min={0}
            max={8}
            step={0.05}
            value={posQ}
            onChange={(e) => setPosQ(Number(e.target.value))}
          />
        </div>
      </div>
    </>
  );
}

const TARGET_DISTANCE = 2;
const TARGET = ropeDot(0, TARGET_DISTANCE);

/** Checkpoint: pick the query position (key fixed at 0) that makes the rotated dot product land on the target — the value the worked example computed by hand at distance 2. */
export function RopeCheckpoint() {
  const [posQ, setPosQ] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const value = posQ === null ? null : ropeDot(posQ, 0);
  const passed = value !== null && withinTolerance(value, TARGET, 0.05);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          The key sits at position 0. Find the query position, among the candidates, that makes the RoPE dot
          product land within <strong>0.05</strong> of <strong>{TARGET.toFixed(2)}</strong> — the value a
          relative distance of {TARGET_DISTANCE} produces.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a position to try it"
    >
      <div className={styles.buttons}>
        {POSITIONS.map((p) => (
          <button
            key={p}
            type="button"
            className={p === posQ ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setPosQ(p);
            }}
          >
            pos = {p}
          </button>
        ))}
      </div>
      {value !== null && (
        <VectorPlayground
          vectors={[
            { x: K0[0], y: K0[1] },
            { x: ropeVector(Q0, posQ!)[0], y: ropeVector(Q0, posQ!)[1] },
          ]}
          domain={[-2, 2]}
          passed={passed}
          readout={`dot product = ${value.toFixed(3)} (target ${TARGET.toFixed(2)})`}
        />
      )}
    </CheckpointFrame>
  );
}
