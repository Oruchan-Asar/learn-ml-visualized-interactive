"use client";

import { useEffect, useState } from "react";
import { ConvolutionPlayground } from "@/components/viz/ConvolutionPlayground";
import { PoolingPlayground } from "@/components/viz/PoolingPlayground";
import { ForwardPassDiagram } from "@/components/viz/ForwardPassDiagram";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  IMAGE,
  KERNEL_SIZE,
  POOL_SIZE,
  STRIDE,
  CLASS_LABELS,
  TRUE_CLASS_INDEX,
  DENSE_WEIGHTS,
  DENSE_BIAS,
  computePipeline,
} from "@/lib/math-core/minimal-cnn";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "a-minimal-cnn";

function ReluButtons({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className={styles.buttons}>
      <button
        type="button"
        className={enabled ? styles.buttonActive : styles.button}
        onClick={() => onChange(true)}
      >
        ReLU on
      </button>
      <button
        type="button"
        className={!enabled ? styles.buttonActive : styles.button}
        onClick={() => onChange(false)}
      >
        ReLU off
      </button>
    </div>
  );
}

function PipelineStages({ reluEnabled }: { reluEnabled: boolean }) {
  const { featureMap, activeMap, pooled, flattened, logits, predictedIndex } = computePipeline(reluEnabled);
  const maxAbs = Math.max(...featureMap.flat().map(Math.abs));

  return (
    <>
      <ConvolutionPlayground
        image={IMAGE}
        kernelSize={KERNEL_SIZE}
        featureMap={activeMap}
        windowRow={0}
        windowCol={0}
        maxResponse={maxAbs}
        showWindow={false}
        readout={reluEnabled ? "image → convolution → ReLU" : "image → convolution (no ReLU)"}
      />
      <PoolingPlayground
        featureMap={activeMap}
        poolSize={POOL_SIZE}
        stride={STRIDE}
        pooled={pooled}
        outputRow={0}
        outputCol={0}
        maxValue={maxAbs}
        readout={`flattened: [${flattened.join(", ")}]`}
      />
      <ForwardPassDiagram
        inputs={flattened}
        inputLabels={flattened.map((_, i) => `f${i}`)}
        neurons={DENSE_WEIGHTS.map((weights, i) => ({ weights, bias: DENSE_BIAS[i], label: CLASS_LABELS[i] }))}
        preActivations={logits}
        outputs={logits}
        readout={`predicted: "${CLASS_LABELS[predictedIndex]}" — ${
          predictedIndex === TRUE_CLASS_INDEX ? "correct" : "wrong"
        } (true class: "${CLASS_LABELS[TRUE_CLASS_INDEX]}")`}
      />
    </>
  );
}

/** Intuition beat: the whole pipeline assembled and working — image in, decision out. */
export function IntuitionDemo() {
  return <PipelineStages reluEnabled={true} />;
}

/** Play beat: toggle ReLU off — the pooled map keeps the negative evidence, and the decision flips. */
export function PlayDemo() {
  const [reluEnabled, setReluEnabled] = useState(true);
  return (
    <>
      <PipelineStages reluEnabled={reluEnabled} />
      <div className={styles.controls}>
        <ReluButtons enabled={reluEnabled} onChange={setReluEnabled} />
      </div>
    </>
  );
}

/** Checkpoint: turn ReLU on so the assembled network reaches the correct decision. */
export function MinimalCnnCheckpoint() {
  const [reluEnabled, setReluEnabled] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const { predictedIndex } = computePipeline(reluEnabled);

  const passed = predictedIndex === TRUE_CLASS_INDEX;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Set ReLU so the network predicts the true class, <strong>&ldquo;{CLASS_LABELS[TRUE_CLASS_INDEX]}&rdquo;</strong>.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Toggle ReLU to try it"
    >
      <PipelineStages reluEnabled={reluEnabled} />
      <div className={styles.controls}>
        <ReluButtons
          enabled={reluEnabled}
          onChange={(v) => {
            setHasInteracted(true);
            setReluEnabled(v);
          }}
        />
      </div>
    </CheckpointFrame>
  );
}
