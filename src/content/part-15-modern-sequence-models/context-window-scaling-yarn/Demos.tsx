"use client";

import { useEffect, useState } from "react";
import { MultiCurvePlayground, type CurveLine } from "@/components/viz/MultiCurvePlayground";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  ORIGINAL_LEN,
  TARGET_POS,
  SCALES,
  effectivePosition,
} from "@/lib/math-core/context-window-scaling-yarn";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "context-window-scaling-yarn";

/** Intuition beat: pick a scaling factor and watch the slow dimension's effective position collapse back toward the trained range, while the fast dimension never moves. */
export function IntuitionDemo() {
  const [scale, setScale] = useState(1);
  const fast = effectivePosition(TARGET_POS, 0, scale);
  const slow = effectivePosition(TARGET_POS, 1, scale);

  return (
    <>
      <div className={styles.buttons}>
        {SCALES.map((s) => (
          <button key={s} type="button" className={s === scale ? styles.buttonActive : styles.button} onClick={() => setScale(s)}>
            {s}x
          </button>
        ))}
      </div>
      <ContributionBars
        items={[
          { label: "fast dim — effective position", value: fast },
          { label: "slow dim — effective position", value: slow },
        ]}
        formatValue={(v) => v.toFixed(1)}
        max={TARGET_POS}
        readout={`position ${TARGET_POS}, scale ${scale}x — trained context was only ${ORIGINAL_LEN} positions long`}
      />
    </>
  );
}

const SLOW_CURVE: CurveLine = {
  points: Array.from({ length: 71 }, (_, i) => {
    const scale = 1 + (7 * i) / 70;
    return { x: scale, y: effectivePosition(TARGET_POS, 1, scale) };
  }),
  variant: "fitHighlight",
};
const FAST_CURVE: CurveLine = {
  points: Array.from({ length: 71 }, (_, i) => {
    const scale = 1 + (7 * i) / 70;
    return { x: scale, y: effectivePosition(TARGET_POS, 0, scale) };
  }),
  variant: "true",
};

/** Play beat: slide the scaling factor continuously from 1x to 8x. The slow dimension's effective position glides down toward ORIGINAL_LEN; the fast one stays flat the whole way. */
export function PlayDemo() {
  return (
    <MultiCurvePlayground
      curves={[FAST_CURVE, SLOW_CURVE]}
      domain={[1, 8]}
      rangeDomain={[0, TARGET_POS + 5]}
      readout={`at scale 8x, the slow dimension's effective position lands exactly on ${ORIGINAL_LEN} — the edge of the trained context`}
    />
  );
}

const TARGET = ORIGINAL_LEN;

/** Checkpoint: pick the scaling factor that remaps the slow dimension's effective position at TARGET_POS back down to exactly the trained context length. */
export function YarnCheckpoint() {
  const [scale, setScale] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const value = scale === null ? null : effectivePosition(TARGET_POS, 1, scale);
  const passed = value !== null && withinTolerance(value, TARGET, 0.5);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          At position {TARGET_POS}, find the scaling factor, among the candidates, that brings the{" "}
          <strong>slow</strong> dimension&apos;s effective position back down to within <strong>0.5</strong>{" "}
          of the trained context length ({TARGET}).
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a scaling factor to try it"
    >
      <div className={styles.buttons}>
        {SCALES.map((s) => (
          <button
            key={s}
            type="button"
            className={s === scale ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setScale(s);
            }}
          >
            {s}x
          </button>
        ))}
      </div>
      {value !== null && (
        <ContributionBars
          items={[
            { label: "slow dim — effective position", value },
            { label: "trained context length (target)", value: TARGET },
          ]}
          formatValue={(v) => v.toFixed(1)}
          max={TARGET_POS}
        />
      )}
    </CheckpointFrame>
  );
}
