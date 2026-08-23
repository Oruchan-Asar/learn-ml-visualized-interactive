/**
 * DDIM (Denoising Diffusion Implicit Models) reframes the reverse diffusion process as a step along a
 * deterministic trajectory instead of a Markov chain. The previous chapter's reverse step only ever moved
 * from x_t to x_{t-1}, one adjacent timestep at a time. DDIM's update rule works for ANY pair of timesteps
 * (t, tPrev) -- not just adjacent ones -- because it first estimates x0 directly from x_t, then re-derives
 * x_tPrev from that estimate using the same closed-form marginal the forward process uses. That's exactly
 * what lets sampling skip steps: with a perfect noise predictor, jumping straight from t=4 to t=0 lands on
 * the same x0 as walking down one step at a time.
 *
 * Injecting real randomness back in (via eta > 0) breaks that path-independence: the model's x0 estimate at
 * each step silently assumes x_t sits exactly on the clean marginal for that t. Once injected noise knocks
 * x_t off that marginal, the next step's estimate inherits the error -- which is precisely why a stochastic
 * (DDPM-style) path drifts even though it starts from the exact same noise and uses the exact same predictor.
 */

export const X0 = 5;
/** The single "true" noise direction baked into every noisy x_t below; a perfect model predicts exactly
 * this value at every t, regardless of how x_t was reached. */
export const EPS = 1;
export const T = 4;
/** Cumulative signal-retained fraction at each timestep, ALPHA_BAR[t], for t = 0..T. ALPHA_BAR[0] = 1 means
 * "no noise yet" (clean data); it shrinks toward 0 as t grows and the signal is buried in noise. */
export const ALPHA_BAR = [1, 0.8, 0.6, 0.4, 0.2];

/** The forward process's closed form: jump directly from x0 to any noise level t in a single step. */
export function xAt(t: number): number {
  return Math.sqrt(ALPHA_BAR[t]) * X0 + Math.sqrt(1 - ALPHA_BAR[t]) * EPS;
}

export const X_T = xAt(T);

/** Estimate x0 from a noisy x_t and a predicted noise direction -- the same formula regardless of which
 * path was taken to reach (x_t, t). */
export function predictX0(xt: number, t: number, epsPred: number): number {
  return (xt - Math.sqrt(1 - ALPHA_BAR[t]) * epsPred) / Math.sqrt(ALPHA_BAR[t]);
}

/**
 * One generalized reverse step from timestep t to timestep tPrev (possibly skipping timesteps in between).
 * `eta = 0` recovers DDIM's fully deterministic update. `eta = 1` replaces the predicted-noise direction
 * with an injected value `z`, standing in for a DDPM-style stochastic step. Values in between interpolate.
 */
export function reverseStep(xt: number, t: number, tPrev: number, epsPred: number, eta: number, z: number): number {
  const x0Pred = predictX0(xt, t, epsPred);
  const direction = (1 - eta) * epsPred + eta * z;
  return Math.sqrt(ALPHA_BAR[tPrev]) * x0Pred + Math.sqrt(1 - ALPHA_BAR[tPrev]) * direction;
}

/** DDIM's deterministic special case (eta = 0): no injected noise ever enters the trajectory. */
export function ddimStep(xt: number, t: number, tPrev: number, epsPred: number = EPS): number {
  return reverseStep(xt, t, tPrev, epsPred, 0, 0);
}

/** The full, one-step-at-a-time schedule. */
export const SCHEDULE_FULL = [4, 3, 2, 1, 0];
/** Skips t=3 and t=1 entirely -- half as many model calls. */
export const SCHEDULE_SKIP = [4, 2, 0];
/** The extreme case: jump straight from pure noise to the clean estimate in one call. */
export const SCHEDULE_SINGLE = [4, 0];

/** Fixed "random" draws standing in for a DDPM-style stochastic path -- deterministic under this fixed seed,
 * so re-running it always reproduces the exact same wobble. */
export const FIXED_Z = [0.5, -0.5, 0.5, 0.3];

export interface ReverseTraceEntry {
  t: number;
  value: number;
}

/**
 * Run a reverse schedule (an ordered list of timesteps, e.g. the full [4,3,2,1,0] or a skip like [4,2,0])
 * at a given eta. zValues supplies the injected-noise draw used at each transition (ignored when eta = 0).
 */
export function runSchedule(
  schedule: number[],
  eta: number,
  zValues: number[] = FIXED_Z,
  epsPred: number = EPS,
): ReverseTraceEntry[] {
  const trace: ReverseTraceEntry[] = [{ t: schedule[0], value: xAt(schedule[0]) }];
  for (let i = 0; i < schedule.length - 1; i++) {
    const t = schedule[i];
    const tPrev = schedule[i + 1];
    const value = reverseStep(trace[i].value, t, tPrev, epsPred, eta, zValues[i]);
    trace.push({ t: tPrev, value });
  }
  return trace;
}

export function finalValue(trace: ReverseTraceEntry[]): number {
  return trace[trace.length - 1].value;
}

export const TARGET_ERROR = 0.1;
