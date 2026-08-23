"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { neuronA, neuronB, output, patchedOutput, EXAMPLES, type Features } from "@/lib/math-core/mechanistic-interpretability-fundamentals";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "mechanistic-interpretability-fundamentals";

function Toggle({ label, on, onFlip }: { label: string; on: boolean; onFlip: () => void }) {
  return (
    <button type="button" className={on ? styles.buttonActive : styles.button} onClick={onFlip}>
      {label}: {on ? "yes" : "no"}
    </button>
  );
}

function flip(f: Features, key: keyof Features): Features {
  return { ...f, [key]: f[key] ? 0 : 1 };
}

/** Intuition beat: toggle raw input features and watch which neuron actually responds. */
export function IntuitionDemo() {
  const [features, setFeatures] = useState<Features>({ size: 0, legs: 1, metal: 0 });

  return (
    <>
      <div className={styles.buttons}>
        <Toggle label="large" on={features.size === 1} onFlip={() => setFeatures((f) => flip(f, "size"))} />
        <Toggle label="has legs" on={features.legs === 1} onFlip={() => setFeatures((f) => flip(f, "legs"))} />
        <Toggle label="metal" on={features.metal === 1} onFlip={() => setFeatures((f) => flip(f, "metal"))} />
      </div>
      <ContributionBars
        items={[
          { label: "neuron A", value: neuronA(features) },
          { label: "neuron B", value: neuronB(features) },
        ]}
        formatValue={(v) => v.toFixed(2)}
        max={2}
        readout={`output = 2·A − 0.5·B = ${output(features).toFixed(2)}`}
      />
    </>
  );
}

/** Play beat: activation patching — borrow one neuron's activation from a different example and see whether the output follows it. */
export function PlayDemo() {
  const [targetIdx, setTargetIdx] = useState(0);
  const [sourceIdx, setSourceIdx] = useState(1);
  const target = EXAMPLES[targetIdx];
  const source = EXAMPLES[sourceIdx];

  return (
    <>
      <div className={styles.buttons}>
        {EXAMPLES.map((ex, i) => (
          <button key={`t-${ex.label}`} type="button" className={i === targetIdx ? styles.buttonActive : styles.button} onClick={() => setTargetIdx(i)}>
            target: {ex.label}
          </button>
        ))}
      </div>
      <div className={styles.buttons}>
        {EXAMPLES.map((ex, i) => (
          <button key={`s-${ex.label}`} type="button" className={i === sourceIdx ? styles.buttonActive : styles.button} onClick={() => setSourceIdx(i)}>
            patch from: {ex.label}
          </button>
        ))}
      </div>
      <ContributionBars
        items={[
          { label: `${target.label} (unpatched)`, value: output(target.features) },
          { label: `+ A patched from ${source.label}`, value: patchedOutput(target.features, source.features, "A") },
          { label: `+ B patched from ${source.label}`, value: patchedOutput(target.features, source.features, "B") },
          { label: `${source.label} (unpatched)`, value: output(source.features) },
        ]}
        formatValue={(v) => v.toFixed(2)}
        readout="whichever patch moves the output closer to the source's own output is the neuron doing the causal work"
      />
    </>
  );
}

/** Checkpoint: toggle features until neuron A fires while neuron B stays silent. */
export function MechInterpCheckpoint() {
  const [features, setFeatures] = useState<Features>({ size: 0, legs: 0, metal: 0 });
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const a = neuronA(features);
  const b = neuronB(features);
  const passed = a > 0 && b === 0;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Toggle the features until <strong>neuron A fires</strong> (activation &gt; 0) while <strong>neuron B stays silent</strong> (activation = 0).
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Toggle a feature to try it"
    >
      <div className={styles.buttons}>
        <Toggle
          label="large"
          on={features.size === 1}
          onFlip={() => {
            setHasInteracted(true);
            setFeatures((f) => flip(f, "size"));
          }}
        />
        <Toggle
          label="has legs"
          on={features.legs === 1}
          onFlip={() => {
            setHasInteracted(true);
            setFeatures((f) => flip(f, "legs"));
          }}
        />
        <Toggle
          label="metal"
          on={features.metal === 1}
          onFlip={() => {
            setHasInteracted(true);
            setFeatures((f) => flip(f, "metal"));
          }}
        />
      </div>
      <ContributionBars
        items={[
          { label: "neuron A", value: a },
          { label: "neuron B", value: b },
        ]}
        formatValue={(v) => v.toFixed(2)}
        max={2}
      />
    </CheckpointFrame>
  );
}
