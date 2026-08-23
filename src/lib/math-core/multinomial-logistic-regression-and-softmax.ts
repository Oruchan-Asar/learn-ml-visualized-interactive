export const CLASS_LABELS = ["cat", "dog", "bird"];

/** Turns any vector of real-valued scores ("logits") into a probability distribution that sums to 1.
 *  Subtracts the max logit first purely for numerical stability — softmax(z) === softmax(z - c) for any
 *  constant c, since that constant cancels between every numerator and the shared denominator. */
export function softmax(logits: number[]): number[] {
  const maxLogit = Math.max(...logits);
  const exps = logits.map((z) => Math.exp(z - maxLogit));
  const sum = exps.reduce((s, v) => s + v, 0);
  return exps.map((e) => e / sum);
}

/** Divides every logit by a temperature before softmax-ing: T<1 sharpens the distribution toward
 *  one-hot, T>1 flattens it toward uniform, T=1 leaves it unchanged. */
export function softmaxWithTemperature(logits: number[], temperature: number): number[] {
  return softmax(logits.map((z) => z / temperature));
}

export function argmax(values: number[]): number {
  return values.reduce((best, v, i) => (v > values[best] ? i : best), 0);
}

export const BASE_LOGITS = [2, 0, -1];
export const CHECKPOINT_LOGITS = [1, 1, 2];

export const TEMPERATURE_MIN = 0.25;
export const TEMPERATURE_MAX = 4;

export const LOGIT_MIN = -3;
export const LOGIT_MAX = 3;
