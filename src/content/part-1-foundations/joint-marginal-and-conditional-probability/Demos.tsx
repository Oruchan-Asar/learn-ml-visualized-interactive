"use client";

import { useEffect, useState } from "react";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  JOINT,
  A_LABELS,
  B_LABELS,
  marginalA,
  marginalB,
  conditionalBGivenA,
  conditionalAGivenB,
} from "@/lib/math-core/joint-marginal-and-conditional-probability";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";
import styles from "./JointTable.module.css";

const CONCEPT_ID = "joint-marginal-and-conditional-probability";
const MARGINAL_A = marginalA(JOINT);
const MARGINAL_B = marginalB(JOINT);

interface JointTableProps {
  selectedRow: number | null;
  selectedCol: number | null;
  onSelectRow?: (i: number) => void;
  onSelectCol?: (j: number) => void;
}

function JointTable({ selectedRow, selectedCol, onSelectRow, onSelectCol }: JointTableProps) {
  const isHighlighted = (i: number, j: number) => i === selectedRow || j === selectedCol;
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.cornerCell}>A \ B</th>
            {B_LABELS.map((b, j) => (
              <th key={b}>
                {onSelectCol ? (
                  <button type="button" className={j === selectedCol ? styles.headerActive : styles.headerButton} onClick={() => onSelectCol(j)}>
                    {b}
                  </button>
                ) : (
                  b
                )}
              </th>
            ))}
            <th>P(A)</th>
          </tr>
        </thead>
        <tbody>
          {A_LABELS.map((a, i) => (
            <tr key={a}>
              <th>
                {onSelectRow ? (
                  <button type="button" className={i === selectedRow ? styles.headerActive : styles.headerButton} onClick={() => onSelectRow(i)}>
                    {a}
                  </button>
                ) : (
                  a
                )}
              </th>
              {JOINT[i].map((v, j) => (
                <td key={j} className={isHighlighted(i, j) ? styles.cellHighlight : undefined}>
                  {v.toFixed(2)}
                </td>
              ))}
              <td className={styles.marginalCell}>{MARGINAL_A[i].toFixed(2)}</td>
            </tr>
          ))}
          <tr>
            <th>P(B)</th>
            {MARGINAL_B.map((v, j) => (
              <td key={j} className={styles.marginalCell}>{v.toFixed(2)}</td>
            ))}
            <td className={styles.marginalCell}>1.00</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/** Intuition beat: click a row or a column header and watch that slice renormalize into a conditional distribution. */
export function IntuitionDemo() {
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [selectedCol, setSelectedCol] = useState<number | null>(null);

  const selectRow = (i: number) => {
    setSelectedRow(i);
    setSelectedCol(null);
  };
  const selectCol = (j: number) => {
    setSelectedCol(j);
    setSelectedRow(null);
  };

  return (
    <>
      <JointTable selectedRow={selectedRow} selectedCol={selectedCol} onSelectRow={selectRow} onSelectCol={selectCol} />
      <div className={styles.readout}>
        {selectedRow !== null && (
          <p>
            P(B | A={A_LABELS[selectedRow]}) = [{conditionalBGivenA(JOINT, selectedRow).map((v) => v.toFixed(2)).join(", ")}]
            {" "}— that row&rsquo;s own probabilities, divided by its row sum {MARGINAL_A[selectedRow].toFixed(2)}.
          </p>
        )}
        {selectedCol !== null && (
          <p>
            P(A | B={B_LABELS[selectedCol]}) = [{conditionalAGivenB(JOINT, selectedCol).map((v) => v.toFixed(3)).join(", ")}]
            {" "}— that column&rsquo;s own probabilities, divided by its column sum {MARGINAL_B[selectedCol].toFixed(2)}.
          </p>
        )}
        {selectedRow === null && selectedCol === null && <p>Click a row (A) or column (B) header to slice the table.</p>}
      </div>
    </>
  );
}

/** Play beat: same table, framed around the marginal/conditional link — pick a row and a column together. */
export function PlayDemo() {
  const [row, setRow] = useState(0);
  const [col, setCol] = useState(0);
  const jointCell = JOINT[row][col];
  const condBGivenA = conditionalBGivenA(JOINT, row)[col];
  const condAGivenB = conditionalAGivenB(JOINT, col)[row];

  return (
    <>
      <JointTable selectedRow={row} selectedCol={col} onSelectRow={setRow} onSelectCol={setCol} />
      <div className={styles.readout}>
        <p>P(A={A_LABELS[row]}, B={B_LABELS[col]}) = {jointCell.toFixed(2)} — the joint cell itself.</p>
        <p>P(B={B_LABELS[col]} | A={A_LABELS[row]}) = {condBGivenA.toFixed(3)} — slice by row, normalize by P(A={A_LABELS[row]}) = {MARGINAL_A[row].toFixed(2)}.</p>
        <p>P(A={A_LABELS[row]} | B={B_LABELS[col]}) = {condAGivenB.toFixed(3)} — slice by column, normalize by P(B={B_LABELS[col]}) = {MARGINAL_B[col].toFixed(2)}.</p>
      </div>
    </>
  );
}

const TARGET = 1 / 3;
const CANDIDATES = [
  { label: "1/3 ≈ 0.33", value: 1 / 3 },
  { label: "0.70", value: 0.7 },
  { label: "0.10", value: 0.1 },
  { label: "0.40", value: 0.4 },
];

/** Checkpoint: compute P(a2 | b3) by hand — a genuine conditional, not a marginal or a raw joint value. */
export function JointCheckpoint() {
  const [chosen, setChosen] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);
  const passed = chosen !== null && Math.abs(chosen - TARGET) < 1e-9;

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={<>From the table below, compute <strong>P(A = a2 | B = b3)</strong>.</>}
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Pick a value to try it"
    >
      <JointTable selectedRow={null} selectedCol={null} />
      <div className={styles.candidateList}>
        {CANDIDATES.map((c) => (
          <button
            key={c.label}
            type="button"
            className={chosen === c.value ? styles.candidateActive : styles.candidate}
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
