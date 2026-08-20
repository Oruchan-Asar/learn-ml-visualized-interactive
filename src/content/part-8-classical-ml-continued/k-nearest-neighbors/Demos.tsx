"use client";

import { useEffect, useState } from "react";
import { ContourPlayground } from "@/components/viz/ContourPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { DATA, DOMAIN, QUERY, rankByDistance, predict, voteCounts } from "@/lib/math-core/k-nearest-neighbors";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "k-nearest-neighbors";
// A nonzero constant makes every sampled cell normalize to 1 (opacity 0) — an invisible background,
// since this reuse of ContourPlayground has no scalar field to shade, only labeled points to show.
const FLAT_FN = () => 1;
const FLAT_GRADIENT = () => ({ x: 0, y: 0 });
const K_OPTIONS = [1, 3, 5, 7];

function readoutFor(query: { x: number; y: number }, k: number): string {
  const votes = voteCounts(query, k);
  const voteStr = Object.entries(votes).map(([l, c]) => `${l}:${c}`).join(", ");
  return `k=${k} → predicts "${predict(query, k)}" (votes ${voteStr})`;
}

/** Intuition beat: toggle k and watch a single noisy neighbor's influence get outvoted. */
export function IntuitionDemo() {
  const [query, setQuery] = useState(QUERY);
  const [k, setK] = useState(1);

  return (
    <>
      <div className={styles.buttons}>
        {K_OPTIONS.map((opt) => (
          <button type="button" key={opt} className={opt === k ? styles.buttonActive : styles.button} onClick={() => setK(opt)}>
            k={opt}
          </button>
        ))}
      </div>
      <ContourPlayground
        fn={FLAT_FN}
        gradient={FLAT_GRADIENT}
        domain={DOMAIN}
        value={query}
        onChange={setQuery}
        labeledPoints={DATA}
        readout={readoutFor(query, k)}
      />
    </>
  );
}

/** Play beat: see the full ranked neighbor list, not just the winner. */
export function PlayDemo() {
  const [query, setQuery] = useState(QUERY);
  const ranked = rankByDistance(query).slice(0, 5);
  return (
    <ContourPlayground
      fn={FLAT_FN}
      gradient={FLAT_GRADIENT}
      domain={DOMAIN}
      value={query}
      onChange={setQuery}
      labeledPoints={DATA}
      readout={`nearest 5: ${ranked.map((r) => `${r.point.label}(${r.d.toFixed(2)})`).join(", ")}`}
    />
  );
}

/** Checkpoint: pick a k whose prediction actually differs from k=1's — proof that k matters. */
export function KnnCheckpoint() {
  const [query, setQuery] = useState(QUERY);
  const [k, setK] = useState(1);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const passed = k !== 1 && predict(query, k) !== predict(query, 1);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Pick a <strong>k</strong> whose prediction actually disagrees with k=1&apos;s.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a k to try it"
    >
      <div className={styles.buttons}>
        {K_OPTIONS.map((opt) => (
          <button
            type="button"
            key={opt}
            className={opt === k ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setK(opt);
            }}
          >
            k={opt}
          </button>
        ))}
      </div>
      <ContourPlayground
        fn={FLAT_FN}
        gradient={FLAT_GRADIENT}
        domain={DOMAIN}
        value={query}
        onChange={(next) => {
          setHasInteracted(true);
          setQuery(next);
        }}
        labeledPoints={DATA}
        readout={readoutFor(query, k)}
      />
    </CheckpointFrame>
  );
}
