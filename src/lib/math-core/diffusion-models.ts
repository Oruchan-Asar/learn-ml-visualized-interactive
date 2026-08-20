export const X0 = 5;

/** An increasing noise schedule — later steps add more noise, the standard DDPM convention. */
export const BETAS = [0.1, 0.2, 0.3, 0.4];
export const T = BETAS.length;
export const ALPHAS = BETAS.map((b) => 1 - b);

/** A fixed "true" noise sample injected at each forward step — deterministic, so every run is identical. */
export const TRUE_NOISE = [1, -0.5, 0.8, -1.2];

export interface DiffusionStep {
  t: number;
  value: number;
}

/** The forward process: gradually mixes in noise, step by step, until the data is mostly noise. */
export function forwardProcess(): DiffusionStep[] {
  const steps: DiffusionStep[] = [{ t: 0, value: X0 }];
  let x = X0;
  for (let t = 0; t < T; t++) {
    x = Math.sqrt(ALPHAS[t]) * x + Math.sqrt(BETAS[t]) * TRUE_NOISE[t];
    steps.push({ t: t + 1, value: x });
  }
  return steps;
}

export const FORWARD: DiffusionStep[] = forwardProcess();
export const X_T = FORWARD[FORWARD.length - 1].value;

/**
 * The reverse process: starting from x_T, repeatedly undo one noising step using a *predicted* noise value.
 * `quality` blends between a predictor that knows nothing (0, always predicts zero noise) and one that
 * exactly recovers the true noise used in the forward process (1) — standing in for a trained denoiser.
 */
export function reverseProcess(quality: number): DiffusionStep[] {
  const steps: DiffusionStep[] = [{ t: T, value: X_T }];
  let x = X_T;
  for (let t = T - 1; t >= 0; t--) {
    const predictedNoise = quality * TRUE_NOISE[t];
    x = (x - Math.sqrt(BETAS[t]) * predictedNoise) / Math.sqrt(ALPHAS[t]);
    steps.push({ t, value: x });
  }
  return steps;
}

export function reconstructedX0(quality: number): number {
  const steps = reverseProcess(quality);
  return steps[steps.length - 1].value;
}

export const DEFAULT_QUALITY = 0;
export const TARGET_ERROR = 0.1;
