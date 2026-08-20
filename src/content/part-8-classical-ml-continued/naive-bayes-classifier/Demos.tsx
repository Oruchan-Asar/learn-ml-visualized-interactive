"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { VOCAB, LABELS, NEW_MESSAGE, classify, type Word } from "@/lib/math-core/naive-bayes-classifier";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "naive-bayes-classifier";

function posteriorBars(posteriors: Record<string, number>) {
  return LABELS.map((l) => ({ label: `P(${l})`, value: posteriors[l] }));
}

/** Intuition beat: toggle smoothing on the fixed "free, money" message and watch the confidence swing. */
export function IntuitionDemo() {
  const [smoothed, setSmoothed] = useState(false);
  const result = classify(NEW_MESSAGE, smoothed);
  return (
    <>
      <div className={styles.buttons}>
        <button type="button" className={!smoothed ? styles.buttonActive : styles.button} onClick={() => setSmoothed(false)}>
          No smoothing
        </button>
        <button type="button" className={smoothed ? styles.buttonActive : styles.button} onClick={() => setSmoothed(true)}>
          Laplace smoothing
        </button>
      </div>
      <ContributionBars items={posteriorBars(result.posteriors)} readout={`message: "free, money" — predicts "${result.prediction}"`} />
    </>
  );
}

/** Play beat: build your own message by toggling which words are present, always with smoothing on. */
export function PlayDemo() {
  const [present, setPresent] = useState<Set<Word>>(new Set(["meeting"]));
  const message = [...present];
  const result = classify(message, true);

  const toggle = (word: Word) => {
    setPresent((prev) => {
      const next = new Set(prev);
      if (next.has(word)) next.delete(word);
      else next.add(word);
      return next;
    });
  };

  return (
    <>
      <div className={styles.buttons}>
        {VOCAB.map((w) => (
          <button type="button" key={w} className={present.has(w) ? styles.buttonActive : styles.button} onClick={() => toggle(w)}>
            {w}
          </button>
        ))}
      </div>
      <ContributionBars items={posteriorBars(result.posteriors)} readout={`message: "${message.join(", ") || "(empty)"}" — predicts "${result.prediction}"`} />
    </>
  );
}

/** Checkpoint: without smoothing, reach total (over 99%) overconfidence on the fixed message. */
export function NaiveBayesCheckpoint() {
  const [smoothed, setSmoothed] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const result = classify(NEW_MESSAGE, smoothed);
  const passed = !smoothed && result.posteriors.spam > 0.99;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the setting where the model claims more than <strong>99%</strong> certainty — from a single missing training example, not real evidence.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Toggle smoothing to try it"
    >
      <div className={styles.buttons}>
        <button
          type="button"
          className={!smoothed ? styles.buttonActive : styles.button}
          onClick={() => {
            setHasInteracted(true);
            setSmoothed(false);
          }}
        >
          No smoothing
        </button>
        <button
          type="button"
          className={smoothed ? styles.buttonActive : styles.button}
          onClick={() => {
            setHasInteracted(true);
            setSmoothed(true);
          }}
        >
          Laplace smoothing
        </button>
      </div>
      <ContributionBars items={posteriorBars(result.posteriors)} readout={`P(spam) = ${(result.posteriors.spam * 100).toFixed(1)}%`} />
    </CheckpointFrame>
  );
}
