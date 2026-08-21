import { ITEMS, DOMAIN, findItem, nearestOfModality, distance } from "./audio-and-speech-embeddings";
import { conditionedReverse, finalX0, SHARED_X_T, CAT_NOISE, DOG_NOISE } from "./text-conditioned-diffusion";

export { ITEMS, DOMAIN, findItem, nearestOfModality, distance, conditionedReverse, SHARED_X_T };

/**
 * A tiny end-to-end pipeline: an audio clip retrieves its matching caption in the shared embedding
 * space (Chapter 1), and that caption's concept selects which noise-conditioning sequence steers
 * the reverse-diffusion process (Chapter 2) — the exact same two mechanisms, chained.
 */
export const BIRD_NOISE: number[] = [0.5, -0.9, 0.4, -0.2];

const NOISE_BY_CAPTION: Record<string, number[]> = {
  "Caption: a dog running": DOG_NOISE,
  "Caption: a cat sleeping": CAT_NOISE,
  "Caption: a bird flying": BIRD_NOISE,
};

export interface PipelineResult {
  audioLabel: string;
  retrievedCaption: string;
  retrievalDistance: number;
  noiseUsed: number[];
  generatedValue: number;
}

export function runAssistant(audioLabel: string): PipelineResult {
  const audioItem = findItem(audioLabel);
  const retrieved = nearestOfModality(audioItem, "text");
  const noiseUsed = NOISE_BY_CAPTION[retrieved.label];
  if (!noiseUsed) throw new Error(`No conditioning defined for caption "${retrieved.label}"`);
  return {
    audioLabel,
    retrievedCaption: retrieved.label,
    retrievalDistance: distance(audioItem, retrieved),
    noiseUsed,
    generatedValue: finalX0(noiseUsed),
  };
}

export const AUDIO_LABELS: string[] = ITEMS.filter((i) => i.modality === "audio").map((i) => i.label);
