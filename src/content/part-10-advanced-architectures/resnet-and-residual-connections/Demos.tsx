"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { residualGradientAtInput } from "@/lib/math-core/resnet-and-residual-connections";
import { gradientAtInput } from "@/lib/math-core/vanishing-gradients";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "resnet-and-residual-connections";
const DEPTH_OPTIONS = [5, 10, 20];

/** Intuition beat: same depth, same weight, only the skip connection differs — watch the gradient survive or not. */
export function IntuitionDemo() {
  const [depth, setDepth] = useState(10);
  const plain = gradientAtInput(depth);
  const residual = residualGradientAtInput(depth);
  return (
    <>
      <div className={styles.buttons}>
        {DEPTH_OPTIONS.map((d) => (
          <button key={d} type="button" className={d === depth ? styles.buttonActive : styles.button} onClick={() => setDepth(d)}>
            depth={d}
          </button>
        ))}
      </div>
      <ContributionBars
        items={[
          { label: "plain network", value: plain },
          { label: "with skip connections", value: residual },
        ]}
        formatValue={(v) => v.toExponential(3)}
        readout={`at depth ${depth}: plain ≈ ${plain.toExponential(2)}, residual ≈ ${residual.toFixed(2)}`}
      />
    </>
  );
}

/** Play beat: the full depth sweep, plain vs residual, on the same axes. */
export function PlayDemo() {
  const items = DEPTH_OPTIONS.flatMap((d) => [
    { label: `plain @ ${d}`, value: gradientAtInput(d) },
    { label: `residual @ ${d}`, value: residualGradientAtInput(d) },
  ]);
  return (
    <ContributionBars
      items={items}
      formatValue={(v) => v.toExponential(2)}
      readout="the plain network's bars are too small to even see next to the residual network's"
    />
  );
}

/** Checkpoint: find the depth where the plain network's gradient has shrunk below 1e-10. */
export function ResNetCheckpoint() {
  const [depth, setDepth] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const plain = depth === null ? null : gradientAtInput(depth);
  const passed = plain !== null && plain < 1e-10;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the depth, among the three candidates, where the <strong>plain network&apos;s</strong> gradient has shrunk below <strong>1e-10</strong>.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a depth to try it"
    >
      <div className={styles.buttons}>
        {DEPTH_OPTIONS.map((d) => (
          <button
            key={d}
            type="button"
            className={d === depth ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setDepth(d);
            }}
          >
            depth={d}
          </button>
        ))}
      </div>
      {plain !== null && (
        <ContributionBars
          items={[
            { label: "plain network", value: plain },
            { label: "residual network", value: residualGradientAtInput(depth!) },
          ]}
          formatValue={(v) => v.toExponential(3)}
        />
      )}
    </CheckpointFrame>
  );
}
