"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { MultiCurvePlayground } from "@/components/viz/MultiCurvePlayground";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { bernoulliPmf, poissonPmf, gaussianPdf, dirichletMean } from "@/lib/math-core/common-probability-distributions";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";
import candidateStyles from "./Candidates.module.css";

const CONCEPT_ID = "common-probability-distributions";
const BERNOULLI_P = 0.3;
const POISSON_LAMBDA = 2;
const DIRICHLET_ALPHA = [2, 3, 5];

type Dist = "bernoulli" | "poisson" | "gaussian" | "dirichlet";

const DIST_LABELS: Record<Dist, string> = {
  bernoulli: "Bernoulli(p=0.3)",
  poisson: "Poisson(λ=2)",
  gaussian: "Gaussian(μ=0, σ=1)",
  dirichlet: "Dirichlet(α=[2,3,5])",
};

function DistPicker({ value, onChange }: { value: Dist; onChange: (d: Dist) => void }) {
  return (
    <div className={styles.buttons}>
      {(Object.keys(DIST_LABELS) as Dist[]).map((d) => (
        <button key={d} type="button" className={value === d ? styles.buttonActive : styles.button} onClick={() => onChange(d)}>
          {d}
        </button>
      ))}
    </div>
  );
}

function DistributionView({ dist }: { dist: Dist }) {
  if (dist === "bernoulli") {
    return (
      <ContributionBars
        items={[
          { label: "P(X=0)", value: bernoulliPmf(BERNOULLI_P, 0) },
          { label: "P(X=1)", value: bernoulliPmf(BERNOULLI_P, 1) },
        ]}
        max={1}
        formatValue={(v) => v.toFixed(2)}
        readout={DIST_LABELS.bernoulli}
      />
    );
  }
  if (dist === "poisson") {
    return (
      <ContributionBars
        items={[0, 1, 2, 3].map((k) => ({ label: `P(X=${k})`, value: poissonPmf(POISSON_LAMBDA, k) }))}
        formatValue={(v) => v.toFixed(4)}
        readout={DIST_LABELS.poisson}
      />
    );
  }
  if (dist === "dirichlet") {
    const mean = dirichletMean(DIRICHLET_ALPHA);
    return (
      <ContributionBars
        items={mean.map((m, i) => ({ label: `E[p${i + 1}] (α=${DIRICHLET_ALPHA[i]})`, value: m }))}
        max={1}
        formatValue={(v) => v.toFixed(2)}
        readout={`${DIST_LABELS.dirichlet} — expected probability vector`}
      />
    );
  }
  const points = Array.from({ length: 25 }, (_, i) => {
    const x = -3 + i * 0.25;
    return { x, y: gaussianPdf(x, 0, 1) };
  });
  const scatterPoints = [0, 1, 2].map((z) => ({ x: z, y: gaussianPdf(z, 0, 1) }));
  return (
    <MultiCurvePlayground
      curves={[{ points, variant: "fitHighlight" }]}
      domain={[-3, 3]}
      rangeDomain={[0, 0.45]}
      scatterPoints={scatterPoints}
      readout={`pdf(0)=${gaussianPdf(0, 0, 1).toFixed(4)}, pdf(1)=${gaussianPdf(1, 0, 1).toFixed(4)}, pdf(2)=${gaussianPdf(2, 0, 1).toFixed(4)}`}
    />
  );
}

/** Intuition beat: toggle between the four named distributions and see each one's exact values. */
export function IntuitionDemo() {
  const [dist, setDist] = useState<Dist>("bernoulli");
  return (
    <>
      <DistPicker value={dist} onChange={setDist} />
      <DistributionView dist={dist} />
    </>
  );
}

/** Play beat: same toggle, now paired with the formula each distribution corresponds to. */
export function PlayDemo() {
  const [dist, setDist] = useState<Dist>("poisson");
  return (
    <>
      <DistPicker value={dist} onChange={setDist} />
      <DistributionView dist={dist} />
    </>
  );
}

const TARGET = 2 * Math.exp(-2);
const CANDIDATES = [
  { label: "0.2707", value: 2 * Math.exp(-2) },
  { label: "0.1353", value: Math.exp(-2) },
  { label: "0.1804", value: (4 / 3) * Math.exp(-2) },
  { label: "2", value: 2 },
];

/** Checkpoint: compute one exact Poisson probability by hand, distinguishing it from neighboring k's and from λ itself. */
export function DistributionsCheckpoint() {
  const [chosen, setChosen] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const passed = chosen !== null && Math.abs(chosen - TARGET) < 1e-9;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>For <strong>Poisson(λ=2)</strong>, what is <code>P(X=2)</code>?</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a value to try it"
    >
      <div className={candidateStyles.candidateList}>
        {CANDIDATES.map((c) => (
          <button
            key={c.label}
            type="button"
            className={chosen === c.value ? candidateStyles.candidateActive : candidateStyles.candidate}
            onClick={() => {
              setHasInteracted(true);
              setChosen(c.value);
            }}
          >
            {c.label}
          </button>
        ))}
      </div>
    </CheckpointFrame>
  );
}
