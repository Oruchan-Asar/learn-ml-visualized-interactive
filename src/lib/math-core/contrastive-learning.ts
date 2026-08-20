import { softmax } from "./attention";

export interface Point {
  x: number;
  y: number;
}

export const LABELS = ["dog", "cat", "bird"] as const;

/** Before any training: every image and every caption embeds to the exact same point — no signal at all. */
export const IMAGES_BEFORE: Point[] = [{ x: 1, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 1 }];
export const CAPTIONS_BEFORE: Point[] = [{ x: 1, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 1 }];

/** After training: the exact placements from Chapter 1's joint embedding space. */
export const IMAGES_AFTER: Point[] = [{ x: 2, y: 3 }, { x: 0, y: 1 }, { x: 4, y: 0 }];
export const CAPTIONS_AFTER: Point[] = [{ x: 2.2, y: 2.8 }, { x: 0.3, y: 0.8 }, { x: 3.7, y: 0.4 }];

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Similarity is negative distance — closer points score higher, exactly like a dot-product similarity would. */
function similarity(a: Point, b: Point): number {
  return -distance(a, b);
}

/** The full N x N image-by-caption similarity matrix. */
export function similarityMatrix(images: Point[], captions: Point[]): number[][] {
  return images.map((img) => captions.map((cap) => similarity(img, cap)));
}

function transpose(matrix: number[][]): number[][] {
  return matrix[0].map((_, c) => matrix.map((row) => row[c]));
}

/** For each row, softmax over its similarities — "probability this image matches each caption." */
export function rowSoftmax(matrix: number[][]): number[][] {
  return matrix.map((row) => softmax(row));
}

/** InfoNCE-style loss for one direction: negative log-probability of the true (diagonal) match, averaged. */
function directionalLoss(matrix: number[][]): number {
  const probs = rowSoftmax(matrix);
  const losses = probs.map((row, i) => -Math.log(row[i]));
  return losses.reduce((s, v) => s + v, 0) / losses.length;
}

/** The symmetric contrastive loss: average of image-to-caption and caption-to-image directions. */
export function contrastiveLoss(images: Point[], captions: Point[]): number {
  const imageToCaption = similarityMatrix(images, captions);
  const captionToImage = transpose(imageToCaption);
  return (directionalLoss(imageToCaption) + directionalLoss(captionToImage)) / 2;
}
