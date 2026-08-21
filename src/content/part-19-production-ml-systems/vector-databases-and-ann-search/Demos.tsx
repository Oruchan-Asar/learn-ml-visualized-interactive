"use client";

import { useEffect, useState } from "react";
import { WordEmbeddingSpace } from "@/components/viz/WordEmbeddingSpace";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  POINTS,
  TOTAL_POINTS,
  bruteForceNearest,
  annNearest,
  QUERY_HIT,
  QUERY_MISS,
  QUERY_CHECKPOINT,
  CHECKPOINT_CANDIDATES,
} from "@/lib/math-core/vector-databases-and-ann-search";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";
import annStyles from "./AnnSearch.module.css";

const CONCEPT_ID = "vector-databases-and-ann-search";
const DOMAIN: [number, number] = [-1, 13];

const SHAPED_POINTS = POINTS.map((p) => ({
  label: p.label,
  x: p.x,
  y: p.y,
  shape: (p.label.startsWith("b") ? "square" : "circle") as "circle" | "square",
}));

/** Intuition beat: switch between a query deep inside a cluster and one near the boundary, watching when the approximate search stops matching brute force. */
export function IntuitionDemo() {
  const [mode, setMode] = useState<"hit" | "miss">("hit");
  const query = mode === "hit" ? QUERY_HIT : QUERY_MISS;
  const brute = bruteForceNearest(query);
  const ann = annNearest(query);
  const isHit = ann.label === brute.label;

  return (
    <>
      <div className={styles.buttons}>
        <button type="button" className={mode === "hit" ? styles.buttonActive : styles.button} onClick={() => setMode("hit")}>
          query deep in a cluster
        </button>
        <button type="button" className={mode === "miss" ? styles.buttonActive : styles.button} onClick={() => setMode("miss")}>
          query near the boundary
        </button>
      </div>
      <WordEmbeddingSpace
        words={SHAPED_POINTS}
        domain={DOMAIN}
        nearestLabel={ann.label}
        extraPoint={{ x: query.x, y: query.y, label: "query" }}
        readout={
          <div className={annStyles.readout}>
            <p>Query assigned to cluster {ann.assigned} — search checks {ann.comparisons} of {TOTAL_POINTS} points.</p>
            <p>
              Approximate search: {ann.label} (distance {ann.distance})
            </p>
            <p>
              Brute force: {brute.label} (distance {brute.distance})
            </p>
            <p className={isHit ? annStyles.hit : annStyles.miss}>{isHit ? "Match — same answer" : "Miss — approximate search picked the wrong point"}</p>
          </div>
        }
      />
    </>
  );
}

/** Play beat: both queries side by side, contrasting comparisons saved against whether the answer actually matches. */
export function PlayDemo() {
  const rows = [
    { label: "deep in cluster", query: QUERY_HIT },
    { label: "near boundary", query: QUERY_MISS },
  ];

  return (
    <div className={annStyles.table}>
      {rows.map((row) => {
        const brute = bruteForceNearest(row.query);
        const ann = annNearest(row.query);
        const isHit = ann.label === brute.label;
        return (
          <p key={row.label}>
            <strong>{row.label}</strong>: ANN checks {ann.comparisons}/{TOTAL_POINTS} points, reports {ann.label}
            {" (d="}
            {ann.distance}
            {"). Brute force reports "}
            {brute.label} (d={brute.distance}) —{" "}
            <span className={isHit ? annStyles.hit : annStyles.miss}>{isHit ? "match" : "miss"}</span>
          </p>
        );
      })}
    </div>
  );
}

/** Checkpoint: a fresh boundary query. The approximate search will confidently report the wrong point — find the true nearest neighbor by brute force. */
export function AnnCheckpoint() {
  const [chosen, setChosen] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const trueAnswer = bruteForceNearest(QUERY_CHECKPOINT).label;
  const passed = chosen === trueAnswer;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  const annAnswer = annNearest(QUERY_CHECKPOINT);

  return (
    <CheckpointFrame
      instructions={
        <>
          This query sits near the cluster boundary. The index reports <strong>{annAnswer.label}</strong> as
          the nearest neighbor — but that&apos;s only the best match within the cluster it searched. Find the
          actual nearest neighbor, considering every point in the index.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a point to try it"
    >
      <WordEmbeddingSpace
        words={SHAPED_POINTS}
        domain={DOMAIN}
        extraPoint={{ x: QUERY_CHECKPOINT.x, y: QUERY_CHECKPOINT.y, label: "query" }}
      />
      <div className={annStyles.candidateList}>
        {CHECKPOINT_CANDIDATES.map((label) => (
          <button
            key={label}
            type="button"
            className={label === chosen ? annStyles.candidateActive : annStyles.candidate}
            onClick={() => {
              setHasInteracted(true);
              setChosen(label);
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </CheckpointFrame>
  );
}
