"use client";

import { useEffect, useState } from "react";
import { TokenChips } from "@/components/viz/TokenChips";
import { VectorPlayground } from "@/components/viz/VectorPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  START_POSITION,
  WORKSPACE_BOUND,
  actionFromInstruction,
  nextPosition,
  INTUITION_INSTRUCTIONS,
  PLAY_INSTRUCTIONS,
  CHECKPOINT_INSTRUCTION,
} from "@/lib/math-core/embodied-ai-and-vla-robotics";
import { withinDistance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";
import vlaStyles from "./Vla.module.css";

const CONCEPT_ID = "embodied-ai-and-vla-robotics";
const DOMAIN: [number, number] = [-WORKSPACE_BOUND - 1, WORKSPACE_BOUND + 1];
const TOLERANCE = 0.3;

/** Intuition beat: toggle between two single-axis instructions and watch the same arm move differently. */
export function IntuitionDemo() {
  const [index, setIndex] = useState(0);
  const instruction = INTUITION_INSTRUCTIONS[index];
  const pos = nextPosition(START_POSITION, instruction.tokens);

  return (
    <>
      <div className={styles.buttons}>
        {INTUITION_INSTRUCTIONS.map((instr, i) => (
          <button key={instr.label} type="button" className={i === index ? styles.buttonActive : styles.button} onClick={() => setIndex(i)}>
            &ldquo;{instr.label}&rdquo;
          </button>
        ))}
      </div>
      <div className={vlaStyles.tokenRow}>
        <TokenChips tokens={instruction.tokens} />
      </div>
      <VectorPlayground vectors={[{ x: pos.x, y: pos.y }]} domain={DOMAIN} size={260} />
      <div className={vlaStyles.readout}>
        <p>
          Camera observation (fixed): end effector at ({START_POSITION.x}, {START_POSITION.y})
        </p>
        <p>
          Action = sum of token vectors = ({pos.x}, {pos.y})
        </p>
      </div>
    </>
  );
}

/** Play beat: three multi-token instructions side by side, each resolving to an exact resulting position. */
export function PlayDemo() {
  return (
    <div className={vlaStyles.table}>
      <div className={vlaStyles.row}>
        <span className={vlaStyles.rowHeader}>instruction</span>
        <span className={vlaStyles.rowHeader}>action</span>
        <span className={vlaStyles.rowHeader}>next position</span>
      </div>
      {PLAY_INSTRUCTIONS.map((instr) => {
        const action = actionFromInstruction(instr.tokens);
        const pos = nextPosition(START_POSITION, instr.tokens);
        return (
          <div className={vlaStyles.row} key={instr.label}>
            <span>
              <TokenChips tokens={instr.tokens} />
            </span>
            <span>
              ({action.x}, {action.y})
            </span>
            <span>
              ({pos.x}, {pos.y})
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Checkpoint: an unseen instruction. Drag the end effector to the position the policy would actually produce. */
export function VlaCheckpoint() {
  const [vector, setVector] = useState({ x: 0, y: 0 });
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const target = nextPosition(START_POSITION, CHECKPOINT_INSTRUCTION.tokens);
  const passed = withinDistance(vector, target, TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          The instruction is &ldquo;{CHECKPOINT_INSTRUCTION.label}&rdquo;. Drag the end effector to the position
          this instruction's action vector, applied from the origin, would actually produce.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag the arrow's tip to try it"
    >
      <TokenChips tokens={CHECKPOINT_INSTRUCTION.tokens} />
      <VectorPlayground
        vectors={[{ x: vector.x, y: vector.y, draggable: true }]}
        onChangeVector={(_, next) => {
          setHasInteracted(true);
          setVector(next);
        }}
        domain={DOMAIN}
        size={260}
        passed={passed}
        readout={`current: (${vector.x.toFixed(1)}, ${vector.y.toFixed(1)})`}
      />
    </CheckpointFrame>
  );
}
