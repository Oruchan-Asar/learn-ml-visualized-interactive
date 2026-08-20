import { sigmoid, sigmoidDerivative } from "./activation-functions";

/** Fixed network: 2 inputs, 2 hidden neurons, 1 output neuron — every weight fixed except w11, the interactive one. */
export const X1 = 1;
export const X2 = 2;
export const W12 = -0.3;
export const B1 = 0.1;
export const W21 = -0.2;
export const W22 = 0.4;
export const B2 = 0.2;
export const V1 = 1.5;
export const V2 = -1.0;
export const C = 0.3;
export const TARGET = 0;

export interface ForwardState {
  z1: number;
  h1: number;
  z2: number;
  h2: number;
  zOut: number;
  y: number;
  loss: number;
}

export function forward(w11: number): ForwardState {
  const z1 = w11 * X1 + W12 * X2 + B1;
  const h1 = sigmoid(z1);
  const z2 = W21 * X1 + W22 * X2 + B2;
  const h2 = sigmoid(z2);
  const zOut = V1 * h1 + V2 * h2 + C;
  const y = sigmoid(zOut);
  const loss = 0.5 * (y - TARGET) ** 2;
  return { z1, h1, z2, h2, zOut, y, loss };
}

export function lossAt(w11: number): number {
  return forward(w11).loss;
}

/** dL/dw11 via the full backprop chain: dL/dy · dy/dzOut · dzOut/dh1 · dh1/dz1 · dz1/dw11. */
export function gradientAt(w11: number): number {
  const { z1, zOut, y } = forward(w11);
  const dL_dy = y - TARGET;
  const dy_dzOut = sigmoidDerivative(zOut);
  const dL_dzOut = dL_dy * dy_dzOut;
  const dL_dh1 = dL_dzOut * V1;
  const dh1_dz1 = sigmoidDerivative(z1);
  const dL_dz1 = dL_dh1 * dh1_dz1;
  return dL_dz1 * X1;
}

export interface FullGradients {
  dW11: number;
  dW12: number;
  dB1: number;
  dW21: number;
  dW22: number;
  dB2: number;
  dV1: number;
  dV2: number;
  dC: number;
}

/** Every parameter's gradient at once, for the full worked-example breakdown. */
export function fullBackprop(w11: number): FullGradients {
  const { z1, h1, z2, h2, zOut, y } = forward(w11);
  const dL_dy = y - TARGET;
  const dL_dzOut = dL_dy * sigmoidDerivative(zOut);
  const dL_dh1 = dL_dzOut * V1;
  const dL_dh2 = dL_dzOut * V2;
  const dL_dz1 = dL_dh1 * sigmoidDerivative(z1);
  const dL_dz2 = dL_dh2 * sigmoidDerivative(z2);
  return {
    dW11: dL_dz1 * X1,
    dW12: dL_dz1 * X2,
    dB1: dL_dz1,
    dW21: dL_dz2 * X1,
    dW22: dL_dz2 * X2,
    dB2: dL_dz2,
    dV1: dL_dzOut * h1,
    dV2: dL_dzOut * h2,
    dC: dL_dzOut,
  };
}

export const W11_DOMAIN: [number, number] = [-2, 2];
export const DEFAULT_W11 = 0.5;
export const TARGET_GRADIENT = 0.03;
