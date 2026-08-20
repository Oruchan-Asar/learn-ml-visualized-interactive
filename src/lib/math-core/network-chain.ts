import { sigmoid, sigmoidDerivative } from "./activation-functions";

export const W1 = 2;
export const B1 = -1;
export const W2 = -3;
export const B2 = 1;

/** The hidden layer's single neuron: h(x) = sigmoid(w1*x + b1). */
export function hiddenValue(x: number): number {
  return sigmoid(W1 * x + B1);
}

/** The output layer's single neuron, fed the hidden value: y(x) = sigmoid(w2*h(x) + b2). */
export function composedOutput(x: number): number {
  return sigmoid(W2 * hiddenValue(x) + B2);
}

/**
 * dy/dx via the chain rule: dy/dh * dh/dx — exactly two local derivatives multiplied together,
 * one per layer, each just a plain sigmoid derivative times that layer's weight.
 */
export function chainDerivative(x: number): number {
  const h = hiddenValue(x);
  const dh_dx = sigmoidDerivative(W1 * x + B1) * W1;
  const dy_dh = sigmoidDerivative(W2 * h + B2) * W2;
  return dy_dh * dh_dx;
}

export const CHAIN_DOMAIN: [number, number] = [-4, 4];
export const TARGET_X = 0.5;
export const TARGET_SLOPE = chainDerivative(TARGET_X);
