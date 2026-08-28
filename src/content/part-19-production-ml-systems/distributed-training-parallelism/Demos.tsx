"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  NUM_GPUS,
  HIDDEN_DIM,
  NUM_LAYERS,
  dataParallelVolume,
  tensorParallelVolume,
  pipelineParallelVolume,
  communicationVolume,
  STRATEGIES,
  CHECKPOINT_GPUS,
  CHECKPOINT_CANDIDATES,
  type Strategy,
} from "@/lib/math-core/distributed-training-parallelism";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "distributed-training-parallelism";
const GPU_OPTIONS = [2, 4, 8, 16];

const WHAT_MOVES: Record<Strategy, string> = {
  data: "the full gradient, all-reduced across every GPU, once per training step",
  tensor: "an activation vector, all-reduced at every layer boundary, forward and backward",
  pipeline: "one activation, sent point-to-point between adjacent stages — no collective at all",
};

function volumesAt(gpus: number) {
  return [
    { label: "data parallel", value: dataParallelVolume(gpus) },
    { label: "tensor parallel", value: tensorParallelVolume(gpus) },
    { label: "pipeline parallel", value: pipelineParallelVolume() },
  ];
}

/** Intuition beat: same tiny 2-layer model, same 4 GPUs — only what gets communicated changes with the strategy. */
export function IntuitionDemo() {
  const [strategy, setStrategy] = useState<Strategy>("data");
  return (
    <>
      <div className={styles.buttons}>
        {STRATEGIES.map((s) => (
          <button key={s.key} type="button" className={s.key === strategy ? styles.buttonActive : styles.button} onClick={() => setStrategy(s.key)}>
            {s.label}
          </button>
        ))}
      </div>
      <p>Each step, this strategy communicates {WHAT_MOVES[strategy]}.</p>
      <ContributionBars
        items={volumesAt(NUM_GPUS)}
        formatValue={(v) => v.toFixed(0)}
        readout={`selected: ${strategy} parallel = ${communicationVolume(strategy, NUM_GPUS)} units, on a ${NUM_LAYERS}-layer, ${HIDDEN_DIM}×${HIDDEN_DIM} model across ${NUM_GPUS} GPUs`}
      />
    </>
  );
}

/** Play beat: grow the GPU count and watch data- and tensor-parallel volume grow with it, while pipeline stays flat. */
export function PlayDemo() {
  const [gpus, setGpus] = useState(GPU_OPTIONS[1]);
  return (
    <>
      <div className={styles.buttons}>
        {GPU_OPTIONS.map((g) => (
          <button key={g} type="button" className={g === gpus ? styles.buttonActive : styles.button} onClick={() => setGpus(g)}>
            {g} GPUs
          </button>
        ))}
      </div>
      <ContributionBars
        items={volumesAt(gpus)}
        formatValue={(v) => v.toFixed(1)}
        readout={`pipeline parallel moves ${pipelineParallelVolume()} units no matter how many GPUs join — it never runs a collective, only point-to-point hops between adjacent stages`}
      />
    </>
  );
}

/** Checkpoint: an unseen, larger cluster — same model, exact data-parallel volume. */
export function DistributedTrainingCheckpoint() {
  const [chosen, setChosen] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const target = dataParallelVolume(CHECKPOINT_GPUS);
  const passed = chosen === target;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Same {NUM_LAYERS}-layer, {HIDDEN_DIM}×{HIDDEN_DIM} model, now spread across {CHECKPOINT_GPUS} GPUs.
          What is the <strong>data-parallel</strong> communication volume?
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a value to try it"
    >
      <div className={styles.buttons}>
        {CHECKPOINT_CANDIDATES.map((c) => (
          <button
            key={c}
            type="button"
            className={c === chosen ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setChosen(c);
            }}
          >
            {c}
          </button>
        ))}
      </div>
    </CheckpointFrame>
  );
}
