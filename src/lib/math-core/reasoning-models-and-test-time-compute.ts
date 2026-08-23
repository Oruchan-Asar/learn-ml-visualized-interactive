/**
 * A reasoning model can trade latency for accuracy at INFERENCE time, not just training time: spend
 * more tokens on a chain of thought before committing to an answer, and accuracy climbs -- with
 * diminishing returns, since each extra step recovers a shrinking fraction of the remaining error.
 * That tradeoff is a geometric decay curve: accuracy approaches (but never reaches) a ceiling as the
 * chain of thought gets longer, while its compute cost grows linearly the whole time.
 */

export const BASE_ACCURACY = 0.2; // accuracy of a single-shot answer, zero reasoning steps
export const DECAY = 0.8; // each extra reasoning step closes 20% of the remaining gap to 100%

/** Accuracy as a function of chain-of-thought length (in reasoning steps). */
export function accuracy(cotLength: number): number {
  return 1 - (1 - BASE_ACCURACY) * DECAY ** cotLength;
}

/** d(accuracy)/d(cotLength) -- always positive, but shrinking, which is the diminishing-returns story. */
export function accuracyDerivative(cotLength: number): number {
  return -(1 - BASE_ACCURACY) * DECAY ** cotLength * Math.log(DECAY);
}

export const COST_PER_STEP = 0.02; // hypothetical latency/compute unit spent per reasoning step

/** Compute cost of a chain of thought of this length -- linear, no diminishing returns here. */
export function computeCost(cotLength: number): number {
  return COST_PER_STEP * cotLength;
}

/** Net utility of reasoning for `cotLength` steps: accuracy gained minus the compute spent getting there. */
export function utility(cotLength: number, costWeight: number = 1): number {
  return accuracy(cotLength) - costWeight * computeCost(cotLength);
}

/** Brute-force search over integer chain-of-thought lengths for the one that maximizes net utility. */
export function bestCotLength(maxLength: number = 30, costWeight: number = 1): number {
  let best = 0;
  let bestUtility = utility(0, costWeight);
  for (let length = 1; length <= maxLength; length++) {
    const u = utility(length, costWeight);
    if (u > bestUtility) {
      bestUtility = u;
      best = length;
    }
  }
  return best;
}
