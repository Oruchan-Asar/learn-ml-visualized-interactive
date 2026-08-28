"use client";

import { useEffect, useId, useState } from "react";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  N,
  PUBLIC_Y,
  honestRound,
  cheatProbability,
  type Challenge,
} from "@/lib/math-core/zero-knowledge-proofs";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import traceStyles from "./Trace.module.css";
import styles from "../ipfs-and-content-addressed-storage/Controls.module.css";

const CONCEPT_ID = "zero-knowledge-proofs";
const DEMO_R = 4;

function RoundTrace({ challenge }: { challenge: Challenge }) {
  const round = honestRound(DEMO_R, challenge);
  return (
    <div className={traceStyles.trace}>
      <p>
        <span className={traceStyles.tag}>Commit</span> Prover picks random r = {DEMO_R}, sends c = r² mod {N} ={" "}
        <code>{round.commitment}</code>. (The verifier never learns r itself yet.)
      </p>
      <p>
        <span className={traceStyles.tag}>Challenge</span> Verifier flips a coin and asks for branch{" "}
        <code>{challenge}</code>.
      </p>
      <p>
        <span className={traceStyles.tag}>Respond</span>{" "}
        {challenge === 0 ? (
          <>Prover reveals r = <code>{round.response}</code> directly.</>
        ) : (
          <>Prover reveals z = r·x mod {N} = <code>{round.response}</code> — never x itself.</>
        )}
      </p>
      <p className={traceStyles.final}>
        <span className={round.passed ? traceStyles.pass : traceStyles.fail}>
          {round.passed ? "✓ Verified" : "✗ Rejected"}
        </span>{" "}
        — the check for branch {challenge} {round.passed ? "holds" : "fails"}.
      </p>
    </div>
  );
}

/** Intuition beat: flip which branch the verifier challenges and see the honest prover pass either way,
 *  each time revealing only one of two values — never the secret x itself. */
export function IntuitionDemo() {
  const [challenge, setChallenge] = useState<Challenge>(0);
  return (
    <>
      <div className={styles.buttons}>
        <button type="button" className={challenge === 0 ? styles.buttonActive : styles.button} onClick={() => setChallenge(0)}>
          Challenge = 0 (reveal r)
        </button>
        <button type="button" className={challenge === 1 ? styles.buttonActive : styles.button} onClick={() => setChallenge(1)}>
          Challenge = 1 (reveal r·x mod n)
        </button>
      </div>
      <RoundTrace challenge={challenge} />
    </>
  );
}

function RoundsSlider({ value, onChange }: { value: number; onChange: (rounds: number) => void }) {
  const id = useId();
  return (
    <div className={styles.row}>
      <label htmlFor={id}>rounds = {value}</label>
      <input id={id} type="range" min={1} max={10} step={1} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

/** Play beat: watch the cheating probability collapse as independent rounds stack up. */
export function PlayDemo() {
  const [rounds, setRounds] = useState(1);
  const p = cheatProbability(rounds);
  return (
    <>
      <div className={traceStyles.trace}>
        <p>
          y = x² mod {N} = <code>{PUBLIC_Y}</code> is public; x itself is never revealed, in any round.
        </p>
        <p className={traceStyles.final}>
          After {rounds} independent round{rounds === 1 ? "" : "s"}, an impostor who doesn&rsquo;t know x fools the
          verifier with probability (1/2)<sup>{rounds}</sup> = <code>{p.toFixed(rounds > 6 ? 5 : 4)}</code> (
          {(p * 100).toFixed(2)}%).
        </p>
      </div>
      <div className={styles.controls}>
        <RoundsSlider value={rounds} onChange={setRounds} />
      </div>
    </>
  );
}

/** Checkpoint: find the smallest number of rounds that pushes cheating probability at or below 5%. */
export function ZeroKnowledgeCheckpoint() {
  const [rounds, setRounds] = useState(1);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const p = cheatProbability(rounds);
  const passed = p <= 0.05;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Move the rounds slider until an impostor&rsquo;s cheating probability drops to <strong>5% or below</strong>.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Move the slider to try it"
    >
      <div className={traceStyles.trace}>
        <p className={traceStyles.final}>
          {rounds} round{rounds === 1 ? "" : "s"} → cheating probability = <code>{p.toFixed(5)}</code> ({(p * 100).toFixed(2)}%)
        </p>
      </div>
      <div className={styles.controls}>
        <RoundsSlider
          value={rounds}
          onChange={(r) => {
            setHasInteracted(true);
            setRounds(r);
          }}
        />
      </div>
    </CheckpointFrame>
  );
}
