"use client";

import { useEffect, useId, useState } from "react";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { TOKENS, TOKEN_LABELS, DEFAULT_BIAS, BIAS_DOMAIN, transformerBlock } from "@/lib/math-core/transformer-block";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";
import localStyles from "./TransformerBlock.module.css";

const CONCEPT_ID = "the-transformer-block";

function fmt(v: number[]): string {
  return `[${v.map((x) => x.toFixed(2)).join(", ")}]`;
}

function BiasSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const id = useId();
  return (
    <div className={styles.sliderRow}>
      <label htmlFor={id}>FFN bias = {value.toFixed(2)}</label>
      <input
        id={id}
        type="range"
        min={BIAS_DOMAIN[0]}
        max={BIAS_DOMAIN[1]}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function Pipeline({ bias }: { bias: number }) {
  const block = transformerBlock(bias);
  return (
    <div className={localStyles.pipeline}>
      <div className={localStyles.stageLabel}>input</div>
      {TOKENS.map((t, i) => (
        <div key={i} className={localStyles.vectorRow}>
          <span>{TOKEN_LABELS[i]}</span> <span>{fmt(t)}</span>
        </div>
      ))}

      <div className={localStyles.stageLabel}>self-attention output</div>
      {block.attentionOut.map((v, i) => (
        <div key={i} className={localStyles.vectorRow}>
          <span>{TOKEN_LABELS[i]}</span> <span>{fmt(v)}</span>
        </div>
      ))}

      <div className={localStyles.stageLabel}>add &amp; norm (residual 1 → norm1)</div>
      {block.norm1.map((v, i) => (
        <div key={i} className={localStyles.vectorRow}>
          <span>{TOKEN_LABELS[i]}</span> <span>{fmt(v)}</span>
        </div>
      ))}

      <div className={localStyles.stageLabel}>feedforward hidden units (ReLU)</div>
      {block.ffn.map((f, i) => (
        <div key={i} className={localStyles.vectorRow}>
          <span>{TOKEN_LABELS[i]}</span>{" "}
          <span className={Math.max(...f.hidden) === 0 ? localStyles.dead : undefined}>
            {fmt(f.hidden)}
            {Math.max(...f.hidden) === 0 ? " — dead" : ""}
          </span>
        </div>
      ))}

      <div className={localStyles.stageLabel}>add &amp; norm (residual 2 → norm2, block output)</div>
      {block.norm2.map((v, i) => (
        <div key={i} className={localStyles.vectorRow}>
          <span>{TOKEN_LABELS[i]}</span> <span>{fmt(v)}</span>
        </div>
      ))}
    </div>
  );
}

/** Intuition beat: the full pipeline, end to end, for two tokens. */
export function IntuitionDemo() {
  return <Pipeline bias={DEFAULT_BIAS} />;
}

/** Play beat: adjust the feedforward bias — watch x1's hidden units switch on. */
export function PlayDemo() {
  const [bias, setBias] = useState(DEFAULT_BIAS);
  return (
    <>
      <Pipeline bias={bias} />
      <div className={styles.controls}>
        <BiasSlider value={bias} onChange={setBias} />
      </div>
    </>
  );
}

/** Checkpoint: find a bias where x1's feedforward sublayer actually does something, instead of relying entirely on the residual. */
export function TransformerBlockCheckpoint() {
  const [bias, setBias] = useState(DEFAULT_BIAS);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const block = transformerBlock(bias);

  const passed = Math.max(...block.ffn[0].hidden) > 0;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Raise the feedforward bias until <strong>x1</strong>&rsquo;s hidden layer has at least one active
          (non-zero) unit.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Drag the slider to try it"
    >
      <Pipeline bias={bias} />
      <div className={styles.controls}>
        <BiasSlider
          value={bias}
          onChange={(v) => {
            setHasInteracted(true);
            setBias(v);
          }}
        />
      </div>
    </CheckpointFrame>
  );
}
