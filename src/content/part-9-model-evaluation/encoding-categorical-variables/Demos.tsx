"use client";

import { useEffect, useState } from "react";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  ROWS,
  CATEGORIES,
  SF_ROW_INDEX,
  ordinalEncode,
  oneHotEncode,
  naiveTargetEncode,
  leaveOneOutTargetEncode,
  type EncodingScheme,
} from "@/lib/math-core/encoding-categorical-variables";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import buttonStyles from "../../part-2-classical-ml/gradient-descent-variants/DescentControls.module.css";
import tableStyles from "./EncodingTable.module.css";

const CONCEPT_ID = "encoding-categorical-variables";
const TOLERANCE = 0.001;

const SCHEME_LABELS: Record<EncodingScheme, string> = {
  ordinal: "Ordinal",
  oneHot: "One-hot",
  naiveTarget: "Naive target",
  leaveOneOutTarget: "Leave-one-out target",
};

function SchemePicker({
  schemes,
  selected,
  onSelect,
}: {
  schemes: EncodingScheme[];
  selected: EncodingScheme;
  onSelect: (s: EncodingScheme) => void;
}) {
  return (
    <div className={buttonStyles.buttons}>
      {schemes.map((s) => (
        <button
          key={s}
          type="button"
          className={s === selected ? buttonStyles.buttonActive : buttonStyles.button}
          onClick={() => onSelect(s)}
        >
          {SCHEME_LABELS[s]}
        </button>
      ))}
    </div>
  );
}

/** Renders the 6-row table under whichever encoding scheme is currently selected. */
function EncodingTable({ scheme }: { scheme: EncodingScheme }) {
  const ordinal = ordinalEncode();
  const oneHot = oneHotEncode();
  const naive = naiveTargetEncode();
  const loo = leaveOneOutTargetEncode();

  return (
    <table className={tableStyles.table}>
      <thead>
        <tr>
          <th>City</th>
          <th>Label y</th>
          {scheme === "oneHot" ? CATEGORIES.map((c) => <th key={c}>is_{c}</th>) : <th>Encoded</th>}
        </tr>
      </thead>
      <tbody>
        {ROWS.map((row, i) => (
          <tr key={i} className={i === SF_ROW_INDEX ? tableStyles.rowHighlight : undefined}>
            <td>{row.city}</td>
            <td>{row.y}</td>
            {scheme === "oneHot" ? (
              oneHot[i].map((v, c) => <td key={c}>{v}</td>)
            ) : (
              <td>
                {scheme === "ordinal" && ordinal[i]}
                {scheme === "naiveTarget" && naive[i].toFixed(3)}
                {scheme === "leaveOneOutTarget" && loo[i].toFixed(3)}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Intuition beat: switch encoding schemes and watch the numeric columns change under the exact same table. */
export function IntuitionDemo() {
  const [scheme, setScheme] = useState<EncodingScheme>("ordinal");
  return (
    <>
      <SchemePicker schemes={["ordinal", "oneHot", "naiveTarget"]} selected={scheme} onSelect={setScheme} />
      <EncodingTable scheme={scheme} />
    </>
  );
}

/** Play beat: same table, now contrasting naive vs. leave-one-out target encoding on the highlighted SF row. */
export function PlayDemo() {
  const [scheme, setScheme] = useState<EncodingScheme>("naiveTarget");
  const naive = naiveTargetEncode();
  const loo = leaveOneOutTargetEncode();
  return (
    <>
      <SchemePicker schemes={["naiveTarget", "leaveOneOutTarget"]} selected={scheme} onSelect={setScheme} />
      <EncodingTable scheme={scheme} />
      <ContributionBars
        items={[
          { label: "SF true label", value: ROWS[SF_ROW_INDEX].y },
          { label: "SF naive target encoding", value: naive[SF_ROW_INDEX] },
          { label: "SF leave-one-out encoding", value: loo[SF_ROW_INDEX] },
        ]}
        max={1}
        formatValue={(v) => v.toFixed(3)}
        readout="naive encoding hands the SF row a feature equal to its own label — the model doesn't need to learn anything, it just reads the answer"
      />
    </>
  );
}

/** Checkpoint: switch between naive and leave-one-out target encoding to find the one that leaks the SF row's own label. */
export function EncodingCheckpoint() {
  const [scheme, setScheme] = useState<EncodingScheme>("leaveOneOutTarget");
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const naive = naiveTargetEncode();
  const loo = leaveOneOutTargetEncode();
  const encodedSF = scheme === "naiveTarget" ? naive[SF_ROW_INDEX] : loo[SF_ROW_INDEX];
  const passed = withinTolerance(encodedSF, ROWS[SF_ROW_INDEX].y, TOLERANCE);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Switch between <strong>naive</strong> and <strong>leave-one-out</strong> target encoding until the SF row&apos;s encoded value exactly matches its own label (<strong>{ROWS[SF_ROW_INDEX].y}</strong>) — the sign of the leak.
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a scheme to try it"
    >
      <SchemePicker
        schemes={["naiveTarget", "leaveOneOutTarget"]}
        selected={scheme}
        onSelect={(s) => {
          setHasInteracted(true);
          setScheme(s);
        }}
      />
      <EncodingTable scheme={scheme} />
      <ContributionBars
        items={[
          { label: "SF true label", value: ROWS[SF_ROW_INDEX].y },
          { label: `SF encoded (${SCHEME_LABELS[scheme]})`, value: encodedSF },
        ]}
        max={1}
        formatValue={(v) => v.toFixed(3)}
      />
    </CheckpointFrame>
  );
}
