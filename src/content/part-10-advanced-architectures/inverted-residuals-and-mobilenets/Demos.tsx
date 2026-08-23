"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  CHANNEL_OPTIONS,
  standardConvParams,
  depthwiseSeparableParams,
  standardConvFlops,
  depthwiseSeparableFlops,
  paramReductionRatio,
  invertedResidualParams,
  denseMiddleBottleneckParams,
} from "@/lib/math-core/inverted-residuals-and-mobilenets";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";

const CONCEPT_ID = "inverted-residuals-and-mobilenets";
const RATIO_TARGET = 0.15;

/** Intuition beat: same 3x3 kernel, same 4x4 output — only whether the conv is dense or depthwise-separable changes. */
export function IntuitionDemo() {
  const [channels, setChannels] = useState(8);
  const standard = standardConvParams(channels, channels);
  const separable = depthwiseSeparableParams(channels, channels);
  return (
    <>
      <div className={styles.buttons}>
        {CHANNEL_OPTIONS.map((c) => (
          <button key={c} type="button" className={c === channels ? styles.buttonActive : styles.button} onClick={() => setChannels(c)}>
            {c} channels
          </button>
        ))}
      </div>
      <ContributionBars
        items={[
          { label: "standard 3x3 conv", value: standard },
          { label: "depthwise-separable", value: separable },
        ]}
        formatValue={(v) => v.toFixed(0)}
        readout={`at ${channels} channels: separable uses ${((separable / standard) * 100).toFixed(1)}% of the standard conv's parameters`}
      />
    </>
  );
}

/** Play beat: the full channel sweep, now showing FLOPs and the exact param-reduction ratio alongside it. */
export function PlayDemo() {
  const items = CHANNEL_OPTIONS.map((c) => ({
    label: `${c} ch`,
    value: paramReductionRatio(c),
  }));
  const c = 16;
  const flopsStandard = standardConvFlops(c, c);
  const flopsSeparable = depthwiseSeparableFlops(c, c);
  return (
    <>
      <ContributionBars
        items={items}
        formatValue={(v) => v.toFixed(3)}
        max={1}
        readout="separable/standard parameter ratio — shrinking as channel count grows, toward a floor of 1/k²"
      />
      <ContributionBars
        items={[
          { label: `standard FLOPs @ ${c}ch`, value: flopsStandard },
          { label: `separable FLOPs @ ${c}ch`, value: flopsSeparable },
        ]}
        formatValue={(v) => v.toLocaleString()}
      />
    </>
  );
}

/** Checkpoint: find the channel count where the separable/standard ratio first drops below 0.15. */
export function MobileNetCheckpoint() {
  const [channels, setChannels] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const ratio = channels === null ? null : paramReductionRatio(channels);
  const passed = ratio !== null && ratio < RATIO_TARGET;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>Find the channel count where the separable/standard parameter ratio first drops <strong>below {RATIO_TARGET}</strong>.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a channel count to try it"
    >
      <div className={styles.buttons}>
        {CHANNEL_OPTIONS.map((c) => (
          <button
            key={c}
            type="button"
            className={c === channels ? styles.buttonActive : styles.button}
            onClick={() => {
              setHasInteracted(true);
              setChannels(c);
            }}
          >
            {c} channels
          </button>
        ))}
      </div>
      {ratio !== null && (
        <ContributionBars
          items={[
            { label: "separable/standard ratio", value: ratio },
            { label: "inverted-residual/dense-middle ratio", value: invertedResidualParams(channels!) / denseMiddleBottleneckParams(channels!) },
          ]}
          formatValue={(v) => v.toFixed(3)}
          max={1}
        />
      )}
    </CheckpointFrame>
  );
}
