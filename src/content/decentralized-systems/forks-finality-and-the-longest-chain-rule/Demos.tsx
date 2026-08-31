"use client";

import { useEffect, useState } from "react";
import { CurvePlayground } from "@/components/viz/CurvePlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  GENESIS_HASH,
  CHAIN_A,
  CHAIN_B,
  extendChain,
  longestChain,
  reversalProbability,
  ATTACKER_SHARE,
  FINALITY_THRESHOLD,
  type ForkBlock,
} from "@/lib/math-core/forks-finality-and-the-longest-chain-rule";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";
import treeStyles from "./ForkTree.module.css";

const CONCEPT_ID = "forks-finality-and-the-longest-chain-rule";

/** One row of a fork: its label (with a "canonical" tag if it currently wins the longest-chain rule) and its blocks. */
function ForkRow({ label, blocks, isCanonical }: { label: string; blocks: ForkBlock[]; isCanonical: boolean }) {
  return (
    <div className={isCanonical ? treeStyles.forkCanonical : treeStyles.fork}>
      <span className={treeStyles.forkLabel}>
        {label} ({blocks.length} block{blocks.length === 1 ? "" : "s"}){isCanonical ? " — canonical" : ""}
      </span>
      <div className={treeStyles.blocks}>
        {blocks.map((b, i) => (
          <div key={i} className={treeStyles.block}>
            <span className={treeStyles.blockLabel}>{b.data}</span>
            <span className={treeStyles.blockHash}>{b.hash}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Both forks branching off the shared genesis, with whichever is currently longest marked canonical. */
function ForkTreeView({ chainA, chainB, canonical }: { chainA: ForkBlock[]; chainB: ForkBlock[]; canonical: string | null }) {
  return (
    <div className={treeStyles.wrap}>
      <div className={treeStyles.genesis}>
        <span className={treeStyles.blockLabel}>genesis</span>
        <span className={treeStyles.blockHash}>{GENESIS_HASH}</span>
      </div>
      <div className={treeStyles.forks}>
        <ForkRow label="Chain A" blocks={chainA} isCanonical={canonical === "A"} />
        <ForkRow label="Chain B" blocks={chainB} isCanonical={canonical === "B"} />
      </div>
    </div>
  );
}

/** Intuition beat: extend either fork and watch the longest-chain rule flip which one is canonical. */
export function IntuitionDemo() {
  const [chainA, setChainA] = useState<ForkBlock[]>(CHAIN_A);
  const [chainB, setChainB] = useState<ForkBlock[]>(CHAIN_B);
  const canonical = longestChain({ A: chainA, B: chainB });

  return (
    <>
      <ForkTreeView chainA={chainA} chainB={chainB} canonical={canonical} />
      <div className={styles.buttons}>
        <button type="button" className={styles.button} onClick={() => setChainA((c) => extendChain(c, `a${c.length + 1}`))}>
          Extend Chain A
        </button>
        <button type="button" className={styles.button} onClick={() => setChainB((c) => extendChain(c, `b${c.length + 1}`))}>
          Extend Chain B
        </button>
        <button
          type="button"
          className={styles.button}
          onClick={() => {
            setChainA(CHAIN_A);
            setChainB(CHAIN_B);
          }}
        >
          Reset
        </button>
      </div>
      <p className={styles.stepCount}>
        {canonical
          ? `Chain ${canonical} is canonical right now — it simply has more blocks.`
          : "Tied length — no chain is canonical yet; the next block mined on either side decides it."}
      </p>
    </>
  );
}

/** Play beat: drag along the reversal-probability curve and watch it collapse exponentially as confirmations pile up. */
export function PlayDemo() {
  const [confirmations, setConfirmations] = useState(1);
  const prob = reversalProbability(confirmations);

  return (
    <>
      <CurvePlayground
        fn={(z) => reversalProbability(z)}
        derivative={(z) => reversalProbability(z) * Math.log(ATTACKER_SHARE / (1 - ATTACKER_SHARE))}
        domain={[0, 8]}
        value={confirmations}
        onChange={setConfirmations}
        showTangent={false}
        readout={
          <span className={styles.stepCount}>
            after {confirmations.toFixed(1)} confirmations: reversal probability ≈ {prob.toFixed(4)}
          </span>
        }
      />
      <p className={styles.stepCount}>
        Drag right to add confirmations. With an attacker holding {(ATTACKER_SHARE * 100).toFixed(0)}% of the network&apos;s
        power, each additional confirmation multiplies their odds of catching up by another factor of
        {" "}
        {(ATTACKER_SHARE / (1 - ATTACKER_SHARE)).toFixed(2)} — finality is never absolute, just increasingly unlikely to fail.
      </p>
    </>
  );
}

/** Checkpoint: find the minimum confirmation depth that pushes the reversal probability under the finality threshold. */
export function FinalityCheckpoint() {
  const [confirmations, setConfirmations] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const prob = confirmations === null ? null : reversalProbability(confirmations);
  // The instructions ask for the MINIMUM confirmations that clears the threshold — checking only
  // "prob < threshold" would also accept every larger value (8 of the 11 slider positions), letting
  // a student slide straight to the far end and pass without ever finding the actual crossover.
  let minConfirmations = 0;
  while (minConfirmations <= 10 && !(reversalProbability(minConfirmations) < FINALITY_THRESHOLD)) minConfirmations++;
  const passed = confirmations === minConfirmations;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Slide to the minimum number of confirmations (0–10) that pushes the reversal probability strictly
          under {FINALITY_THRESHOLD}.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Slide to search for the crossover point"
    >
      <div className={styles.sliderRow}>
        <label htmlFor="confirmations-checkpoint">confirmations = {confirmations ?? 0}</label>
        <input
          id="confirmations-checkpoint"
          type="range"
          min={0}
          max={10}
          step={1}
          value={confirmations ?? 0}
          onChange={(e) => {
            setHasInteracted(true);
            setConfirmations(Number(e.target.value));
          }}
          style={{ width: 220 }}
        />
      </div>
      {prob !== null && <p className={styles.stepCount}>reversal probability ≈ {prob.toFixed(6)}</p>}
    </CheckpointFrame>
  );
}
