"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { encoderTrace, context, decode, INPUT_SEQUENCE } from "@/lib/math-core/sequence-to-sequence";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "sequence-to-sequence";
const STEP_OPTIONS = [2, 3, 4];
const CTX = context();

/** Intuition beat: one fixed context vector, decoded out to however many steps you ask for. */
export function IntuitionDemo() {
  const [outputSteps, setOutputSteps] = useState(2);
  const outputs = decode(CTX, outputSteps);
  return (
    <>
      <div className={styles.buttons}>
        {STEP_OPTIONS.map((n) => (
          <button key={n} type="button" className={n === outputSteps ? styles.buttonActive : styles.button} onClick={() => setOutputSteps(n)}>
            decode {n} steps
          </button>
        ))}
      </div>
      <ContributionBars
        items={outputs.map((y, i) => ({ label: `y${i + 1}`, value: y }))}
        formatValue={(v) => v.toFixed(4)}
        readout={`3-token input → 1 context vector (${CTX.toFixed(4)}) → ${outputSteps}-step output`}
      />
    </>
  );
}

/** Play beat: the encoder compressing 3 inputs into a context, and the decoder unrolling it. */
export function PlayDemo() {
  const trace = encoderTrace();
  const outputs = decode(CTX, 4);
  return (
    <>
      <ContributionBars
        items={INPUT_SEQUENCE.map((x, i) => ({ label: `encoder step ${i + 1} (x=${x})`, value: trace[i] }))}
        formatValue={(v) => v.toFixed(4)}
        readout={`context vector = final encoder state = ${CTX.toFixed(4)}`}
      />
      <ContributionBars
        items={outputs.map((y, i) => ({ label: `decoder step ${i + 1}`, value: y }))}
        formatValue={(v) => v.toFixed(4)}
        readout="the decoder never re-reads the input — only the single context vector, then its own output"
      />
    </>
  );
}

/** Checkpoint: find the decode length where the final output has decayed below 0.1 in magnitude. */
export function SeqToSeqCheckpoint() {
  const [outputSteps, setOutputSteps] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const outputs = outputSteps === null ? null : decode(CTX, outputSteps);
  const lastAbs = outputs ? Math.abs(outputs[outputs.length - 1]) : null;
  const passed = lastAbs !== null && lastAbs < 0.1;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the decode length whose <strong>final output</strong> has decayed below <strong>0.1</strong> in magnitude.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a decode length to try it"
    >
      <div className={styles.buttons}>
        {STEP_OPTIONS.map((n) => (
          <button
            key={n}
            type="button"
            className={n === outputSteps ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setOutputSteps(n);
            }}
          >
            decode {n} steps
          </button>
        ))}
      </div>
      {outputs && <ContributionBars items={outputs.map((y, i) => ({ label: `y${i + 1}`, value: y }))} formatValue={(v) => v.toFixed(4)} />}
    </CheckpointFrame>
  );
}
