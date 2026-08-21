"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { METRICS, gap, GROUP_A, GROUP_B, baseRate } from "@/lib/math-core/fairness-metrics-and-bias-auditing";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "fairness-metrics-and-bias-auditing";

/** Intuition beat: pick a fairness definition and see whether group A and group B satisfy it equally. */
export function IntuitionDemo() {
  const [metricIndex, setMetricIndex] = useState(0);
  const metric = METRICS[metricIndex];

  return (
    <>
      <div className={styles.buttons}>
        {METRICS.map((m, i) => (
          <button key={m.key} type="button" className={i === metricIndex ? styles.buttonActive : styles.button} onClick={() => setMetricIndex(i)}>
            {m.label}
          </button>
        ))}
      </div>
      <ContributionBars
        items={[
          { label: "group A", value: metric.compute(GROUP_A) },
          { label: "group B", value: metric.compute(GROUP_B) },
        ]}
        formatValue={(v) => v.toFixed(3)}
        max={1}
        readout={`gap = ${gap(metric).toFixed(3)} — base rates: A = ${baseRate(GROUP_A).toFixed(2)}, B = ${baseRate(GROUP_B).toFixed(2)}`}
      />
    </>
  );
}

/** Play beat: all three metrics' gaps at once — the same classifier, the same data, three different verdicts on how unequal it is. */
export function PlayDemo() {
  return (
    <ContributionBars
      items={METRICS.map((m) => ({ label: m.label, value: gap(m) }))}
      formatValue={(v) => v.toFixed(3)}
      readout="none of these gaps are zero, and none of them agree on which is largest by accident — the groups' base rates genuinely differ"
    />
  );
}

/** Checkpoint: find the metric, among the three, with the LARGEST disparity between groups. */
export function FairnessCheckpoint() {
  const [chosen, setChosen] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const gaps = METRICS.map((m) => gap(m));
  const maxGap = Math.max(...gaps);
  const chosenMetric = METRICS.find((m) => m.key === chosen) ?? null;
  const passed = chosenMetric !== null && gap(chosenMetric) === maxGap;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the fairness metric, among the three, that shows the <strong>largest</strong> disparity between the two groups.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a metric to try it"
    >
      <div className={styles.buttons}>
        {METRICS.map((m) => (
          <button
            key={m.key}
            type="button"
            className={m.key === chosen ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setChosen(m.key);
            }}
          >
            {m.label}
          </button>
        ))}
      </div>
      {chosenMetric && <ContributionBars items={[{ label: "gap", value: gap(chosenMetric) }]} formatValue={(v) => v.toFixed(3)} max={maxGap} />}
    </CheckpointFrame>
  );
}
