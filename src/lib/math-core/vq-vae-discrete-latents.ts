/**
 * A VQ-VAE's encoder outputs a continuous vector, exactly like any other autoencoder's. What makes it
 * different: before decoding, that vector is snapped onto the nearest entry in a small, fixed codebook —
 * throwing away every value the continuous vector could have taken except the finitely many the codebook
 * actually contains. The decoder only ever sees one of those K vectors, never the original continuous one.
 */
export interface Vec2 {
  x: number;
  y: number;
}

export const CODEBOOK: Vec2[] = [
  { x: 0, y: 0 },
  { x: 3, y: 0 },
  { x: 0, y: 3 },
  { x: 3, y: 3 },
];

/** Four continuous encoder outputs — one per "image" — chosen so each snaps to a different codebook entry. */
export const ENCODER_OUTPUTS: Vec2[] = [
  { x: 1, y: 1 },
  { x: 2.5, y: 0.5 },
  { x: 0.5, y: 2.8 },
  { x: 2.2, y: 2.3 },
];

export function squaredDistance(a: Vec2, b: Vec2): number {
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
}

/** Which codebook entry is closest to z, by plain Euclidean distance. */
export function nearestCodeIndex(z: Vec2, codebook: Vec2[] = CODEBOOK): number {
  let best = 0;
  let bestDist = Infinity;
  codebook.forEach((c, i) => {
    const d = squaredDistance(z, c);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  });
  return best;
}

/** The quantization step itself: replace z with its nearest codebook entry. */
export function quantize(z: Vec2, codebook: Vec2[] = CODEBOOK): Vec2 {
  return codebook[nearestCodeIndex(z, codebook)];
}

/** How far the continuous encoder output sat from the discrete code it got snapped to — zero only if z landed exactly on a code. */
export function quantizationError(z: Vec2, codebook: Vec2[] = CODEBOOK): number {
  return Math.sqrt(squaredDistance(z, quantize(z, codebook)));
}
