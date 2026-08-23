import { softmax } from "./attention";
import { patchEmbedding } from "./patch-projectors-and-image-tokenization";

export type Modality = "text" | "image";

export interface Candidate {
  label: string;
  logit: number;
  modality: Modality;
  /** For image candidates only: which of the previous chapter's four patches this token stands for. */
  patchIndex?: number;
}

export interface GenerationStep {
  step: number;
  candidates: Candidate[];
}

/**
 * One flat autoregressive stream, ten steps long: at every single step the same softmax-over-logits
 * decision picks the next token, whether that token happens to be an ordinary word or one of the four
 * image-patch tokens produced by the previous chapter's linear projector. Nothing here branches on
 * modality — there is exactly one decision rule, and it just so happens to output "a", "photo", "of",
 * then four image tokens back to back, then "on", "the", "mat". That handoff — mid-sequence, with no
 * special-casing — is the entire point of interleaved generation.
 */
export const SCRIPT: GenerationStep[] = [
  {
    step: 1,
    candidates: [
      { label: "a", logit: 2, modality: "text" },
      { label: "photo", logit: 1, modality: "text" },
      { label: "top-left", logit: -1, modality: "image", patchIndex: 0 },
    ],
  },
  {
    step: 2,
    candidates: [
      { label: "photo", logit: 2, modality: "text" },
      { label: "a", logit: -1, modality: "text" },
      { label: "top-left", logit: -1, modality: "image", patchIndex: 0 },
    ],
  },
  {
    step: 3,
    candidates: [
      { label: "of", logit: 2, modality: "text" },
      { label: "photo", logit: -1, modality: "text" },
      { label: "top-left", logit: -1, modality: "image", patchIndex: 0 },
    ],
  },
  {
    step: 4,
    candidates: [
      { label: "top-left", logit: 2, modality: "image", patchIndex: 0 },
      { label: "of", logit: -1, modality: "text" },
      { label: "the", logit: -1, modality: "text" },
    ],
  },
  {
    step: 5,
    candidates: [
      { label: "top-right", logit: 2, modality: "image", patchIndex: 1 },
      { label: "the", logit: -1, modality: "text" },
      { label: "a", logit: -1, modality: "text" },
    ],
  },
  {
    step: 6,
    candidates: [
      { label: "bottom-left", logit: 2, modality: "image", patchIndex: 2 },
      { label: "on", logit: -1, modality: "text" },
      { label: "the", logit: -1, modality: "text" },
    ],
  },
  {
    step: 7,
    candidates: [
      { label: "bottom-right", logit: 2, modality: "image", patchIndex: 3 },
      { label: "on", logit: -1, modality: "text" },
      { label: "the", logit: -1, modality: "text" },
    ],
  },
  {
    step: 8,
    candidates: [
      { label: "on", logit: 2, modality: "text" },
      { label: "bottom-right", logit: -1, modality: "image", patchIndex: 3 },
      { label: "the", logit: -1, modality: "text" },
    ],
  },
  {
    step: 9,
    candidates: [
      { label: "the", logit: 2, modality: "text" },
      { label: "on", logit: -1, modality: "text" },
      { label: "a", logit: -1, modality: "text" },
    ],
  },
  {
    step: 10,
    candidates: [
      { label: "mat", logit: 2, modality: "text" },
      { label: "the", logit: -1, modality: "text" },
      { label: "a", logit: -1, modality: "text" },
    ],
  },
];

/**
 * The flat, shared vocabulary: every distinct label across the whole script, text and image tokens alike,
 * in first-seen order. There is exactly one vocabulary here, not a text vocabulary plus a separate image
 * vocabulary.
 */
export const VOCAB: string[] = (() => {
  const seen = new Set<string>();
  const vocab: string[] = [];
  for (const step of SCRIPT) {
    for (const c of step.candidates) {
      if (!seen.has(c.label)) {
        seen.add(c.label);
        vocab.push(c.label);
      }
    }
  }
  return vocab;
})();

export function vocabId(label: string): number {
  return VOCAB.indexOf(label);
}

/** Softmax over one step's candidate logits — identical formula regardless of which candidates are words vs. image patches. */
export function stepWeights(step: GenerationStep): number[] {
  return softmax(step.candidates.map((c) => c.logit));
}

/** The candidate with the highest softmax weight for this step — greedy argmax decoding. */
export function stepWinner(step: GenerationStep): Candidate {
  const weights = stepWeights(step);
  let best = 0;
  for (let i = 1; i < weights.length; i++) {
    if (weights[i] > weights[best]) best = i;
  }
  return step.candidates[best];
}

/** Runs argmax decoding over every step in order, producing the full generated sequence. */
export function generateSequence(steps: GenerationStep[] = SCRIPT): Candidate[] {
  return steps.map(stepWinner);
}

/** The generated sequence truncated to its first n decoded tokens — for animating generation step by step. */
export function sequenceAtStep(n: number, steps: GenerationStep[] = SCRIPT): Candidate[] {
  return steps.slice(0, n).map(stepWinner);
}

/**
 * The real embedding an image token carries — reused unchanged from the patch-projector chapter, not
 * recomputed here. Text tokens have no such embedding in this toy vocabulary, so this returns null for them.
 */
export function candidateEmbedding(candidate: Candidate): number[] | null {
  if (candidate.modality !== "image" || candidate.patchIndex === undefined) return null;
  return patchEmbedding(candidate.patchIndex);
}
