"use client";

import { useEffect, useState } from "react";
import { KernelHeatmap } from "@/components/viz/KernelHeatmap";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  GRID_ROWS,
  GRID_COLS,
  GROUND_TRUTH_BOX,
  predictedBox,
  iou,
  segmentationMetrics,
  IOU_MATCH_THRESHOLD,
} from "@/lib/math-core/object-detection-and-segmentation";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "object-detection-and-segmentation";
const OFFSETS = [0, 1, 2];

function overlapGrid(offset: number): number[][] {
  const pred = predictedBox(offset);
  const grid: number[][] = [];
  for (let r = 0; r < GRID_ROWS; r++) {
    const row: number[] = [];
    for (let c = 0; c < GRID_COLS; c++) {
      const inGt = r >= GROUND_TRUTH_BOX.rowStart && r <= GROUND_TRUTH_BOX.rowEnd && c >= GROUND_TRUTH_BOX.colStart && c <= GROUND_TRUTH_BOX.colEnd;
      const inPred = r >= pred.rowStart && r <= pred.rowEnd && c >= pred.colStart && c <= pred.colEnd;
      row.push(inGt && inPred ? 1 : inGt ? 0.5 : inPred ? -0.5 : 0);
    }
    grid.push(row);
  }
  return grid;
}

/** Intuition beat: shift the predicted box and watch IoU and the pixel overlap change together. */
export function IntuitionDemo() {
  const [offset, setOffset] = useState(0);
  const boxIoU = iou(GROUND_TRUTH_BOX, predictedBox(offset));
  return (
    <>
      <div className={styles.buttons}>
        {OFFSETS.map((o) => (
          <button key={o} type="button" className={o === offset ? styles.buttonActive : styles.button} onClick={() => setOffset(o)}>
            shift {o}
          </button>
        ))}
      </div>
      <KernelHeatmap kernel={overlapGrid(offset)} label="Ground truth (light) vs predicted (dark) box overlap" />
      <ContributionBars items={[{ label: "IoU", value: boxIoU }]} formatValue={(v) => v.toFixed(3)} max={1} readout={`match threshold: IoU ≥ ${IOU_MATCH_THRESHOLD}`} />
    </>
  );
}

/** Play beat: the same two boxes scored two ways — box IoU and pixel-level segmentation metrics. */
export function PlayDemo() {
  const pred = predictedBox(1);
  const boxIoU = iou(GROUND_TRUTH_BOX, pred);
  const seg = segmentationMetrics(GROUND_TRUTH_BOX, pred);
  return (
    <>
      <KernelHeatmap kernel={overlapGrid(1)} label="Ground truth vs predicted box, shifted by 1" />
      <ContributionBars
        items={[
          { label: "box IoU", value: boxIoU },
          { label: "pixel precision", value: seg.precision },
          { label: "pixel recall", value: seg.recall },
          { label: "Dice", value: seg.dice },
        ]}
        formatValue={(v) => v.toFixed(3)}
        readout={`TP=${seg.tp} FP=${seg.fp} FN=${seg.fn} — the same two boxes, scored geometrically and pixel-by-pixel`}
      />
    </>
  );
}

/** Checkpoint: find the shift where the detection just barely still counts as a match (IoU ≥ 0.5). */
export function ObjectDetectionCheckpoint() {
  const [offset, setOffset] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const boxIoU = offset === null ? null : iou(GROUND_TRUTH_BOX, predictedBox(offset));
  const passed = boxIoU !== null && boxIoU >= IOU_MATCH_THRESHOLD && offset !== 0;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the shift that puts the detection <strong>right at the edge</strong> of counting as a match (IoU ≥ {IOU_MATCH_THRESHOLD}) — not a perfect one.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a shift to try it"
    >
      <div className={styles.buttons}>
        {OFFSETS.map((o) => (
          <button
            key={o}
            type="button"
            className={o === offset ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setOffset(o);
            }}
          >
            shift {o}
          </button>
        ))}
      </div>
      {boxIoU !== null && <ContributionBars items={[{ label: "IoU", value: boxIoU }]} formatValue={(v) => v.toFixed(3)} max={1} />}
    </CheckpointFrame>
  );
}
