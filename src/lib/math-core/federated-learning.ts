/**
 * Federated averaging (FedSGD), reduced to its smallest hand-checkable form: fitting a single
 * scalar parameter θ to minimize mean squared error against data that lives on several devices,
 * none of which ever ships its raw points anywhere. Each device computes its own local gradient
 * from its own data; only those gradients travel, and averaging them (weighted by how many points
 * each device holds) reproduces exactly the gradient a centralized model would have computed on
 * the pooled data — the whole point of the method.
 */

export interface Device {
  name: string;
  data: number[];
}

export const DEVICES: Device[] = [
  { name: "Phone A", data: [2, 3] },
  { name: "Phone B", data: [8, 9, 10] },
  { name: "Phone C", data: [4] },
  { name: "Phone D", data: [6, 5] },
];

export const LEARNING_RATE = 0.1;

/** The local gradient of L(θ) = mean((θ - x)²) over one device's own data, at the current shared θ. */
export function localGradient(theta: number, data: number[]): number {
  return (2 / data.length) * data.reduce((sum, x) => sum + (theta - x), 0);
}

/** FedSGD's global update: local gradients averaged, weighted by each device's sample count — never
 *  a single raw data point crosses a device boundary, only this one aggregated number per round. */
export function federatedAverageGradient(theta: number, devices: Device[] = DEVICES): number {
  const totalN = devices.reduce((sum, d) => sum + d.data.length, 0);
  const weightedSum = devices.reduce((sum, d) => sum + localGradient(theta, d.data) * d.data.length, 0);
  return weightedSum / totalN;
}

/** One round of federated averaging: θ' = θ - lr · (averaged global gradient). */
export function federatedStep(theta: number, devices: Device[] = DEVICES, lr: number = LEARNING_RATE): number {
  return theta - lr * federatedAverageGradient(theta, devices);
}

/** Runs `rounds` steps of federated averaging starting from θ = start, returning the final θ. */
export function runFederatedRounds(start: number, rounds: number, devices: Device[] = DEVICES, lr: number = LEARNING_RATE): number {
  let theta = start;
  for (let i = 0; i < rounds; i++) theta = federatedStep(theta, devices, lr);
  return theta;
}

/** The mean of every device's pooled data — what a fully centralized fit would converge to, and
 *  exactly what federated averaging converges to as well, without ever pooling the raw points. */
export function pooledMean(devices: Device[] = DEVICES): number {
  const all = devices.flatMap((d) => d.data);
  return all.reduce((sum, x) => sum + x, 0) / all.length;
}
