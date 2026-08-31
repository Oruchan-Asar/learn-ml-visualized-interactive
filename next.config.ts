import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

const nextConfig: NextConfig = {
  experimental: {
    // The static-generation worker count multiplies peak build memory (each worker gets its
    // own NODE_OPTIONS heap cap), and this repo's content has grown large enough that 4
    // concurrent workers pushed total build memory over the deploy platform's ceiling even
    // with each worker capped at 4GB. Serializing generation trades build time for a much
    // lower, single-process memory ceiling.
    cpus: 1,
    webpackMemoryOptimizations: true,
  },
};

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
});

export default withMDX(nextConfig);
