function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/** The one real data point this toy GAN tries to imitate. */
export const REAL_VALUE = 5;

export interface GanState {
  /** Discriminator: D(x) = sigmoid(w*x + c). */
  w: number;
  c: number;
  /** Generator: a single scalar output — no noise input, since one real point needs no diversity. */
  g: number;
}

export const INITIAL_STATE: GanState = { w: 0.1, c: -0.5, g: 0 };

export function discriminate(state: GanState, x: number): number {
  return sigmoid(state.w * x + state.c);
}

export const LR_D = 0.05;
export const LR_G = 0.02;
export const EPOCHS_PER_STEP = 50;
export const MAX_STEPS = 12;
export const TARGET_GAP = 0.1;

/** One alternating step: update the discriminator first, then the generator against the updated discriminator. */
export function trainStep(state: GanState, lrD = LR_D, lrG = LR_G): GanState {
  const dReal = discriminate(state, REAL_VALUE);
  const dFake = discriminate(state, state.g);

  // Discriminator minimizes -[log(D(real)) + log(1 - D(fake))].
  const dLD_dw = -(1 - dReal) * REAL_VALUE + dFake * state.g;
  const dLD_dc = -(1 - dReal) + dFake;
  const w = state.w - lrD * dLD_dw;
  const c = state.c - lrD * dLD_dc;

  // Generator (non-saturating) minimizes -log(D(fake)), against the just-updated discriminator.
  const dFakeUpdated = sigmoid(w * state.g + c);
  const dLG_dg = -(1 - dFakeUpdated) * w;
  const g = state.g - lrG * dLG_dg;

  return { w, c, g };
}

export function trainEpochs(state: GanState, epochs: number): GanState {
  let current = state;
  for (let i = 0; i < epochs; i++) current = trainStep(current);
  return current;
}

/** How well the discriminator still tells real from fake apart — 0 means it's fully fooled. */
export function confusionGap(state: GanState): number {
  return Math.abs(discriminate(state, REAL_VALUE) - discriminate(state, state.g));
}
