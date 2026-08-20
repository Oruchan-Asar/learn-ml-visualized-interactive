"use client";

import { useEffect, useId, useState } from "react";
import { MultiCurvePlayground, type CurveLine } from "@/components/viz/MultiCurvePlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { blackBox, localFit, localLineSegment, trueDerivative, DOMAIN, RANGE_DOMAIN } from "@/lib/math-core/lime";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "lime";

const TRUE_CURVE_POINTS = Array.from({ length: 61 }, (_, i) => {
  const x = DOMAIN[0] + ((DOMAIN[1] - DOMAIN[0]) * i) / 60;
  return { x, y: blackBox(x) };
});

function X0Slider({ value, onChange }: { value: number; onChange: (x0: number) => void }) {
  const id = useId();
  return (
    <div className={styles.sliderRow}>
      <label htmlFor={id}>x&#8320; = {value.toFixed(1)}</label>
      <input id={id} type="range" min={1} max={7} step={0.1} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

function localCurve(x0: number): CurveLine {
  return { points: localLineSegment(x0), variant: "fitHighlight" };
}

/** Intuition beat: drag the query point, watch LIME's local linear fit track the curve's slope right there. */
export function IntuitionDemo() {
  const [x0, setX0] = useState(3);
  const { slope } = localFit(x0);
  const samples = localFit(x0).samples;
  return (
    <>
      <MultiCurvePlayground
        curves={[{ points: TRUE_CURVE_POINTS, variant: "true" }, localCurve(x0)]}
        domain={DOMAIN}
        rangeDomain={RANGE_DOMAIN}
        scatterPoints={samples.map((s) => ({ x: s.x, y: s.y }))}
        readout={`local slope at x0=${x0.toFixed(1)}: ${slope.toFixed(2)}`}
      />
      <div className={styles.controls}>
        <X0Slider value={x0} onChange={setX0} />
      </div>
    </>
  );
}

/** Play beat: check the local slope against the true derivative 2x0 at every point you drag to. */
export function PlayDemo() {
  const [x0, setX0] = useState(5);
  const { slope } = localFit(x0);
  const trueSlope = trueDerivative(x0);
  return (
    <>
      <MultiCurvePlayground
        curves={[{ points: TRUE_CURVE_POINTS, variant: "true" }, localCurve(x0)]}
        domain={DOMAIN}
        rangeDomain={RANGE_DOMAIN}
        scatterPoints={localFit(x0).samples.map((s) => ({ x: s.x, y: s.y }))}
        readout={`LIME's local slope: ${slope.toFixed(2)} — true derivative 2×${x0.toFixed(1)}: ${trueSlope.toFixed(2)}`}
      />
      <div className={styles.controls}>
        <X0Slider value={x0} onChange={setX0} />
      </div>
    </>
  );
}

/** Checkpoint: drag x0 until the local slope clears a target — nothing but perturb-and-refit needed to get there. */
export function LimeCheckpoint() {
  const [x0, setX0] = useState(1);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const { slope } = localFit(x0);
  const passed = slope >= 10;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Drag x&#8320; until LIME&apos;s local slope reaches at least <strong>10</strong>.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag the slider to try it"
    >
      <MultiCurvePlayground
        curves={[{ points: TRUE_CURVE_POINTS, variant: "true" }, localCurve(x0)]}
        domain={DOMAIN}
        rangeDomain={RANGE_DOMAIN}
        scatterPoints={localFit(x0).samples.map((s) => ({ x: s.x, y: s.y }))}
        readout={`local slope: ${slope.toFixed(2)}`}
      />
      <div className={styles.controls}>
        <X0Slider
          value={x0}
          onChange={(v) => {
            setHasInteracted(true);
            setX0(v);
          }}
        />
      </div>
    </CheckpointFrame>
  );
}
