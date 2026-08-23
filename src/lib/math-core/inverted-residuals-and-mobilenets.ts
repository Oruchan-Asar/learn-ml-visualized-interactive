/**
 * A standard K x K convolution mixes space and channels in one operation: every output channel
 * looks at every input channel, at every position in the kernel. MobileNet factors that single
 * operation into two cheaper ones — a depthwise K x K conv that filters each channel on its own
 * (space only, no channel mixing) followed by a pointwise 1x1 conv that mixes channels (no spatial
 * extent at all). Stacked the "inverted" way inside a residual block — expand channels with a 1x1,
 * filter with a depthwise K x K, project back down with a linear 1x1 — this is the MobileNetV2
 * inverted-residual bottleneck. All shapes here are tiny and exact: a 4x4 output feature map, a
 * 3x3 kernel, and small channel counts, so every parameter/FLOP count can be checked by hand.
 */

export const KERNEL_SIZE = 3;
export const SPATIAL_SIZE = 4; // a 4x4 output feature map
export const EXPANSION_FACTOR = 6; // MobileNetV2's default expansion ratio t
export const CHANNEL_OPTIONS = [4, 8, 16, 32];

export function expandedChannels(channels: number, expansion: number = EXPANSION_FACTOR): number {
  return channels * expansion;
}

/** A standard (dense) K x K convolution's parameter count: one K x K x Cin filter per output channel. */
export function standardConvParams(cin: number, cout: number, k: number = KERNEL_SIZE): number {
  return k * k * cin * cout;
}

/** Multiply-adds for a standard conv: one full filter application per output pixel. */
export function standardConvFlops(cin: number, cout: number, spatial: number = SPATIAL_SIZE, k: number = KERNEL_SIZE): number {
  return standardConvParams(cin, cout, k) * spatial * spatial;
}

/** A depthwise K x K convolution: one K x K filter per channel, no mixing across channels. */
export function depthwiseConvParams(channels: number, k: number = KERNEL_SIZE): number {
  return k * k * channels;
}

export function depthwiseConvFlops(channels: number, spatial: number = SPATIAL_SIZE, k: number = KERNEL_SIZE): number {
  return depthwiseConvParams(channels, k) * spatial * spatial;
}

/** A 1x1 "pointwise" convolution: pure channel mixing, no spatial extent. */
export function pointwiseConvParams(cin: number, cout: number): number {
  return cin * cout;
}

export function pointwiseConvFlops(cin: number, cout: number, spatial: number = SPATIAL_SIZE): number {
  return pointwiseConvParams(cin, cout) * spatial * spatial;
}

/** Depthwise-separable conv = depthwise K x K + pointwise 1x1, replacing one dense K x K conv. */
export function depthwiseSeparableParams(cin: number, cout: number, k: number = KERNEL_SIZE): number {
  return depthwiseConvParams(cin, k) + pointwiseConvParams(cin, cout);
}

export function depthwiseSeparableFlops(cin: number, cout: number, spatial: number = SPATIAL_SIZE, k: number = KERNEL_SIZE): number {
  return depthwiseSeparableParams(cin, cout, k) * spatial * spatial;
}

/**
 * separable / standard parameter ratio. For cin = cout = channels this reduces to an exact,
 * spatial-size-independent identity: 1/channels + 1/k^2 — the classic MobileNet efficiency formula.
 */
export function paramReductionRatio(channels: number, k: number = KERNEL_SIZE): number {
  return depthwiseSeparableParams(channels, channels, k) / standardConvParams(channels, channels, k);
}

/**
 * The inverted-residual bottleneck: expand 1x1 (Cin -> Cin*t), filter with a depthwise K x K in the
 * expanded space, then project back down 1x1 (linear, no activation) to Cin so the block's output
 * can be added back to its input.
 */
export function invertedResidualParams(channels: number, expansion: number = EXPANSION_FACTOR, k: number = KERNEL_SIZE): number {
  const expanded = expandedChannels(channels, expansion);
  return pointwiseConvParams(channels, expanded) + depthwiseConvParams(expanded, k) + pointwiseConvParams(expanded, channels);
}

export function invertedResidualFlops(channels: number, expansion: number = EXPANSION_FACTOR, spatial: number = SPATIAL_SIZE, k: number = KERNEL_SIZE): number {
  const expanded = expandedChannels(channels, expansion);
  return pointwiseConvFlops(channels, expanded, spatial) + depthwiseConvFlops(expanded, spatial, k) + pointwiseConvFlops(expanded, channels, spatial);
}

/**
 * The same expand-then-project shape, but with a dense (non-depthwise) K x K conv in the middle —
 * what a "wide" residual bottleneck would cost without the depthwise trick. The gap between this and
 * invertedResidualParams is entirely the middle layer's mixing-vs-filtering distinction.
 */
export function denseMiddleBottleneckParams(channels: number, expansion: number = EXPANSION_FACTOR, k: number = KERNEL_SIZE): number {
  const expanded = expandedChannels(channels, expansion);
  return pointwiseConvParams(channels, expanded) + standardConvParams(expanded, expanded, k) + pointwiseConvParams(expanded, channels);
}

/** How much cheaper the inverted-residual block is than the same shape built from a dense middle conv. */
export function bottleneckReductionRatio(channels: number, expansion: number = EXPANSION_FACTOR, k: number = KERNEL_SIZE): number {
  return invertedResidualParams(channels, expansion, k) / denseMiddleBottleneckParams(channels, expansion, k);
}
