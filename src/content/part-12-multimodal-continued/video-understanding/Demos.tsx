"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { FRAMES, temporalAttentionWeights, inLocalWindow, temporalDistance } from "@/lib/math-core/video-understanding";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "video-understanding";

/** Intuition beat: pick a query frame and see its attention weight over every frame in the clip. */
export function IntuitionDemo() {
  const [queryIndex, setQueryIndex] = useState(0);
  const weights = temporalAttentionWeights(queryIndex);
  return (
    <>
      <div className={styles.buttons}>
        {FRAMES.map((f, i) => (
          <button key={f.index} type="button" className={i === queryIndex ? styles.buttonActive : styles.button} onClick={() => setQueryIndex(i)}>
            frame {f.index} ({f.state === 1 ? "high" : "low"})
          </button>
        ))}
      </div>
      <ContributionBars
        items={FRAMES.map((f, i) => ({ label: `frame ${f.index}`, value: weights[i] }))}
        formatValue={(v) => v.toFixed(3)}
        readout={`query: frame ${queryIndex} — attention lands on every frame sharing its motion state, regardless of when it happened`}
      />
    </>
  );
}

/** Play beat: frame 0's attention vs. what a local-window model could ever see. */
export function PlayDemo() {
  const weights = temporalAttentionWeights(0);
  const inWindow = FRAMES.reduce((sum, f, i) => (inLocalWindow(FRAMES[0], f) ? sum + weights[i] : sum), 0);
  return (
    <ContributionBars
      items={[
        { label: "attention within a size-1 local window", value: inWindow },
        { label: "attention on frame 4 alone (distance 4)", value: weights[4] },
      ]}
      formatValue={(v) => v.toFixed(3)}
      readout={`frame 4 is ${temporalDistance(FRAMES[0], FRAMES[4])} frames away from frame 0 — outside any local window — yet receives ${(weights[4] * 100).toFixed(1)}% of frame 0's attention`}
    />
  );
}

/** Checkpoint: find the frame, between the two candidates, that receives more attention from frame 0. */
export function VideoCheckpoint() {
  const [choice, setChoice] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const candidates = [1, 4]; // frame 1 (adjacent, low) vs frame 4 (far, high)

  const weights = temporalAttentionWeights(0);
  const passed = choice === 4;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the frame, between the two candidates, that receives <strong>more attention</strong> from frame 0 — despite being farther away in time.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a frame to try it"
    >
      <div className={styles.buttons}>
        {candidates.map((i) => (
          <button
            key={i}
            type="button"
            className={i === choice ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setChoice(i);
            }}
          >
            frame {i}
          </button>
        ))}
      </div>
      {choice !== null && <ContributionBars items={[{ label: `frame ${choice}`, value: weights[choice] }]} formatValue={(v) => v.toFixed(4)} />}
    </CheckpointFrame>
  );
}
