"use client";

import { useEffect, useState } from "react";
import { StateTrack } from "@/components/viz/StateTrack";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  STATES,
  GOAL_STATE,
  transition,
  reward,
  isTerminal,
  valueOfAlwaysRight,
  type Action,
} from "@/lib/math-core/markov-decision-processes";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "markov-decision-processes";
const GAMMA = 0.9;

interface GameState {
  state: number;
  rewards: number[];
}

const INITIAL_GAME: GameState = { state: 0, rewards: [] };

/** A single atomic update — combining state+rewards into one object avoids nesting a setState call
 * inside another's updater, which would double-fire under React StrictMode's dev-mode double-invocation. */
function applyMove(game: GameState, action: Action): GameState {
  if (isTerminal(game.state)) return game;
  const next = transition(game.state, action);
  return { state: next, rewards: [...game.rewards, reward(next)] };
}

function discountedReturnSoFar(rewards: number[]): number {
  return rewards.reduce((s, r, i) => s + Math.pow(GAMMA, i) * r, 0);
}

/** Intuition beat: drive the agent yourself, watching state, reward, and discounted return live. */
export function IntuitionDemo() {
  const [game, setGame] = useState(INITIAL_GAME);
  const returnSoFar = discountedReturnSoFar(game.rewards);

  return (
    <>
      <StateTrack
        states={STATES}
        currentState={game.state}
        goalState={GOAL_STATE}
        readout={`${game.rewards.length} moves — discounted return so far: ${returnSoFar.toFixed(2)}${isTerminal(game.state) ? " — reached the goal" : ""}`}
      />
      <div className={styles.buttons}>
        <button type="button" className={styles.button} onClick={() => setGame((g) => applyMove(g, "left"))} disabled={isTerminal(game.state)}>
          Move left
        </button>
        <button type="button" className={styles.button} onClick={() => setGame((g) => applyMove(g, "right"))} disabled={isTerminal(game.state)}>
          Move right
        </button>
      </div>
    </>
  );
}

/** Play beat: see the "always right" policy's own value function laid out on the track. */
export function PlayDemo() {
  const valueLabels = STATES.map((s) => `V=${valueOfAlwaysRight(s).toFixed(1)}`);
  return (
    <StateTrack
      states={STATES}
      currentState={0}
      goalState={GOAL_STATE}
      valueLabels={valueLabels}
      readout="V(s) under the always-right policy — higher near the goal, discounted going backward"
    />
  );
}

/** Checkpoint: reach the goal with a discounted return above 5 — only a near-direct path clears it. */
export function MdpCheckpoint() {
  const [game, setGame] = useState(INITIAL_GAME);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const returnSoFar = discountedReturnSoFar(game.rewards);
  const passed = isTerminal(game.state) && returnSoFar > 5;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  const move = (action: Action) => {
    setHasInteracted(true);
    setGame((g) => applyMove(g, action));
  };

  return (
    <CheckpointFrame
      instructions={<>Reach the goal with a discounted return above <strong>5</strong> — wasted moves cost you.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Move to try it"
    >
      <StateTrack
        states={STATES}
        currentState={game.state}
        goalState={GOAL_STATE}
        readout={`discounted return: ${returnSoFar.toFixed(2)}`}
      />
      <div className={styles.buttons}>
        <button type="button" className={styles.button} onClick={() => move("left")} disabled={isTerminal(game.state)}>
          Move left
        </button>
        <button type="button" className={styles.button} onClick={() => move("right")} disabled={isTerminal(game.state)}>
          Move right
        </button>
      </div>
    </CheckpointFrame>
  );
}
