"use client";

import { useEffect, useState } from "react";
import { MultiCurvePlayground, type CurveLine } from "@/components/viz/MultiCurvePlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { fitTrend, fitSeason, predictTrend, forecast, TIMES, SERIES } from "@/lib/math-core/time-series-forecasting";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "time-series-forecasting";
const DOMAIN: [number, number] = [0, 12];
const RANGE_DOMAIN: [number, number] = [5, 40];
const FORECAST_TIMES = [8, 9, 10, 11];

const FIT = fitTrend();
const SEASON = fitSeason(FIT);
const TREND_LINE: CurveLine = { points: [{ x: 0, y: predictTrend(FIT, 0) }, { x: 11, y: predictTrend(FIT, 11) }], variant: "fit" };
const RECONSTRUCTION: CurveLine = {
  points: Array.from({ length: 12 }, (_, t) => ({ x: t, y: forecast(FIT, SEASON, t) })),
  variant: "fitHighlight",
};
const SCATTER = TIMES.map((t, i) => ({ x: t, y: SERIES[i] }));

/** Intuition beat: the raw series against its fitted trend line — a straight line ignoring the season entirely. */
export function IntuitionDemo() {
  return (
    <MultiCurvePlayground
      curves={[TREND_LINE]}
      domain={DOMAIN}
      rangeDomain={RANGE_DOMAIN}
      scatterPoints={SCATTER}
      readout={`fitted trend: y = ${FIT.intercept.toFixed(0)} + ${FIT.slope.toFixed(0)}t`}
    />
  );
}

/** Play beat: add the seasonal component back in, and watch the reconstruction track every observed point exactly. */
export function PlayDemo() {
  return (
    <MultiCurvePlayground
      curves={[TREND_LINE, RECONSTRUCTION]}
      domain={DOMAIN}
      rangeDomain={RANGE_DOMAIN}
      scatterPoints={SCATTER}
      readout={`season: [${SEASON.join(", ")}] — trend + season passes through every real observation`}
    />
  );
}

/** Checkpoint: pick the future time step whose forecast is exactly 35. */
export function TimeSeriesCheckpoint() {
  const [t, setT] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const passed = t !== null && forecast(FIT, SEASON, t) === 35;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Pick the future time step whose forecast comes out to exactly <strong>35</strong>.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a time step to try it"
    >
      <div className={styles.buttons}>
        {FORECAST_TIMES.map((opt) => (
          <button
            type="button"
            key={opt}
            className={opt === t ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setT(opt);
            }}
          >
            t={opt}
          </button>
        ))}
      </div>
      <MultiCurvePlayground
        curves={[TREND_LINE, RECONSTRUCTION]}
        domain={DOMAIN}
        rangeDomain={RANGE_DOMAIN}
        scatterPoints={SCATTER}
        readout={t !== null ? `forecast(t=${t}) = ${forecast(FIT, SEASON, t)}` : "pick a time step"}
      />
    </CheckpointFrame>
  );
}
