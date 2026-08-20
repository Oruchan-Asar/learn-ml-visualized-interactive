"use client";

import { useEffect, useState } from "react";
import { AttentionPlayground } from "@/components/viz/AttentionPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { PATCHES, DOMAIN, attentionWeights, answerQuestion, rankAnswers } from "@/lib/math-core/vlm-assembled";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";

const CONCEPT_ID = "vision-language-models-assembled";

/** Intuition beat: drag the question's query, watch the full pipeline answer with the nearest matching label. */
export function IntuitionDemo() {
  const [query, setQuery] = useState({ x: 2, y: 0 });
  const weights = attentionWeights(query);
  const result = answerQuestion(query);
  return (
    <AttentionPlayground
      tokens={PATCHES}
      weights={weights}
      query={query}
      onChangeQuery={setQuery}
      domain={DOMAIN}
      readout={`answer: "${result.answer.label}" — context is ${result.distanceToAnswer.toFixed(2)} units from that prototype`}
    />
  );
}

/** Play beat: see every answer ranked by distance, not just the winner. */
export function PlayDemo() {
  const [query, setQuery] = useState({ x: 0, y: 2 });
  const weights = attentionWeights(query);
  const ranked = rankAnswers(query);
  return (
    <AttentionPlayground
      tokens={PATCHES}
      weights={weights}
      query={query}
      onChangeQuery={setQuery}
      domain={DOMAIN}
      readout={`ranked answers: ${ranked.map((r) => `${r.label} (${r.d.toFixed(2)})`).join(", ")}`}
    />
  );
}

/** Checkpoint: drag the query until the pipeline answers "dog." */
export function VlmCheckpoint() {
  const [query, setQuery] = useState({ x: 2, y: 0 });
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const weights = attentionWeights(query);
  const result = answerQuestion(query);
  const passed = result.answer.label === "dog";

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Drag the query until the pipeline&apos;s answer becomes <strong>&ldquo;dog.&rdquo;</strong></>}
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
        readout={`current answer: "${result.answer.label}"`}
      />
    </CheckpointFrame>
  );
}
