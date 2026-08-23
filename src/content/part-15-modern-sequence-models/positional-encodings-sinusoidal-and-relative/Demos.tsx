"use client";

import { useEffect, useState } from "react";
import { MultiCurvePlayground, type CurveLine } from "@/components/viz/MultiCurvePlayground";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  TOKEN_A,
  TOKEN_B,
  contentScore,
  positionAwareScore,
  relativeScore,
  OFFSETS,
} from "@/lib/math-core/positional-encodings-sinusoidal-and-relative";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "positional-encodings-sinusoidal-and-relative";

const ORDERS = [
  { key: "ab", label: "A before B", first: TOKEN_A, second: TOKEN_B },
  { key: "ba", label: "B before A", first: TOKEN_B, second: TOKEN_A },
] as const;

/** Intuition beat: swap which token comes first and watch two scores — one that's supposed to be blind to order, one that isn't. */
export function IntuitionDemo() {
  const [orderKey, setOrderKey] = useState<(typeof ORDERS)[number]["key"]>("ab");
  const order = ORDERS.find((o) => o.key === orderKey)!;
  const withoutPosition = contentScore(order.first, order.second);
  const withPosition = positionAwareScore(0, 1, order.first, order.second);

  return (
    <>
      <div className={styles.buttons}>
        {ORDERS.map((o) => (
          <button key={o.key} type="button" className={o.key === orderKey ? styles.buttonActive : styles.button} onClick={() => setOrderKey(o.key)}>
            {o.label}
          </button>
        ))}
      </div>
      <ContributionBars
        items={[
          { label: "content only (no position)", value: withoutPosition },
          { label: "content + position", value: withPosition },
        ]}
        formatValue={(v) => v.toFixed(3)}
        readout="the top bar never moves when you swap the order — the bottom one does"
      />
    </>
  );
}

const MAX_OFFSET = 20;
const ABSOLUTE_CURVE: CurveLine = {
  points: Array.from({ length: 81 }, (_, i) => {
    const offset = (MAX_OFFSET * i) / 80;
    return { x: offset, y: positionAwareScore(offset, offset + 1) };
  }),
  variant: "fitHighlight",
};
const RELATIVE_CURVE: CurveLine = {
  points: Array.from({ length: 81 }, (_, i) => ({ x: (MAX_OFFSET * i) / 80, y: relativeScore(1) })),
  variant: "true",
};

/** Play beat: slide the sequence's start offset. The sinusoidal score wanders because it reads absolute position; the relative score, keyed only on the gap of 1, never moves. */
export function PlayDemo() {
  return (
    <MultiCurvePlayground
      curves={[RELATIVE_CURVE, ABSOLUTE_CURVE]}
      domain={[0, MAX_OFFSET]}
      rangeDomain={[-2, 3.2]}
      readout={`relative score (distance = 1) stays fixed at ${relativeScore(1).toFixed(2)} no matter where the pair starts; the absolute score keeps changing`}
    />
  );
}

/** Checkpoint: find the sequence-start offset where the wandering sinusoidal score happens to land back on the flat relative score. */
export function PositionalEncodingsCheckpoint() {
  const [offset, setOffset] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const target = relativeScore(1);

  const value = offset === null ? null : positionAwareScore(offset, offset + 1);
  const passed = value !== null && withinTolerance(value, target, 0.05);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Find the offset, among the candidates, where the <strong>sinusoidal</strong> score for a pair one apart lands
          within <strong>0.05</strong> of the <strong>relative</strong> score ({target.toFixed(2)}).
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick an offset to try it"
    >
      <div className={styles.buttons}>
        {OFFSETS.map((o) => (
          <button
            key={o}
            type="button"
            className={o === offset ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setOffset(o);
            }}
          >
            offset {o}
          </button>
        ))}
      </div>
      {value !== null && (
        <ContributionBars
          items={[
            { label: "sinusoidal score", value },
            { label: "relative score (target)", value: target },
          ]}
          formatValue={(v) => v.toFixed(3)}
        />
      )}
    </CheckpointFrame>
  );
}
