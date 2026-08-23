"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import { TESTS, PATCHES, testResults, passCount, passRate, resolvesIssue, type PatchId } from "@/lib/math-core/agent-benchmarking-and-swe-bench";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import buttonStyles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";
import suiteStyles from "./TestSuite.module.css";

const CONCEPT_ID = "agent-benchmarking-and-swe-bench";

function patchBarItems() {
  return PATCHES.map((p) => ({ label: `Patch ${p.id}`, value: passRate(p.id) }));
}

function verdict(id: PatchId): string {
  return `Patch ${id}: ${passCount(id)}/${TESTS.length} — ${resolvesIssue(id) ? "resolves the issue" : "does not resolve the issue"}`;
}

function PatchPicker({ selected, onSelect }: { selected: PatchId | null; onSelect: (id: PatchId) => void }) {
  return (
    <div className={buttonStyles.buttons}>
      {PATCHES.map((p) => (
        <button
          key={p.id}
          type="button"
          className={p.id === selected ? buttonStyles.buttonActive : buttonStyles.button}
          onClick={() => onSelect(p.id)}
        >
          Patch {p.id}
        </button>
      ))}
    </div>
  );
}

/** Per-hidden-test pass/fail breakdown for one patch. */
function TestList({ patchId }: { patchId: PatchId }) {
  const results = testResults(patchId);
  return (
    <div className={suiteStyles.list}>
      {TESTS.map((t, i) => (
        <div className={results[i] ? suiteStyles.rowPass : suiteStyles.rowFail} key={t.label}>
          <span className={suiteStyles.mark}>{results[i] ? "✓" : "✗"}</span>
          <span className={suiteStyles.label}>{t.label}</span>
          <span className={suiteStyles.expected}>expected {t.expected}</span>
        </div>
      ))}
    </div>
  );
}

/** Intuition beat: pick a patch, see its exact pass/fail per hidden test, and how all three compare on the scoreboard. */
export function IntuitionDemo() {
  const [patchId, setPatchId] = useState<PatchId>("A");
  return (
    <>
      <PatchPicker selected={patchId} onSelect={setPatchId} />
      <TestList patchId={patchId} />
      <ContributionBars
        items={patchBarItems()}
        max={1}
        formatValue={(v) => `${Math.round(v * TESTS.length)}/${TESTS.length}`}
        readout={verdict(patchId)}
      />
    </>
  );
}

/** Play beat: same widget, now naming the actual SWE-bench verdict — resolved or not — for the selected patch. */
export function PlayDemo() {
  const [patchId, setPatchId] = useState<PatchId>("B");
  return (
    <>
      <PatchPicker selected={patchId} onSelect={setPatchId} />
      <TestList patchId={patchId} />
      <ContributionBars
        items={patchBarItems()}
        max={1}
        formatValue={(v) => `${Math.round(v * TESTS.length)}/${TESTS.length}`}
        readout={verdict(patchId)}
      />
    </>
  );
}

/** Checkpoint: find the one patch, among three, that resolves the issue outright — passes every hidden test. */
export function BenchmarkCheckpoint() {
  const [chosen, setChosen] = useState<PatchId | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const passed = chosen !== null && resolvesIssue(chosen);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Select the one patch, among the three, that <strong>resolves the issue</strong> — passes every test in the
          hidden suite.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a patch to try it"
    >
      <PatchPicker
        selected={chosen}
        onSelect={(id) => {
          setHasInteracted(true);
          setChosen(id);
        }}
      />
      {chosen !== null && (
        <>
          <TestList patchId={chosen} />
          <ContributionBars
            items={patchBarItems()}
            max={1}
            formatValue={(v) => `${Math.round(v * TESTS.length)}/${TESTS.length}`}
            readout={verdict(chosen)}
          />
        </>
      )}
    </CheckpointFrame>
  );
}
