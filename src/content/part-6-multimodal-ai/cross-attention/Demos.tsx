"use client";

import { useEffect, useState } from "react";
import { AttentionPlayground } from "@/components/viz/AttentionPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { PATCHES, DOMAIN, DEFAULT_QUERY, attentionWeights, attentionContext } from "@/lib/math-core/cross-attention";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";

const CONCEPT_ID = "cross-attention";

/** Intuition beat: drag the text token's query, watch it attend over fixed image patches instead of other text. */
export function IntuitionDemo() {
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const weights = attentionWeights(query);
  return (
    <AttentionPlayground
      tokens={PATCHES}
      weights={weights}
      query={query}
      onChangeQuery={setQuery}
      domain={DOMAIN}
      readout={`weights: sky=${weights[0].toFixed(2)}, ground=${weights[1].toFixed(2)}, dog=${weights[2].toFixed(2)}`}
    />
  );
}

/** Play beat: watch the resulting context vector — a blend of image patches, conditioned on the text query. */
export function PlayDemo() {
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const weights = attentionWeights(query);
  const context = attentionContext(query);
  return (
    <AttentionPlayground
      tokens={PATCHES}
      weights={weights}
      query={query}
      onChangeQuery={setQuery}
      domain={DOMAIN}
      readout={`context = (${context.x.toFixed(2)}, ${context.y.toFixed(2)}) — a blend, not any single patch`}
    />
  );
}

/** Checkpoint: drag the query until the sky patch dominates the attention weights. */
export function CrossAttentionCheckpoint() {
  const [query, setQuery] = useState({ x: 0, y: 0 });
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const weights = attentionWeights(query);
  const passed = weights[0] > 0.7;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Drag the query until the <strong>sky patch</strong> receives more than <strong>0.7</strong> of the attention weight.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag the query to try it"
    >
      <AttentionPlayground
        tokens={PATCHES}
        weights={weights}
        query={query}
        onChangeQuery={(next) => {
          setHasInteracted(true);
          setQuery(next);
        }}
        domain={DOMAIN}
        readout={`sky weight: ${weights[0].toFixed(2)}`}
      />
    </CheckpointFrame>
  );
}
