"use client";

import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import { scaleLinear } from "d3";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  CLASS_A,
  DOMAIN,
  mean,
  ldaDirection,
  type Point2D,
} from "@/lib/math-core/linear-discriminant-analysis";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../gradient-descent-variants/DescentControls.module.css";
import scatterStyles from "./LdaScatter.module.css";

const CONCEPT_ID = "linear-discriminant-analysis";

/** Class B, held to a fixed mean (6, 4) while its own spread — half-width s around that mean — varies. */
function classBWithSpread(s: number): Point2D[] {
  return [
    { x: 6, y: 4 - s },
    { x: 6, y: 4 + s },
  ];
}

/** The Fisher separation score: direction · (mean_A − mean_B) — what LDA actually maximizes, as
 *  opposed to the raw (unweighted) Euclidean distance between the two cluster centers. */
function separationScore(classA: Point2D[], classB: Point2D[]): number {
  const direction = ldaDirection(classA, classB);
  const meanA = mean(classA);
  const meanB = mean(classB);
  return direction.x * (meanA.x - meanB.x) + direction.y * (meanA.y - meanB.y);
}

function ClassScatter({
  classA,
  classB,
  readout,
}: {
  classA: Point2D[];
  classB: Point2D[];
  readout: ReactNode;
}) {
  const size = 280;
  const margin = 28;
  const [dMin, dMax] = DOMAIN;
  const scaleX = useMemo(() => scaleLinear().domain([dMin, dMax]).range([margin, size - margin]), [dMin, dMax]);
  const scaleY = useMemo(() => scaleLinear().domain([dMin, dMax]).range([size - margin, margin]), [dMin, dMax]);

  const direction = ldaDirection(classA, classB);
  const meanA = mean(classA);
  const meanB = mean(classB);
  const centroid = { x: (meanA.x + meanB.x) / 2, y: (meanA.y + meanB.y) / 2 };
  const norm = Math.hypot(direction.x, direction.y) || 1;
  const unit = { x: direction.x / norm, y: direction.y / norm };
  const reach = dMax - dMin;
  const lineStart = { x: centroid.x - unit.x * reach, y: centroid.y - unit.y * reach };
  const lineEnd = { x: centroid.x + unit.x * reach, y: centroid.y + unit.y * reach };

  const tick = (p: Point2D) => {
    const t = (p.x - centroid.x) * unit.x + (p.y - centroid.y) * unit.y;
    return { x: centroid.x + t * unit.x, y: centroid.y + t * unit.y };
  };

  return (
    <div className={scatterStyles.wrap}>
      <svg viewBox={`0 0 ${size} ${size}`} className={scatterStyles.svg} role="img" aria-label="Two classes of 2D points, their means, and the LDA projection axis.">
        <line x1={margin} y1={scaleY(0)} x2={size - margin} y2={scaleY(0)} className={scatterStyles.axis} />
        <line x1={scaleX(0)} y1={margin} x2={scaleX(0)} y2={size - margin} className={scatterStyles.axis} />
        <line
          x1={scaleX(lineStart.x)}
          y1={scaleY(lineStart.y)}
          x2={scaleX(lineEnd.x)}
          y2={scaleY(lineEnd.y)}
          className={scatterStyles.axisLine}
        />
        {classA.map((p, i) => (
          <circle key={`tA${i}`} cx={scaleX(tick(p).x)} cy={scaleY(tick(p).y)} r={3} className={scatterStyles.tickA} />
        ))}
        {classB.map((p, i) => (
          <circle key={`tB${i}`} cx={scaleX(tick(p).x)} cy={scaleY(tick(p).y)} r={3} className={scatterStyles.tickB} />
        ))}
        {classA.map((p, i) => (
          <circle key={`a${i}`} cx={scaleX(p.x)} cy={scaleY(p.y)} r={6} className={scatterStyles.pointA} />
        ))}
        {classB.map((p, i) => (
          <circle key={`b${i}`} cx={scaleX(p.x)} cy={scaleY(p.y)} r={6} className={scatterStyles.pointB} />
        ))}
        <circle cx={scaleX(meanA.x)} cy={scaleY(meanA.y)} r={9} className={scatterStyles.meanA} />
        <circle cx={scaleX(meanB.x)} cy={scaleY(meanB.y)} r={9} className={scatterStyles.meanB} />
      </svg>
      <div className={scatterStyles.legend}>
        <span className={scatterStyles.legendA}>● class A</span>
        <span className={scatterStyles.legendB}>● class B</span>
      </div>
      {readout && <div className={scatterStyles.readout}>{readout}</div>}
    </div>
  );
}

function SpreadSlider({ value, onChange }: { value: number; onChange: (s: number) => void }) {
  const id = useId();
  return (
    <div className={styles.sliderRow}>
      <label htmlFor={id}>class B spread (s) = {value.toFixed(2)}</label>
      <input
        id={id}
        type="range"
        min={0.25}
        max={3}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

/** Intuition beat: shrink class B's own spread (mean fixed) and watch the LDA axis rotate toward better separation. */
export function IntuitionDemo() {
  const [s, setS] = useState(1);
  const classB = classBWithSpread(s);
  const score = separationScore(CLASS_A, classB);
  return (
    <>
      <ClassScatter classA={CLASS_A} classB={classB} readout={`separation score = ${score.toFixed(2)}`} />
      <div className={styles.controls}>
        <SpreadSlider value={s} onChange={setS} />
      </div>
    </>
  );
}

/** Play beat: same slider, now contrasting the (fixed) raw distance between means against the (varying) LDA score. */
export function PlayDemo() {
  const [s, setS] = useState(1.5);
  const classB = classBWithSpread(s);
  const meanA = mean(CLASS_A);
  const meanB = mean(classB);
  const rawDistance = Math.hypot(meanA.x - meanB.x, meanA.y - meanB.y);
  const score = separationScore(CLASS_A, classB);
  return (
    <>
      <ClassScatter
        classA={CLASS_A}
        classB={classB}
        readout={`raw distance between means = ${rawDistance.toFixed(2)} (constant) — LDA separation score = ${score.toFixed(2)}`}
      />
      <div className={styles.controls}>
        <SpreadSlider value={s} onChange={setS} />
      </div>
    </>
  );
}

/** Checkpoint: shrink class B's spread until the separation score exceeds 14. */
export function LdaCheckpoint() {
  const [s, setS] = useState(3);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const classB = classBWithSpread(s);
  const score = separationScore(CLASS_A, classB);
  const passed = score > 14;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Decrease class B&apos;s spread until the separation score climbs above <strong>14</strong> — without
          moving either class&apos;s mean at all.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Move the spread slider to try it"
    >
      <ClassScatter classA={CLASS_A} classB={classB} readout={`separation score = ${score.toFixed(2)}`} />
      <div className={styles.controls}>
        <SpreadSlider
          value={s}
          onChange={(next) => {
            setHasInteracted(true);
            setS(next);
          }}
        />
      </div>
    </CheckpointFrame>
  );
}
