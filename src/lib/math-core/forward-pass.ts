export interface Neuron {
  weights: number[];
  bias: number;
  label: string;
}

export function relu(x: number): number {
  return Math.max(0, x);
}

/** A single neuron's pre-activation sum: w . x + b. */
export function preActivation(neuron: Neuron, inputs: number[]): number {
  return neuron.weights.reduce((sum, w, i) => sum + w * inputs[i], neuron.bias);
}

/** Every neuron in a layer, each computing its own weighted sum then the same activation. */
export function layerOutputs(neurons: Neuron[], inputs: number[], activation: (z: number) => number): number[] {
  return neurons.map((n) => activation(preActivation(n, inputs)));
}

export const INPUT_LABELS = ["x1", "x2"];

export const LAYER: Neuron[] = [
  { weights: [1, -1], bias: 0, label: "A" },
  { weights: [0.5, 0.5], bias: -1, label: "B" },
  { weights: [-1, 2], bias: 0.5, label: "C" },
];

export const INPUT_DOMAIN: [number, number] = [-3, 3];
export const TARGET_NEURON_INDEX = 1; // neuron B
export const TARGET_OUTPUT = 1;
