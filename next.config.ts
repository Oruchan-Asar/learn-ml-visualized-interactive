import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

const nextConfig: NextConfig = {};

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
    // Forces the production JSX runtime for MDX output. The dev JSX runtime's
    // owner-stack tracking currently crashes against this React version inside
    // MDX-generated components (`_createMdxContent`) — see commit message.
    development: false,
  },
});

export default withMDX(nextConfig);
