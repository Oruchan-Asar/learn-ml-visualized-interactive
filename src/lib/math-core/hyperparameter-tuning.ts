import { gradientDescentStep } from "./descent";

/** The loss being minimized: a simple bowl f(x) = (x-3)^2, minimum at x=3. */
export function loss(x: number): number {
  return (x - 3) ** 2;
}

export function lossGradient(x: number): number {
  return 2 * (x - 3);
}

export const START_X = 0;
export const STEPS = 20;
export const LEARNING_RATES: number[] = [0.01, 0.1, 0.5, 0.9, 1.0, 1.1];

/** Run gradient descent for a fixed number of steps, returning the x at every step (including the start). */
export function descentTrace(learningRate: number, steps: number = STEPS, startX: number = START_X): number[] {
  const trace = [startX];
  let x = startX;
  for (let i = 0; i < steps; i++) {
    x = gradientDescentStep(x, lossGradient, learningRate);
    trace.push(x);
  }
  return trace;
}

export interface GridResult {
  learningRate: number;
  finalX: number;
  finalLoss: number;
}

/** Grid search: try every candidate learning rate, run the same fixed budget of steps, score the result. */
export function gridSearch(learningRates: number[] = LEARNING_RATES, steps: number = STEPS, startX: number = START_X): GridResult[] {
  return learningRates.map((learningRate) => {
    const trace = descentTrace(learningRate, steps, startX);
    const finalX = trace[trace.length - 1];
    return { learningRate, finalX, finalLoss: loss(finalX) };
  });
}

export function bestResult(results: GridResult[]): GridResult {
  return results.reduce((best, r) => (r.finalLoss < best.finalLoss ? r : best), results[0]);
}
