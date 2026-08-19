"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CurvePlayground } from "@/components/viz/CurvePlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { f, fPrime, g, gPrime, hPrime } from "@/lib/math-core/chain-rule";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "./LinkedCurves.module.css";

const X_DOMAIN: [number, number] = [-2, 4];
const U_DOMAIN: [number, number] = [-3, 9];
const CONCEPT_ID = "the-chain-rule";
const TARGET_DERIVATIVE = 20;
const TOLERANCE = 0.5;

/**
 * Two CurvePlayground instances sharing one x — the same primitive from
 * Chapters 1–2, just composed twice. Dragging the top curve (f) drives the
 * point on the bottom curve (g) via u = f(x); the bottom curve isn't
 * independently draggable, since its position is entirely determined by x.
 */
function LinkedCurves({
  x,
  onChangeX,
  showTangent,
  readout,
}: {
  x: number;
  onChangeX: (x: number) => void;
  showTangent: boolean;
  readout?: (x: number, u: number) => ReactNode;
}) {
  const u = f(x);
  return (
    <div className={styles.stack}>
      <CurvePlayground
        fn={f}
        derivative={fPrime}
        domain={X_DOMAIN}
        value={x}
        onChange={onChangeX}
        showTangent={showTangent}
        readout={`u = f(x) = ${u.toFixed(2)}`}
      />
      <p className={styles.flow}>↓ feeds into g(u)</p>
      <CurvePlayground
        fn={g}
        derivative={gPrime}
        domain={U_DOMAIN}
        value={u}
        onChange={() => {}}
        showTangent={showTangent}
        readout={readout ? readout(x, u) : `y = g(u) = ${g(u).toFixed(2)}`}
      />
    </div>
  );
}

/** Intuition beat: just watch the point flow from f's curve into g's curve. */
export function IntuitionDemo() {
  const [x, setX] = useState(1);
  return <LinkedCurves x={x} onChangeX={setX} showTangent={false} />;
}

/** Play beat: tangents visible, plus a readout of each slope and their product. */
export function PlayDemo() {
  const [x, setX] = useState(1);
  return (
    <LinkedCurves
      x={x}
      onChangeX={setX}
      showTangent
      readout={(x, u) =>
        `f'(x) = ${fPrime(x).toFixed(2)}, g'(u) = ${gPrime(u).toFixed(2)}  →  dh/dx = ${(gPrime(u) * fPrime(x)).toFixed(2)}`
      }
    />
  );
}

/** Checkpoint: drag x until dh/dx hits a target value. */
export function ChainRuleCheckpoint() {
  const [x, setX] = useState(1);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const derivative = hPrime(x);
  const passed = withinTolerance(derivative, TARGET_DERIVATIVE, TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Drag the top curve&rsquo;s point until <code>dh/dx</code> reads <strong>20</strong>.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag the point to try it"
    >
      <LinkedCurves
        x={x}
        onChangeX={(next) => {
          setHasInteracted(true);
          setX(next);
        }}
        showTangent
        readout={(x, u) => `dh/dx = g'(u) · f'(x) = ${(gPrime(u) * fPrime(x)).toFixed(2)}`}
      />
    </CheckpointFrame>
  );
}
