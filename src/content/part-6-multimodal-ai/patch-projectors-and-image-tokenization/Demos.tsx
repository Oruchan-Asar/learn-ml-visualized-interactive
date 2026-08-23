"use client";

import { useEffect, useState } from "react";
import { KernelHeatmap } from "@/components/viz/KernelHeatmap";
import { ContributionBars } from "@/components/viz/ContributionBars";
import { CheckpointFrame } from "@/components/chapter/CheckpointFrame";
import {
  IMAGE,
  PATCHES,
  PATCH_LABELS,
  TEXT_TOKENS,
  patchIndexOfCell,
  patchEmbedding,
  nearestTextToken,
  distance,
} from "@/lib/math-core/patch-projectors-and-image-tokenization";
import { withinTolerance } from "@/lib/quiz/manipulate-to-target";
import { recordCheckpointAttempt } from "@/lib/mastery/store";
import { useCheckpointPassed } from "@/lib/mastery/useCheckpointPassed";

const CONCEPT_ID = "patch-projectors-and-image-tokenization";

function embeddingBars(embedding: number[]) {
  return embedding.map((v, i) => ({ label: `dim ${i}`, value: v }));
}

/** Intuition beat: click any pixel — see which 2x2 patch it belongs to and the two numbers it collapses into. */
export function IntuitionDemo() {
  const [selected, setSelected] = useState({ row: 0, col: 0 });
  const patchIndex = patchIndexOfCell(selected.row, selected.col);
  const patch = PATCHES[patchIndex];
  const embedding = patchEmbedding(patchIndex);

  return (
    <>
      <KernelHeatmap
        kernel={IMAGE}
        label="4×4 pixel image — click a cell"
        onCellClick={(row, col) => setSelected({ row, col })}
        selected={selected}
      />
      <p>
        That cell belongs to the <strong>{PATCH_LABELS[patchIndex]}</strong> patch — pixels [{patch.flat.join(", ")}]
        flattened into one row.
      </p>
      <ContributionBars items={embeddingBars(embedding)} max={32} readout={`this patch's embedding: (${embedding.join(", ")})`} />
    </>
  );
}

/** Play beat: same projector, now also showing which text token embedding this patch lands nearest to. */
export function PlayDemo() {
  const [selected, setSelected] = useState({ row: 2, col: 2 });
  const patchIndex = patchIndexOfCell(selected.row, selected.col);
  const embedding = patchEmbedding(patchIndex);
  const { token, d } = nearestTextToken(embedding);

  return (
    <>
      <KernelHeatmap
        kernel={IMAGE}
        label="4×4 pixel image — click a cell"
        onCellClick={(row, col) => setSelected({ row, col })}
        selected={selected}
      />
      <ContributionBars
        items={embeddingBars(embedding)}
        max={32}
        readout={`e = (${embedding.join(", ")}) — nearest text token: "${token.label}" (distance ${d.toFixed(2)})`}
      />
    </>
  );
}

/** Checkpoint: click the patch whose projected embedding lands nearest the text token "dog." */
export function PatchProjectorsCheckpoint() {
  const target = TEXT_TOKENS.find((t) => t.label === "dog")!;
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const everPassed = useCheckpointPassed(CONCEPT_ID);

  const patchIndex = selected ? patchIndexOfCell(selected.row, selected.col) : null;
  const embedding = patchIndex !== null ? patchEmbedding(patchIndex) : null;
  const d = embedding ? distance(embedding, target.vec) : Infinity;
  const passed = withinTolerance(d, 0, 0.01);

  useEffect(() => {
    if (passed) recordCheckpointAttempt(CONCEPT_ID, true);
  }, [passed]);

  return (
    <CheckpointFrame
      instructions={
        <>
          Click the patch whose projected embedding lands nearest the text token <strong>&ldquo;dog&rdquo;</strong> at
          ({target.vec.join(", ")}).
        </>
      }
      passed={passed || everPassed}
      hasInteracted={hasInteracted}
      idleLabel="Click a patch to try it"
    >
      <KernelHeatmap
        kernel={IMAGE}
        label="4×4 pixel image — click a cell"
        onCellClick={(row, col) => {
          setHasInteracted(true);
          setSelected({ row, col });
        }}
        selected={selected}
      />
      <p>{embedding ? `selected patch embedding: (${embedding.join(", ")}) — distance ${d.toFixed(2)}` : "click a cell to try it"}</p>
    </CheckpointFrame>
  );
}
