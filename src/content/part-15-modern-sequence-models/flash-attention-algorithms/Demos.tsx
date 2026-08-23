"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  N,
  BLOCK,
  NUM_STEPS,
  tileAt,
  SEQUENCE_LENGTHS,
  naivePeakMemory,
  tiledPeakMemory,
} from "@/lib/math-core/flash-attention-algorithms";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";
import demoStyles from "./FlashDemos.module.css";

const CONCEPT_ID = "flash-attention-algorithms";

function TileGrid({ step }: { step: number }) {
  const tile = tileAt(step);
  const cells: { row: number; col: number; active: boolean; value: number | null }[] = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const inRows = r >= tile.rows[0] && r <= tile.rows[1];
      const inCols = c >= tile.cols[0] && c <= tile.cols[1];
      const active = inRows && inCols;
      cells.push({
        row: r,
        col: c,
        active,
        value: active ? tile.scores[r - tile.rows[0]][c - tile.cols[0]] : null,
      });
    }
  }
  return (
    <div className={demoStyles.grid} role="img" aria-label={`4 by 4 attention score matrix, tile at rows ${tile.rows[0]}-${tile.rows[1]}, columns ${tile.cols[0]}-${tile.cols[1]} highlighted`}>
      {cells.map((cell) => (
        <div key={`${cell.row}-${cell.col}`} className={cell.active ? demoStyles.cellActive : demoStyles.cell}>
          {cell.active ? cell.value : ""}
        </div>
      ))}
    </div>
  );
}

/** Intuition beat: step through the four (query-block, key-block) tiles one at a time. Only one 2x2 tile of scores is ever visible at once. */
export function IntuitionDemo() {
  const [step, setStep] = useState(0);
  const tile = tileAt(step);

  return (
    <>
      <TileGrid step={step} />
      <div className={styles.controls}>
        <span className={styles.stepCount}>
          step {step + 1} of {NUM_STEPS} — query-block {tile.qBlock}, key-block {tile.kBlock}
        </span>
      </div>
      <div className={styles.buttons}>
        <button type="button" className={styles.button} disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
          ← prev tile
        </button>
        <button type="button" className={styles.button} disabled={step === NUM_STEPS - 1} onClick={() => setStep((s) => Math.min(NUM_STEPS - 1, s + 1))}>
          next tile →
        </button>
      </div>
    </>
  );
}

/** Play beat: pick a sequence length and compare naive peak memory (the whole n×n matrix) against tiled peak memory (one block×block tile, no matter how large n gets). */
export function PlayDemo() {
  const [n, setN] = useState(16);
  return (
    <>
      <div className={styles.buttons}>
        {SEQUENCE_LENGTHS.map((len) => (
          <button key={len} type="button" className={len === n ? styles.buttonActive : styles.button} onClick={() => setN(len)}>
            n = {len}
          </button>
        ))}
      </div>
      <ContributionBars
        items={[
          { label: "naive: full n×n matrix", value: naivePeakMemory(n) },
          { label: "tiled: one block×block tile", value: tiledPeakMemory(BLOCK) },
        ]}
        formatValue={(v) => v.toLocaleString()}
        max={naivePeakMemory(SEQUENCE_LENGTHS[SEQUENCE_LENGTHS.length - 1])}
        readout={`at n = ${n}: naive peak memory grows to ${naivePeakMemory(n).toLocaleString()} scores; tiled peak memory stays at ${tiledPeakMemory(BLOCK)}, no matter how large n gets`}
      />
    </>
  );
}

const TARGET_N = SEQUENCE_LENGTHS.find((len) => naivePeakMemory(len) / tiledPeakMemory(BLOCK) >= 1000)!;
const TARGET_RATIO = naivePeakMemory(TARGET_N) / tiledPeakMemory(BLOCK);

/** Checkpoint: find the smallest sequence length where naive peak memory first exceeds 1000x the tiled peak memory. */
export function FlashAttentionCheckpoint() {
  const [n, setN] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const ratio = n === null ? null : naivePeakMemory(n) / tiledPeakMemory(BLOCK);
  const passed = n !== null && n === TARGET_N;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Find the <strong>smallest</strong> sequence length, among the candidates, where naive peak memory
          first reaches at least <strong>1000x</strong> tiled peak memory.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a sequence length to try it"
    >
      <div className={styles.buttons}>
        {SEQUENCE_LENGTHS.map((len) => (
          <button
            key={len}
            type="button"
            className={len === n ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setN(len);
            }}
          >
            n = {len}
          </button>
        ))}
      </div>
      {ratio !== null && (
        <ContributionBars items={[{ label: "ratio (naive / tiled)", value: ratio }]} formatValue={(v) => `${v.toFixed(0)}x`} max={TARGET_RATIO * 4} />
      )}
    </CheckpointFrame>
  );
}
