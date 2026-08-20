"use client";

import { useEffect, useState } from "react";
import { AttentionPlayground } from "@/components/viz/AttentionPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  TOKENS,
  DOMAIN,
  DEFAULT_QUERY,
  TARGET_WEIGHT,
  TARGET_TOKEN,
  attentionWeights,
  attentionContext,
  type Vec2,
} from "@/lib/math-core/attention";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";

const CONCEPT_ID = "attention";

/** Intuition beat: drag the query — watch attention shift toward whichever token it's most aligned with. */
export function IntuitionDemo() {
  const [query, setQuery] = useState<Vec2>(DEFAULT_QUERY);
  const weights = attentionWeights(query);
  const maxWeight = Math.max(...weights);
  const leaders = TOKENS.filter((_, i) => weights[i] > maxWeight - 1e-6);
  const focus =
    leaders.length > 1 ? "attention spread evenly across all three" : `most attention on "${leaders[0].label}"`;
  return (
    <AttentionPlayground
      tokens={TOKENS}
      weights={weights}
      query={query}
      onChangeQuery={setQuery}
      domain={DOMAIN}
      readout={`query = (${query.x.toFixed(1)}, ${query.y.toFixed(1)}) — ${focus}`}
    />
  );
}

/** Play beat: same drag — read off the actual context vector, the weighted blend attention actually produces. */
export function PlayDemo() {
  const [query, setQuery] = useState<Vec2>({ x: 2, y: 0 });
  const weights = attentionWeights(query);
  const context = attentionContext(query);
  return (
    <AttentionPlayground
      tokens={TOKENS}
      weights={weights}
      query={query}
      onChangeQuery={setQuery}
      domain={DOMAIN}
      readout={`weights: the=${weights[0].toFixed(2)}, cat=${weights[1].toFixed(2)}, sat=${weights[2].toFixed(2)} — context = (${context.x.toFixed(2)}, ${context.y.toFixed(2)})`}
    />
  );
}

/** Checkpoint: move the query until one token dominates the attention distribution. */
export function AttentionCheckpoint() {
  const [query, setQuery] = useState<Vec2>(DEFAULT_QUERY);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const weights = attentionWeights(query);
  const catIndex = TOKENS.findIndex((t) => t.label === TARGET_TOKEN);

  const passed = weights[catIndex] > TARGET_WEIGHT;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Drag the query until <strong>&ldquo;{TARGET_TOKEN}&rdquo;</strong> receives more than{" "}
          <strong>{TARGET_WEIGHT}</strong> of the total attention weight.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag the query to try it"
    >
      <AttentionPlayground
        tokens={TOKENS}
        weights={weights}
        query={query}
        onChangeQuery={(next) => {
          setHasInteracted(true);
          setQuery(next);
        }}
        domain={DOMAIN}
        readout={`"${TARGET_TOKEN}" weight = ${weights[catIndex].toFixed(3)}`}
      />
    </CheckpointFrame>
  );
}
