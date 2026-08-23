/**
 * Splitting one model and its data across many GPUs is not one technique — it's at least three, each
 * moving a different kind of thing over the network. Data parallelism (what DDP/FSDP/ZeRO all build on)
 * keeps a full model copy per GPU and synchronizes gradients. Tensor parallelism (Megatron-LM style)
 * shards individual weight matrices across GPUs and exchanges activations at every layer boundary.
 * Pipeline parallelism assigns whole layers to different GPUs and only passes activations between
 * adjacent stages. On the same tiny fixed model, these three produce very different communication
 * volumes — and the formulas are simple enough to compute by hand.
 */

/** A tiny fixed 2-layer model: each layer is a HIDDEN_DIM x HIDDEN_DIM weight matrix. */
export const HIDDEN_DIM = 4;
export const NUM_LAYERS = 2;
export const TOTAL_PARAMS = HIDDEN_DIM * HIDDEN_DIM * NUM_LAYERS;

/** The tiny cluster this model is being split across. */
export const NUM_GPUS = 4;

/**
 * Ring all-reduce moves 2*(P-1)/P times the payload size — each of the P GPUs sends and receives
 * (P-1)/P of the payload during the reduce-scatter phase, then again during the all-gather phase.
 */
export function ringAllReduceVolume(size: number, gpus: number): number {
  return gpus <= 1 ? 0 : (2 * (gpus - 1) * size) / gpus;
}

/** Data parallel: every GPU holds the full model and all-reduces the full gradient each step. */
export function dataParallelVolume(gpus: number = NUM_GPUS, totalParams: number = TOTAL_PARAMS): number {
  return ringAllReduceVolume(totalParams, gpus);
}

/**
 * Tensor parallel: weights are sharded (no gradient sync needed), but every layer boundary all-reduces
 * an activation vector, once on the way forward and once on the way back.
 */
export function tensorParallelVolume(gpus: number = NUM_GPUS, hiddenDim: number = HIDDEN_DIM, layers: number = NUM_LAYERS): number {
  const perBoundary = ringAllReduceVolume(hiddenDim, gpus);
  return perBoundary * layers * 2;
}

/**
 * Pipeline parallel: layers are assigned to stages, and only the activation at each of the
 * (layers - 1) inter-layer boundaries is sent, point-to-point, forward and backward — no collective.
 */
export function pipelineParallelVolume(hiddenDim: number = HIDDEN_DIM, layers: number = NUM_LAYERS): number {
  return hiddenDim * Math.max(0, layers - 1) * 2;
}

export type Strategy = "data" | "tensor" | "pipeline";

export function communicationVolume(strategy: Strategy, gpus: number = NUM_GPUS): number {
  if (strategy === "data") return dataParallelVolume(gpus);
  if (strategy === "tensor") return tensorParallelVolume(gpus);
  return pipelineParallelVolume();
}

export const STRATEGIES: { key: Strategy; label: string }[] = [
  { key: "data", label: "data parallel (DDP / FSDP / ZeRO)" },
  { key: "tensor", label: "tensor parallel (Megatron-LM)" },
  { key: "pipeline", label: "pipeline parallel" },
];

/** Unseen checkpoint: a larger cluster, same model — how much does data-parallel volume grow? */
export const CHECKPOINT_GPUS = 8;
export const CHECKPOINT_CANDIDATES = [32, 48, 56, 64];
