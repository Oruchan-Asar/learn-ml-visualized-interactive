"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { merkleRoot } from "@/lib/math-core/cryptographic-primitives-for-decentralization";
import { DIFFICULTY_TARGET, MAX_NONCE, meetsTarget } from "@/lib/math-core/nakamoto-consensus-and-proof-of-work";
import {
  GENESIS_HASH,
  BLOCK_1_TXS,
  TOY_CHAIN,
  capstoneBlockHash,
  type ToyBlock,
} from "@/lib/math-core/capstone-build-a-toy-blockchain";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";
import chainStyles from "./ChainBlocks.module.css";

const CONCEPT_ID = "capstone-build-a-toy-blockchain";
const TAMPERED_TX = "alice pays bob 9";

/** One block rendered as a small card: its index, the previous block's hash it links to, its Merkle root, its winning nonce, and its own hash. */
function BlockCard({ block, invalid, title }: { block: ToyBlock; invalid: boolean; title: string }) {
  return (
    <div className={invalid ? chainStyles.blockInvalid : chainStyles.block}>
      <span className={chainStyles.blockTitle}>{title}{invalid ? " — invalid" : ""}</span>
      <span className={chainStyles.blockRow}>prevHash: {block.prevHash}</span>
      <span className={chainStyles.blockRow}>merkleRoot: {block.merkleRoot}</span>
      <span className={chainStyles.blockRow}>nonce: {block.nonce}</span>
      <span className={chainStyles.blockRow}>hash: {block.hash}</span>
    </div>
  );
}

/** Intuition beat: the 2-block chain as mined, genesis through block 2 — every field traces back to a chapter already built. */
export function IntuitionDemo() {
  return (
    <div className={chainStyles.wrap}>
      <div className={chainStyles.block}>
        <span className={chainStyles.blockTitle}>genesis</span>
        <span className={chainStyles.blockRow}>hash: {GENESIS_HASH}</span>
      </div>
      <span className={chainStyles.arrow}>→</span>
      <BlockCard block={TOY_CHAIN[0]} invalid={false} title="Block 1" />
      <span className={chainStyles.arrow}>→</span>
      <BlockCard block={TOY_CHAIN[1]} invalid={false} title="Block 2" />
    </div>
  );
}

/** Play beat: tamper with block 1's first transaction and watch the Merkle root, the block's hash, and the link to block 2 all break in sequence. */
export function PlayDemo() {
  const [tampered, setTampered] = useState(false);
  const txsBlock1 = tampered ? [TAMPERED_TX, ...BLOCK_1_TXS.slice(1)] : BLOCK_1_TXS;

  const recomputedRoot1 = merkleRoot(txsBlock1);
  const recomputedHash1 = capstoneBlockHash(TOY_CHAIN[0].prevHash, recomputedRoot1, TOY_CHAIN[0].nonce);
  const block1Valid = recomputedHash1 === TOY_CHAIN[0].hash && meetsTarget(recomputedHash1, DIFFICULTY_TARGET);
  const block2Valid = TOY_CHAIN[1].prevHash === recomputedHash1;

  return (
    <>
      <div className={chainStyles.wrap}>
        <div className={chainStyles.block}>
          <span className={chainStyles.blockTitle}>genesis</span>
          <span className={chainStyles.blockRow}>hash: {GENESIS_HASH}</span>
        </div>
        <span className={chainStyles.arrow}>→</span>
        <BlockCard block={{ ...TOY_CHAIN[0], merkleRoot: recomputedRoot1, hash: recomputedHash1 }} invalid={!block1Valid} title="Block 1" />
        <span className={chainStyles.arrow}>→</span>
        <BlockCard block={TOY_CHAIN[1]} invalid={!block2Valid} title="Block 2" />
      </div>
      <div className={styles.buttons}>
        <button type="button" className={tampered ? styles.button : styles.buttonActive} onClick={() => setTampered(false)}>
          Original
        </button>
        <button type="button" className={tampered ? styles.buttonActive : styles.button} onClick={() => setTampered(true)}>
          Tamper block 1&apos;s tx 0
        </button>
      </div>
      <p className={styles.stepCount}>
        {tampered
          ? `Merkle root changed (${recomputedRoot1} instead of ${TOY_CHAIN[0].merkleRoot}) → block 1's hash changed (${recomputedHash1} instead of ${TOY_CHAIN[0].hash}), which no longer meets the target and no longer matches what block 2's prevHash points to.`
          : "Both blocks are exactly as mined — every hash matches, and every link points at the block before it."}
      </p>
    </>
  );
}

/** Checkpoint: mine block 3 onto block 2's hash, reusing the Merkle root of a fixed transaction set and the same proof-of-work search as the mining chapter. */
export function MiningCheckpoint() {
  const BLOCK_3_TXS = useMemo(
    () => ["grace pays alice 4", "alice pays henry 2", "henry pays bob 1", "bob pays grace 3"],
    [],
  );
  const root3 = useMemo(() => merkleRoot(BLOCK_3_TXS), [BLOCK_3_TXS]);
  const prevHash = TOY_CHAIN[TOY_CHAIN.length - 1].hash;

  const [nonce, setNonce] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const id = useId();

  const hash = nonce === null ? null : capstoneBlockHash(prevHash, root3, nonce);
  const passed = hash !== null && meetsTarget(hash, DIFFICULTY_TARGET);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Block 3 commits its 4 transactions to Merkle root {root3} and chains onto block 2&apos;s hash ({prevHash}).
          Find a nonce whose hash drops under the difficulty target of {DIFFICULTY_TARGET}.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Slide to search for a winning nonce"
    >
      <div className={styles.sliderRow}>
        <label htmlFor={id}>nonce = {nonce ?? 0}</label>
        <input
          id={id}
          type="range"
          min={0}
          max={MAX_NONCE}
          step={1}
          value={nonce ?? 0}
          onChange={(e) => {
            setHasInteracted(true);
            setNonce(Number(e.target.value));
          }}
          style={{ width: 220 }}
        />
      </div>
      {hash !== null && (
        <p className={styles.stepCount}>
          hash = {hash} {passed ? "— under the target, block 3 is mined ✓" : "— over the target, try another nonce"}
        </p>
      )}
    </CheckpointFrame>
  );
}
