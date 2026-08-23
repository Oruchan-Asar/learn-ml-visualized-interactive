"use client";

import { useEffect, useId, useState } from "react";
import { GraphPlayground, type GraphNodeSpec } from "@/components/viz/GraphPlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  GRAPH,
  GRAPH_EDGES,
  OUTPUT_ID,
  forwardPass,
  backwardPass,
  numericalGradient,
} from "@/lib/math-core/capstone-autograd-engine";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "capstone-autograd-engine";

const NODE_LABEL: Record<string, string> = { a: "a", b: "b", n1: "a·b", n2: "a·b + a" };

function toNodeSpecs(values: Record<string, number>): GraphNodeSpec[] {
  return GRAPH.map((node) => ({
    id: node.id,
    x: node.x,
    y: node.y,
    value: values[node.id],
    label: NODE_LABEL[node.id],
  }));
}

function ABSliders({
  a,
  b,
  onChangeA,
  onChangeB,
}: {
  a: number;
  b: number;
  onChangeA: (v: number) => void;
  onChangeB: (v: number) => void;
}) {
  const idA = useId();
  const idB = useId();
  return (
    <div className={styles.controls}>
      <div className={styles.sliderRow}>
        <label htmlFor={idA}>a = {a}</label>
        <input id={idA} type="range" min={-5} max={5} step={1} value={a} onChange={(e) => onChangeA(Number(e.target.value))} />
      </div>
      <div className={styles.sliderRow}>
        <label htmlFor={idB}>b = {b}</label>
        <input id={idB} type="range" min={-5} max={5} step={1} value={b} onChange={(e) => onChangeB(Number(e.target.value))} />
      </div>
    </div>
  );
}

/** Intuition beat: just the forward pass — tune a and b, watch every node's value update through the graph. */
export function IntuitionDemo() {
  const [a, setA] = useState(3);
  const [b, setB] = useState(4);
  const values = forwardPass({ a, b });

  return (
    <>
      <GraphPlayground
        nodes={toNodeSpecs(values)}
        edges={GRAPH_EDGES}
        focusNodeId={OUTPUT_ID}
        readout={`forward pass: f(${a}, ${b}) = ${values[OUTPUT_ID]}`}
      />
      <ABSliders a={a} b={b} onChangeA={setA} onChangeB={setB} />
    </>
  );
}

/** Play beat: toggle forward values vs backward gradients on the same graph, cross-checked numerically. */
export function PlayDemo() {
  const [a, setA] = useState(3);
  const [b, setB] = useState(4);
  const [view, setView] = useState<"forward" | "backward">("forward");
  const values = forwardPass({ a, b });
  const grads = backwardPass(values);
  const numeric = numericalGradient(a, b);

  const displayValues = view === "forward" ? values : grads;
  const nodes = GRAPH.map((node) => ({
    id: node.id,
    x: node.x,
    y: node.y,
    value: displayValues[node.id],
    label: view === "forward" ? NODE_LABEL[node.id] : `∂f/∂${node.id}`,
  }));

  return (
    <>
      <GraphPlayground
        nodes={nodes}
        edges={GRAPH_EDGES}
        focusNodeId={OUTPUT_ID}
        readout={
          view === "forward"
            ? `f(${a}, ${b}) = ${values[OUTPUT_ID]}`
            : `∂f/∂a = ${grads.a} (numeric: ${numeric.da.toFixed(3)}), ∂f/∂b = ${grads.b} (numeric: ${numeric.db.toFixed(3)})`
        }
      />
      <div className={styles.controls}>
        <div className={styles.buttons}>
          <button type="button" className={view === "forward" ? styles.buttonActive : styles.button} onClick={() => setView("forward")}>
            Forward pass
          </button>
          <button type="button" className={view === "backward" ? styles.buttonActive : styles.button} onClick={() => setView("backward")}>
            Backward pass
          </button>
        </div>
      </div>
      <ABSliders a={a} b={b} onChangeA={setA} onChangeB={setB} />
    </>
  );
}

const CHECKPOINT_A = 5;
const CHECKPOINT_B = -2;
const CANDIDATES = [-1, -2, 1, 5];
const CORRECT_DA = backwardPass(forwardPass({ a: CHECKPOINT_A, b: CHECKPOINT_B })).a;

/** Checkpoint: at a=5, b=-2, compute ∂f/∂a by hand — it must combine BOTH paths that use `a`. */
export function AutogradCheckpoint() {
  const [chosen, setChosen] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const passed = chosen === CORRECT_DA;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  const values = forwardPass({ a: CHECKPOINT_A, b: CHECKPOINT_B });

  return (
    <CheckpointFrame
      instructions={
        <>
          At <strong>a = 5, b = −2</strong>, compute <code>∂f/∂a</code> for <code>f(a,b) = a·b + a</code>.
          Remember: <code>a</code> feeds <em>two</em> nodes, so its gradient must combine both paths.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Compute ∂f/∂a, then pick a value"
    >
      <GraphPlayground
        nodes={toNodeSpecs(values)}
        edges={GRAPH_EDGES}
        focusNodeId={OUTPUT_ID}
        passed={passed}
        readout={`forward pass: f(5, -2) = ${values[OUTPUT_ID]}`}
      />
      <div className={styles.buttons} style={{ marginTop: 12 }}>
        {CANDIDATES.map((c) => (
          <button
            key={c}
            type="button"
            className={c === chosen ? styles.buttonActive : styles.button}
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
