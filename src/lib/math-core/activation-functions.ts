export function stepFn(x: number): number {
  return x >= 0 ? 1 : 0;
}

export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export function tanhFn(x: number): number {
  return Math.tanh(x);
}

export function relu(x: number): number {
  return Math.max(0, x);
}

export function sigmoidDerivative(x: number): number {
  const s = sigmoid(x);
  return s * (1 - s);
}

export function reluDerivative(x: number): number {
  return x > 0 ? 1 : 0;
}

export const ACTIVATION_DOMAIN: [number, number] = [-4, 4];
export const ACTIVATION_RANGE: [number, number] = [-1.3, 4];

export const TARGET_SIGMOID_VALUE = 0.9;
/** x = ln(target / (1-target)) — the logit of the target probability. */
export const TARGET_X = Math.log(TARGET_SIGMOID_VALUE / (1 - TARGET_SIGMOID_VALUE));
