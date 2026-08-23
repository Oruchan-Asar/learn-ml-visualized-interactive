/**
 * Instruction tuning / SFT is ordinary next-token cross-entropy — the exact same loss pretraining
 * used — with one change: a mask that zeroes out every prompt token, so only the tokens the model
 * is actually supposed to *generate* (the response) contribute to the gradient. Nothing about the
 * loss function changes; only which positions are allowed to vote.
 *
 * The toy sequence below is a single (prompt, response) pair with a hand-picked per-token negative
 * log-likelihood (NLL) for each position, standing in for whatever a real model would have produced.
 */

export const PROMPT_TOKENS = ["Explain", "gravity", ":"];
export const RESPONSE_TOKENS = ["It", "pulls", "masses", "together", "."];
export const FULL_TOKENS = [...PROMPT_TOKENS, ...RESPONSE_TOKENS];

/** One hand-picked NLL per token position in FULL_TOKENS — the "surprise" of that token given its prefix. */
export const NLL = [2.1, 1.8, 0.3, 1.2, 0.9, 1.5, 0.7, 0.2];

/** Where the prompt ends and the response begins — the mask boundary SFT introduces. */
export const PROMPT_LENGTH = PROMPT_TOKENS.length; // 3

/**
 * What an un-tuned base model tends to do with this same prompt: continue the *document pattern* it
 * was trained on (a list of dictionary-style "Explain X:" entries) instead of answering it.
 */
export const BASE_COMPLETION_TOKENS = ["Explain", "friction", ":", "Explain", "magnetism", ":"];

/** What the SFT-tuned model produces on the same prompt: an actual answer. */
export const SFT_COMPLETION_TOKENS = RESPONSE_TOKENS;

export function meanLoss(values: number[]): number {
  if (values.length === 0) return NaN;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** Pretraining's loss: every token in the sequence votes, prompt included. */
export function fullSequenceLoss(): number {
  return meanLoss(NLL);
}

/** SFT's loss: only tokens at or after `splitIndex` (the response) vote — the prompt is masked out. */
export function maskedLoss(splitIndex: number): number {
  return meanLoss(NLL.slice(splitIndex));
}
