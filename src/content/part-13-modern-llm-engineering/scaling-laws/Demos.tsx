"use client";

import { useEffect, useState } from "react";
import { MultiCurvePlayground, type CurveLine } from "@/components/viz/MultiCurvePlayground";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  TRAIN_SIZES,
  TRAIN_LOSSES,
  fitScalingLaw,
  predictLossLogLog,
  fitRawLinear,
  predictLossRawLinear,
  trueLoss,
  TEST_SIZE,
} from "@/lib/math-core/scaling-laws";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "scaling-laws";
const METHODS = ["fit in log-log space", "fit on raw values"] as const;

const LOG_FIT = fitScalingLaw();
const RAW_FIT = fitRawLinear();
const LOG_CURVE: CurveLine = {
  points: Array.from({ length: 50 }, (_, i) => {
    const logN = (i / 49) * Math.log(400);
    return { x: logN, y: LOG_FIT.intercept + LOG_FIT.slope * logN };
  }),
  variant: "fitHighlight",
};
const TRAIN_POINTS = TRAIN_SIZES.map((n, i) => ({ x: Math.log(n), y: Math.log(TRAIN_LOSSES[i]) }));

/** Intuition beat: toggle between fitting in log-log space and fitting the raw numbers directly. */
export function IntuitionDemo() {
  const [methodIndex, setMethodIndex] = useState(0);
  const predicted = methodIndex === 0 ? predictLossLogLog(LOG_FIT, TEST_SIZE) : predictLossRawLinear(RAW_FIT, TEST_SIZE);
  const actual = trueLoss(TEST_SIZE);
  return (
    <>
      <div className={styles.buttons}>
        {METHODS.map((m, i) => (
          <button key={m} type="button" className={i === methodIndex ? styles.buttonActive : styles.button} onClick={() => setMethodIndex(i)}>
            {m}
          </button>
        ))}
      </div>
      <ContributionBars
        items={[
          { label: "predicted loss at N=100", value: predicted },
          { label: "true loss at N=100", value: actual },
        ]}
        formatValue={(v) => v.toFixed(2)}
        readout={`fit only ever saw sizes 1, 4, 9, 16 — N=100 was never trained`}
      />
    </>
  );
}

/** Play beat: the log-log line through the training points, extended out to the untested size. */
export function PlayDemo() {
  return (
    <MultiCurvePlayground
      curves={[LOG_CURVE]}
      domain={[0, Math.log(400)]}
      rangeDomain={[0, 5]}
      scatterPoints={[...TRAIN_POINTS, { x: Math.log(TEST_SIZE), y: Math.log(trueLoss(TEST_SIZE)) }]}
      readout="log(N) vs log(loss): the 4 training points and the untested N=100 point all fall exactly on one line"
    />
  );
}

/** Checkpoint: find the method whose prediction at N=100 is actually a valid, non-negative loss. */
export function ScalingLawsCheckpoint() {
  const [methodIndex, setMethodIndex] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const predicted = methodIndex === null ? null : methodIndex === 0 ? predictLossLogLog(LOG_FIT, TEST_SIZE) : predictLossRawLinear(RAW_FIT, TEST_SIZE);
  const passed = predicted !== null && predicted > 0;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the fitting method whose prediction at N=100 is a <strong>valid, non-negative</strong> loss.</>}
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
      {predicted !== null && (
        <ContributionBars
          items={[{ label: "predicted loss", value: predicted }]}
          formatValue={(v) => v.toFixed(2)}
          max={Math.max(Math.abs(predictLossLogLog(LOG_FIT, TEST_SIZE)), Math.abs(predictLossRawLinear(RAW_FIT, TEST_SIZE)))}
        />
      )}
    </CheckpointFrame>
  );
}
