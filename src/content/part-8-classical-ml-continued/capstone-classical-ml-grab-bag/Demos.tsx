"use client";

import { useEffect, useState } from "react";
import { ClusterScatter } from "@/components/viz/ClusterScatter";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { POINTS, QUERY, DOMAIN, knnPrediction, naiveBayesClassify, dbscanLabels } from "@/lib/math-core/capstone-classical-ml-grab-bag";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "capstone-classical-ml-grab-bag";
const LENSES = ["kNN", "Naive Bayes", "DBSCAN"] as const;
type Lens = (typeof LENSES)[number];

const labelPoints = POINTS.map((p) => ({ x: p.x, y: p.y, group: p.label === "A" ? 0 : 1 }));
const dbscanPoints = POINTS.map((p, i) => ({ x: p.x, y: p.y, group: dbscanLabels()[i] }));

function readoutFor(lens: Lens): string {
  if (lens === "kNN") return `k=1 predicts "${knnPrediction(1)}" (fooled); k=3 predicts "${knnPrediction(3)}" (correct)`;
  if (lens === "Naive Bayes") {
    const r = naiveBayesClassify();
    return `predicts "${r.prediction}" — P(B) = ${(r.posteriors.B * 100).toFixed(0)}%, not fooled at all`;
  }
  return "clusters purely by density — no labels used, no query involved";
}

/** Intuition beat: the same messy dataset, viewed through three different classical-ML lenses. */
export function IntuitionDemo() {
  const [lens, setLens] = useState<Lens>("kNN");
  const points = lens === "DBSCAN" ? dbscanPoints : labelPoints;
  return (
    <>
      <div className={styles.buttons}>
        {LENSES.map((l) => (
          <button type="button" key={l} className={l === lens ? styles.buttonActive : styles.button} onClick={() => setLens(l)}>
            {l}
          </button>
        ))}
      </div>
      <ClusterScatter points={points} domain={DOMAIN} readout={readoutFor(lens)} />
    </>
  );
}

/** Play beat: focus on the one point every lens has to deal with — the noisy A stray near the B cluster. */
export function PlayDemo() {
  const dbLabels = dbscanLabels();
  return (
    <>
      <ClusterScatter points={labelPoints} domain={DOMAIN} readout={`query at (${QUERY.x}, ${QUERY.y}) — true labels shown; the noisy point is labeled A but sits inside B's territory`} />
      <ClusterScatter points={dbscanPoints} domain={DOMAIN} readout={`DBSCAN's own clusters — the noisy point joins cluster ${dbLabels[4]}, same as the real B points`} />
    </>
  );
}

/** Checkpoint: pick the lens that groups the noisy point with its true spatial neighbors, ignoring its label entirely. */
export function GrabBagCheckpoint() {
  const [choice, setChoice] = useState<Lens | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const passed = choice === "DBSCAN";

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Pick the lens that groups the noisy point with its <strong>true spatial neighbors</strong>, entirely ignoring the label it was given.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a lens to try it"
    >
      <div className={styles.buttons}>
        {LENSES.map((l) => (
          <button
            type="button"
            key={l}
            className={choice === l ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setChoice(l);
            }}
          >
            {l}
          </button>
        ))}
      </div>
      <ClusterScatter points={choice === "DBSCAN" ? dbscanPoints : labelPoints} domain={DOMAIN} readout={choice ? readoutFor(choice) : "pick a lens"} />
    </CheckpointFrame>
  );
}
