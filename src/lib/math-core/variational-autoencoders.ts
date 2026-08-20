/**
 * A minimal VAE: the encoder maps an input to a *distribution* (mean and log-variance) instead
 * of a single point. Sampling from that distribution — via a fixed stand-in sequence of "noise"
 * values instead of true randomness, so every run is reproducible — and decoding each sample shows
 * how the same input can generate a whole neighborhood of outputs instead of just one.
 */
export const ENCODER_MU_WEIGHT = 0.5;
export const ENCODER_LOGVAR_BASE = -2;
export const ENCODER_LOGVAR_WEIGHT = 0.1;
export const DECODER_WEIGHT = 2;

export function encodeMu(x: number): number {
  return ENCODER_MU_WEIGHT * x;
}

export function encodeLogVar(x: number): number {
  return ENCODER_LOGVAR_BASE + ENCODER_LOGVAR_WEIGHT * x;
}

/** The reparameterization trick: z = mu + sigma * epsilon, so sampling is a deterministic function of a noise value. */
export function reparameterize(mu: number, logVar: number, epsilon: number): number {
  const sigma = Math.exp(0.5 * logVar);
  return mu + sigma * epsilon;
}

export function decode(z: number): number {
  return DECODER_WEIGHT * z;
}

/** Fixed stand-ins for draws from a standard normal — deterministic, so every run reproduces exactly. */
export const EPSILON_SEQUENCE: number[] = [0, 1, -1, 2];

export interface VAESample {
  epsilon: number;
  z: number;
  reconstruction: number;
}

export function sampleReconstructions(x: number, epsilons: number[] = EPSILON_SEQUENCE): VAESample[] {
  const mu = encodeMu(x);
  const logVar = encodeLogVar(x);
  return epsilons.map((epsilon) => {
    const z = reparameterize(mu, logVar, epsilon);
    return { epsilon, z, reconstruction: decode(z) };
  });
}

/** KL divergence between N(mu, sigma^2) and the standard normal N(0,1) — the exact closed form, no sampling needed. */
export function klDivergence(mu: number, logVar: number): number {
  const sigmaSquared = Math.exp(logVar);
  return 0.5 * (sigmaSquared + mu * mu - 1 - logVar);
}
