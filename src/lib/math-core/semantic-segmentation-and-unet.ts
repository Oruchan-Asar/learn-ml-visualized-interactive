/**
 * A U-Net's encoder repeatedly max-pools an image down to a small, information-poor bottleneck; its
 * decoder has to undo that, upsampling the bottleneck back out to full resolution. Upsampling alone
 * can only repeat coarse values — it cannot recover detail the pooling already discarded. A skip
 * connection reintroduces the encoder's own feature map at each matching resolution, so the decoder
 * has real spatial detail to work with instead of a blurry guess. Every grid here is small and square
 * (4x4 -> 2x2 -> 1x1) so every pooled, upsampled, and reconstructed value can be checked by hand.
 */

export const GRID_SIZE = 4;

/** A tiny 4x4 "image" with enough internal variation that 2x2 max pooling visibly discards detail. */
export const INPUT: number[][] = [
  [1, 3, 6, 2],
  [4, 2, 8, 5],
  [7, 1, 3, 9],
  [0, 5, 2, 6],
];

/** Non-overlapping 2x2 max pooling: halves each spatial dimension, keeping only the block maximum. */
export function maxPool2x2(grid: number[][]): number[][] {
  const size = grid.length;
  const out: number[][] = [];
  for (let r = 0; r < size; r += 2) {
    const row: number[] = [];
    for (let c = 0; c < size; c += 2) {
      row.push(Math.max(grid[r][c], grid[r][c + 1], grid[r + 1][c], grid[r + 1][c + 1]));
    }
    out.push(row);
  }
  return out;
}

/** Nearest-neighbor upsampling: each cell is repeated into a 2x2 block, doubling each spatial dimension. */
export function upsample2x(grid: number[][]): number[][] {
  const size = grid.length;
  const out: number[][] = Array.from({ length: size * 2 }, () => new Array(size * 2).fill(0));
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      out[2 * r][2 * c] = grid[r][c];
      out[2 * r][2 * c + 1] = grid[r][c];
      out[2 * r + 1][2 * c] = grid[r][c];
      out[2 * r + 1][2 * c + 1] = grid[r][c];
    }
  }
  return out;
}

/** Elementwise average of two equal-shaped grids — the simplified stand-in for "combine skip + upsampled". */
export function elementwiseAverage(a: number[][], b: number[][]): number[][] {
  return a.map((row, r) => row.map((v, c) => (v + b[r][c]) / 2));
}

// Encoder: two levels of pooling from 4x4 down to a 1x1 bottleneck.
export const SKIP0 = INPUT; // 4x4, saved for the final decoder stage
export const SKIP1 = maxPool2x2(INPUT); // 2x2, saved for the middle decoder stage
export const BOTTLENECK = maxPool2x2(SKIP1); // 1x1 — everything but the global max is gone

/** Decoder without skip connections: pure upsampling from the bottleneck, with no way to recover detail. */
export function decodeWithoutSkip(): number[][] {
  return upsample2x(upsample2x(BOTTLENECK));
}

/** Decoder with skip connections: each upsampled stage is averaged with the matching encoder feature map. */
export function decodeWithSkip(): number[][] {
  const stage1 = elementwiseAverage(upsample2x(BOTTLENECK), SKIP1); // 2x2
  return elementwiseAverage(upsample2x(stage1), SKIP0); // 4x4
}

export function mse(a: number[][], b: number[][]): number {
  let sum = 0;
  let count = 0;
  for (let r = 0; r < a.length; r++) {
    for (let c = 0; c < a[r].length; c++) {
      const d = a[r][c] - b[r][c];
      sum += d * d;
      count++;
    }
  }
  return sum / count;
}

export function reconstructionErrorWithoutSkip(): number {
  return mse(decodeWithoutSkip(), INPUT);
}

export function reconstructionErrorWithSkip(): number {
  return mse(decodeWithSkip(), INPUT);
}
