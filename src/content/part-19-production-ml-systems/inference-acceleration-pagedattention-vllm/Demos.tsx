"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  CACHE_CAPACITY,
  SEQUENCE_LENGTHS,
  NAIVE_RESERVATION,
  PAGE_SIZE,
  totalUsedTokens,
  naiveTotalAllocated,
  pagedTotalAllocated,
  wastedSlots,
  fragmentationFraction,
  naiveGrid,
  pagedGrid,
  CHECKPOINT_LENGTHS,
  CHECKPOINT_CANDIDATES,
  type CellStatus,
} from "@/lib/math-core/inference-acceleration-pagedattention-vllm";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";
import pageStyles from "./PageCache.module.css";

const CONCEPT_ID = "inference-acceleration-pagedattention-vllm";

function Legend() {
  return (
    <div className={pageStyles.legend}>
      <span>
        <span className={pageStyles.legendSwatch} style={{ background: "var(--accent2)" }} /> used
      </span>
      <span>
        <span className={pageStyles.legendSwatch} style={{ background: "var(--accent)", opacity: 0.6 }} /> wasted (reserved, unused)
      </span>
      <span>
        <span className={pageStyles.legendSwatch} style={{ background: "var(--paper-raised)" }} /> free
      </span>
    </div>
  );
}

function CacheGrid({ cells, label }: { cells: CellStatus[]; label: string }) {
  return (
    <div className={pageStyles.gridColumn}>
      <span className={pageStyles.gridLabel}>{label}</span>
      <div
        className={pageStyles.grid}
        role="img"
        aria-label={`${CACHE_CAPACITY}-slot KV-cache under the ${label} scheme, laid out as a 4 by 4 grid of slots`}
      >
        {cells.map((cell, i) => (
          <div key={i} className={cell.status === "used" ? pageStyles.used : cell.status === "wasted" ? pageStyles.wasted : pageStyles.free}>
            {cell.seq !== null ? `S${cell.seq}` : ""}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Intuition beat: toggle between naive (fixed-block) and paged allocation for the same three sequences, watching the wasted slots. */
export function IntuitionDemo() {
  const [scheme, setScheme] = useState<"naive" | "paged">("naive");
  const cells = scheme === "naive" ? naiveGrid() : pagedGrid();
  const allocated = scheme === "naive" ? naiveTotalAllocated() : pagedTotalAllocated();
  const used = totalUsedTokens();
  return (
    <>
      <div className={styles.buttons}>
        <button type="button" className={scheme === "naive" ? styles.buttonActive : styles.button} onClick={() => setScheme("naive")}>
          naive (fixed block)
        </button>
        <button type="button" className={scheme === "paged" ? styles.buttonActive : styles.button} onClick={() => setScheme("paged")}>
          paged (page size {PAGE_SIZE})
        </button>
      </div>
      <Legend />
      <CacheGrid cells={cells} label={scheme} />
      <div className={pageStyles.readout}>
        <p>
          Sequences of lengths [{SEQUENCE_LENGTHS.join(", ")}] use {used} tokens total, allocated {allocated} slots.
        </p>
        <p>
          Wasted: {wastedSlots(allocated, used)} of {allocated} — fragmentation {fragmentationFraction(allocated, used).toFixed(3)}
        </p>
      </div>
    </>
  );
}

/** Play beat: both schemes side by side on the exact same three sequences. */
export function PlayDemo() {
  const naiveAllocated = naiveTotalAllocated();
  const pagedAllocated = pagedTotalAllocated();
  const used = totalUsedTokens();
  return (
    <>
      <Legend />
      <div className={pageStyles.grids}>
        <CacheGrid cells={naiveGrid()} label={`naive (${NAIVE_RESERVATION}/seq)`} />
        <CacheGrid cells={pagedGrid()} label={`paged (page ${PAGE_SIZE})`} />
      </div>
      <ContributionBars
        items={[
          { label: "naive wasted", value: wastedSlots(naiveAllocated, used) },
          { label: "paged wasted", value: wastedSlots(pagedAllocated, used) },
        ]}
        formatValue={(v) => `${v} slots`}
        readout={`naive allocates ${naiveAllocated} slots for ${used} used tokens; paged allocates only ${pagedAllocated} — fragmentation drops from ${fragmentationFraction(naiveAllocated, used).toFixed(3)} to ${fragmentationFraction(pagedAllocated, used).toFixed(3)}`}
      />
    </>
  );
}

/** Checkpoint: two unseen sequences under the paged scheme — how many slots are wasted? */
export function PagedAttentionCheckpoint() {
  const [chosen, setChosen] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const allocated = pagedTotalAllocated(CHECKPOINT_LENGTHS);
  const used = totalUsedTokens(CHECKPOINT_LENGTHS);
  const target = wastedSlots(allocated, used);
  const passed = chosen === target;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Two new sequences, lengths {CHECKPOINT_LENGTHS.join(" and ")}, arrive under the paged scheme
          (page size {PAGE_SIZE}). How many slots end up <strong>wasted</strong> — allocated but unused?
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a value to try it"
    >
      <CacheGrid cells={pagedGrid(CHECKPOINT_LENGTHS)} label="paged, new sequences" />
      <div className={pageStyles.candidateList}>
        {CHECKPOINT_CANDIDATES.map((c) => (
          <button
            key={c}
            type="button"
            className={c === chosen ? pageStyles.candidateActive : pageStyles.candidate}
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
