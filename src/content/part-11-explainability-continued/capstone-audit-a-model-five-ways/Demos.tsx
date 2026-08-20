"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { MultiCurvePlayground, type CurveLine } from "@/components/viz/MultiCurvePlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  anchorsAudit,
  treeAudit,
  shapleyAudit,
  integratedGradientsAudit,
  pdpAudit,
} from "@/lib/math-core/capstone-audit-a-model-five-ways";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "capstone-audit-a-model-five-ways";
const METHODS = ["tree importance", "Shapley values", "integrated gradients"] as const;

function x1x2Bars(x1: number, x2: number, formatValue?: (v: number) => string) {
  return { items: [{ label: "x1", value: x1 }, { label: "x2", value: x2 }], formatValue: formatValue ?? ((v: number) => v.toFixed(3)) };
}

/** Intuition beat: three methods, the same instance, three different x1-vs-x2 verdicts. */
export function IntuitionDemo() {
  const [methodIndex, setMethodIndex] = useState(0);
  const tree = treeAudit();
  const shapley = shapleyAudit();
  const ig = integratedGradientsAudit();

  const bars =
    methodIndex === 0
      ? x1x2Bars(tree.raw.x1, tree.raw.x2)
      : methodIndex === 1
        ? x1x2Bars(shapley.shapleyX1, shapley.shapleyX2)
        : x1x2Bars(ig.ig1, ig.ig2);

  return (
    <>
      <div className={styles.buttons}>
        {METHODS.map((m, i) => (
          <button key={m} type="button" className={i === methodIndex ? styles.buttonActive : styles.button} onClick={() => setMethodIndex(i)}>
            {m}
          </button>
        ))}
      </div>
      <ContributionBars items={bars.items} formatValue={bars.formatValue} readout="same model, same instance (x1=5, x2=5) — does this method say x1 or x2 mattered more?" />
    </>
  );
}

/** Play beat: every method's x1-vs-x2 verdict, side by side, plus the PDP curve and anchor precision. */
export function PlayDemo() {
  const tree = treeAudit();
  const shapley = shapleyAudit();
  const ig = integratedGradientsAudit();
  const anchors = anchorsAudit();
  const pdp = pdpAudit();
  const pdpCurve: CurveLine = { points: pdp.map((row) => ({ x: row.x1, y: row.avg })), variant: "fitHighlight" };

  return (
    <>
      <ContributionBars
        items={[
          { label: "tree: x1", value: tree.raw.x1 },
          { label: "tree: x2", value: tree.raw.x2 },
          { label: "Shapley: x1", value: shapley.shapleyX1 },
          { label: "Shapley: x2", value: shapley.shapleyX2 },
          { label: "IG: x1", value: ig.ig1 },
          { label: "IG: x2", value: ig.ig2 },
        ]}
        formatValue={(v) => v.toFixed(3)}
        readout={`anchor precision: single-condition ${anchors.single.precision.toFixed(2)} vs conjunction ${anchors.conjunction.precision.toFixed(2)}`}
      />
      <MultiCurvePlayground
        curves={[pdpCurve]}
        domain={[0, 6]}
        rangeDomain={[0, 1]}
        readout="PDP: average predicted probability as x1 sweeps, across three representative x2 rows"
      />
    </>
  );
}

/** Checkpoint: find the method whose verdict disagrees with the other two about x1 vs x2. */
export function AuditCheckpoint() {
  const [methodIndex, setMethodIndex] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const passed = methodIndex === 0; // tree importance is the one that favors x2 over x1

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the one method, among the three, whose verdict on <strong>x1 vs x2</strong> disagrees with the other two.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a method to try it"
    >
      <div className={styles.buttons}>
        {METHODS.map((m, i) => (
          <button
            key={m}
            type="button"
            className={i === methodIndex ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setMethodIndex(i);
            }}
          >
            {m}
          </button>
        ))}
      </div>
    </CheckpointFrame>
  );
}
