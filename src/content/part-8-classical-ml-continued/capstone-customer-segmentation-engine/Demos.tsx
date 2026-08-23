"use client";

import { useEffect, useMemo, useState } from "react";
import { WordEmbeddingSpace } from "@/components/viz/WordEmbeddingSpace";
import { ClusterScatter, type ClusterPoint } from "@/components/viz/ClusterScatter";
import { KernelHeatmap } from "@/components/viz/KernelHeatmap";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  CUSTOMER_LABELS,
  RATINGS,
  MISSING,
  embedCustomers,
  segmentCustomers,
} from "@/lib/math-core/capstone-customer-segmentation-engine";
import { train, predict, totalError } from "@/lib/math-core/collaborative-filtering-and-matrix-factorization";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "capstone-customer-segmentation-engine";
const EMBED_DOMAIN: [number, number] = [-15, 15];
const PRODUCTS = ["X", "Y", "Z"];

const embedding = embedCustomers();
const { assignments } = segmentCustomers(embedding, 2);

function segmentPoints(): ClusterPoint[] {
  return embedding.map((p, i) => ({ ...p, group: assignments[i] }));
}

function ratingGrid(k: number) {
  const factors = train(RATINGS, k, 2000);
  return CUSTOMER_LABELS.map((_, ui) => PRODUCTS.map((_, ii) => Math.round(predict(factors, ui, ii) * 100) / 100));
}

const STAGES = ["1. Embed", "2. Segment", "3. Recommend"] as const;

/** Intuition beat: step through the three stages of the pipeline on the same 6 customers. */
export function IntuitionDemo() {
  const [i, setI] = useState(0);
  const stage = STAGES[i];

  return (
    <>
      <div className={styles.buttons}>
        {STAGES.map((s, idx) => (
          <button key={s} type="button" className={idx === i ? styles.buttonActive : styles.button} onClick={() => setI(idx)}>
            {s}
          </button>
        ))}
      </div>
      {stage === "1. Embed" && (
        <WordEmbeddingSpace
          words={CUSTOMER_LABELS.map((label, idx) => ({ label, x: embedding[idx].x, y: embedding[idx].y }))}
          domain={EMBED_DOMAIN}
          readout="the same fuzzy-graph layout from this part's UMAP chapter, run on 6 customers' raw behavior"
        />
      )}
      {stage === "2. Segment" && (
        <ClusterScatter points={segmentPoints()} domain={EMBED_DOMAIN} readout="k-means++ finds 2 segments purely from the embedded geometry" />
      )}
      {stage === "3. Recommend" && (
        <KernelHeatmap kernel={ratingGrid(2)} width={220} label="matrix factorization fills in every customer's predicted rating for every product" />
      )}
    </>
  );
}

/** Play beat: compare k=1 and k=2 latent factors on the final recommendation grid. */
export function PlayDemo() {
  const [k, setK] = useState(1);
  return (
    <>
      <div className={styles.buttons}>
        <button type="button" className={k === 1 ? styles.buttonActive : styles.button} onClick={() => setK(1)}>
          k=1
        </button>
        <button type="button" className={k === 2 ? styles.buttonActive : styles.button} onClick={() => setK(2)}>
          k=2
        </button>
      </div>
      <KernelHeatmap
        kernel={ratingGrid(k)}
        width={220}
        label={`total error over known ratings: ${totalError(train(RATINGS, k, 2000), RATINGS).toFixed(2)}`}
      />
    </>
  );
}

const ERROR_TARGET = 20;

/** Checkpoint: finish the pipeline — pick enough latent factors that the recommendation stage actually fits the data. */
export function CustomerSegmentationCheckpoint() {
  const [k, setK] = useState(1);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const factors = useMemo(() => train(RATINGS, k, 2000), [k]);
  const err = totalError(factors, RATINGS);
  const passed = err < ERROR_TARGET;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Pick the number of latent factors that gets the recommendation stage&apos;s total error under <strong>{ERROR_TARGET}</strong>.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a k to try it"
    >
      <div className={styles.buttons}>
        <button
          type="button"
          className={k === 1 ? styles.buttonActive : styles.button}
          onClick={() => {
            setHasInteracted(true);
            setK(1);
          }}
        >
          k=1
        </button>
        <button
          type="button"
          className={k === 2 ? styles.buttonActive : styles.button}
          onClick={() => {
            setHasInteracted(true);
            setK(2);
          }}
        >
          k=2
        </button>
      </div>
      <KernelHeatmap
        kernel={ratingGrid(k)}
        width={220}
        label={`error ${err.toFixed(2)} — predicted rating for the missing entry: ${predict(factors, MISSING.user, MISSING.item).toFixed(2)}`}
      />
    </CheckpointFrame>
  );
}
