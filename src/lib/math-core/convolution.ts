export const IMAGE_SIZE = 6;
export const KERNEL_SIZE = 3;
export const FEATURE_MAP_SIZE = IMAGE_SIZE - KERNEL_SIZE + 1;

/** A 6x6 image with a vertical edge: dark (0) on the left three columns, light (1) on the right three. */
export const IMAGE: number[][] = Array.from({ length: IMAGE_SIZE }, () =>
  Array.from({ length: IMAGE_SIZE }, (_, c) => (c < 3 ? 0 : 1)),
);

/** A vertical-edge detector: negative on the left, zero in the middle, positive on the right. */
export const KERNEL: number[][] = [
  [-1, 0, 1],
  [-1, 0, 1],
  [-1, 0, 1],
];

/** The dot product of the kernel with the image patch whose top-left corner is (row, col). */
export function convolveAt(row: number, col: number): number {
  let sum = 0;
  for (let kr = 0; kr < KERNEL_SIZE; kr++) {
    for (let kc = 0; kc < KERNEL_SIZE; kc++) {
      sum += KERNEL[kr][kc] * IMAGE[row + kr][col + kc];
    }
  }
  return sum;
}

export function computeFeatureMap(): number[][] {
  return Array.from({ length: FEATURE_MAP_SIZE }, (_, r) =>
    Array.from({ length: FEATURE_MAP_SIZE }, (_, c) => convolveAt(r, c)),
  );
}

export const FEATURE_MAP: number[][] = computeFeatureMap();
export const MAX_RESPONSE = Math.max(...FEATURE_MAP.flat());
