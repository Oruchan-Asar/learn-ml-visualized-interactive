"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { MultiCurvePlayground, type CurveLine } from "@/components/viz/MultiCurvePlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  f,
  linearApprox,
  quadraticApprox,
  approxError,
  DOMAIN,
} from "@/lib/math-core/taylor-series-approximations";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "taylor-series-approximations";
const RANGE_DOMAIN: [number, number] = [-12, 12];
const SAMPLES = 60;

function sampleCurve(fn: (x: number) => number): { x: number; y: number }[] {
  const [xMin, xMax] = DOMAIN;
  const pts = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const x = xMin + ((xMax - xMin) * i) / SAMPLES;
    pts.push({ x, y: fn(x) });
  }
  return pts;
}

function X0Slider({ value, onChange }: { value: number; onChange: (x0: number) => void }) {
  const id = useId();
  return (
    <div className={styles.sliderRow}>
      <label htmlFor={id}>x₀ = {value.toFixed(1)}</label>
      <input
        id={id}
        type="range"
        min={DOMAIN[0]}
        max={DOMAIN[1]}
        step={0.1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

/** Intuition beat: the linear (tangent-line) approximation only — feel it hug the curve near x0 and drift away. */
export function IntuitionDemo() {
  const [x0, setX0] = useState(1);
  const trueCurve = useMemo(() => sampleCurve(f), []);
  const linearCurve = useMemo(() => sampleCurve((x) => linearApprox(x0, x)), [x0]);

  const curves: CurveLine[] = [
    { points: trueCurve, variant: "true" },
    { points: linearCurve, variant: "fitHighlight" },
  ];

  return (
    <>
      <MultiCurvePlayground
        curves={curves}
        domain={DOMAIN}
        rangeDomain={RANGE_DOMAIN}
        readout={`f(x) = x³ — tangent line at x₀ = ${x0.toFixed(1)}`}
      />
      <div className={styles.controls}>
        <X0Slider value={x0} onChange={setX0} />
      </div>
    </>
  );
}

/** Play beat: linear + quadratic approximations overlaid, plus errors at a chosen evaluation point. */
export function PlayDemo() {
  const [x0, setX0] = useState(1);
  const [evalX, setEvalX] = useState(1.5);
  const trueCurve = useMemo(() => sampleCurve(f), []);
  const linearCurve = useMemo(() => sampleCurve((x) => linearApprox(x0, x)), [x0]);
  const quadraticCurve = useMemo(() => sampleCurve((x) => quadraticApprox(x0, x)), [x0]);

  const curves: CurveLine[] = [
    { points: trueCurve, variant: "true" },
    { points: linearCurve, variant: "fit" },
    { points: quadraticCurve, variant: "fitHighlight" },
  ];

  const trueVal = f(evalX);
  const linVal = linearApprox(x0, evalX);
  const quadVal = quadraticApprox(x0, evalX);
  const linErr = approxError(linVal, evalX);
  const quadErr = approxError(quadVal, evalX);

  return (
    <>
      <MultiCurvePlayground
        curves={curves}
        domain={DOMAIN}
        rangeDomain={RANGE_DOMAIN}
        readout={`at x=${evalX.toFixed(1)}: true=${trueVal.toFixed(2)}, linear=${linVal.toFixed(2)} (err ${linErr.toFixed(2)}), quadratic=${quadVal.toFixed(2)} (err ${quadErr.toFixed(2)})`}
      />
      <div className={styles.controls}>
        <X0Slider value={x0} onChange={setX0} />
        <div className={styles.sliderRow}>
          <label>eval x = {evalX.toFixed(1)}</label>
          <input
            type="range"
            min={DOMAIN[0]}
            max={DOMAIN[1]}
            step={0.1}
            value={evalX}
            onChange={(e) => setEvalX(Number(e.target.value))}
          />
        </div>
      </div>
    </>
  );
}

const CANDIDATES = [3.25, 2.5, 4, 3.375];
const CORRECT = quadraticApprox(1, 1.5);

/** Checkpoint: given x0=1 and x=1.5, compute the quadratic approximation's value and pick it out. */
export function TaylorCheckpoint() {
  const [chosen, setChosen] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const passed = chosen !== null && Math.abs(chosen - CORRECT) < 1e-9;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Expanding $f(x)=x^3$ around $x_0=1$, compute the <strong>quadratic</strong> Taylor approximation&apos;s
          value at $x=1.5$.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Compute Q(1.5), then pick a value"
    >
      <div className={styles.buttons}>
        {CANDIDATES.map((c) => (
          <button
            key={c}
            type="button"
            className={c === chosen ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setChosen(c);
            }}
          >
            {c}
          </button>
        ))}
      </div>
    </CheckpointFrame>
  );
}
