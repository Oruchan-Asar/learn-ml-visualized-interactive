"use client";

import { useEffect, useState } from "react";
import { MultiCurvePlayground, type CurveLine } from "@/components/viz/MultiCurvePlayground";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { ROWS, X1_GRID, iceCurve, pdpCurve, iceSpreadAt } from "@/lib/math-core/partial-dependence-plots";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "partial-dependence-plots";
const ROW_LABELS = ROWS.map((r) => `x2=${r.x2}`);

function toCurve(values: number[], variant: CurveLine["variant"]): CurveLine {
  return { points: X1_GRID.map((x1, i) => ({ x: x1, y: values[i] })), variant };
}

/** Intuition beat: toggle one row's ICE curve against the flat PDP average. */
export function IntuitionDemo() {
  const [rowIndex, setRowIndex] = useState(0);
  const pdp = pdpCurve();
  const ice = iceCurve(ROWS[rowIndex]);
  return (
    <>
      <div className={styles.buttons}>
        {ROWS.map((r, i) => (
          <button key={i} type="button" className={i === rowIndex ? styles.buttonActive : styles.button} onClick={() => setRowIndex(i)}>
            {ROW_LABELS[i]}
          </button>
        ))}
      </div>
      <MultiCurvePlayground
        curves={[toCurve(pdp, "true"), toCurve(ice, "fitHighlight")]}
        domain={[-2, 2]}
        rangeDomain={[-4, 4]}
        readout={`PDP (dashed, flat at 0) vs this row's ICE curve (slope ${ROWS[rowIndex].x2})`}
      />
    </>
  );
}

/** Play beat: every row's ICE curve at once, fanning out around a PDP that never moves. */
export function PlayDemo() {
  const pdp = pdpCurve();
  const curves: CurveLine[] = [toCurve(pdp, "true"), ...ROWS.map((r) => toCurve(iceCurve(r), "fit"))];
  return (
    <MultiCurvePlayground
      curves={curves}
      domain={[-2, 2]}
      rangeDomain={[-4, 4]}
      readout="four individual curves, four different slopes — the average (dashed) stays flat at zero the entire time"
    />
  );
}

/** Checkpoint: find the x1 grid point where the ICE spread across rows is largest, despite the PDP being flat everywhere. */
export function PDPCheckpoint() {
  const [gridIndex, setGridIndex] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const spread = gridIndex === null ? null : iceSpreadAt(gridIndex);
  const maxSpread = Math.max(...X1_GRID.map((_, i) => iceSpreadAt(i)));
  const passed = spread !== null && spread === maxSpread;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the value of x1, among the five grid points, where the rows <strong>disagree the most</strong> — even though the PDP is flat everywhere.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick an x1 value to try it"
    >
      <div className={styles.buttons}>
        {X1_GRID.map((x1, i) => (
          <button
            key={x1}
            type="button"
            className={i === gridIndex ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setGridIndex(i);
            }}
          >
            x1={x1}
          </button>
        ))}
      </div>
      {spread !== null && <ContributionBars items={[{ label: "ICE spread", value: spread }]} formatValue={(v) => v.toFixed(1)} />}
    </CheckpointFrame>
  );
}
