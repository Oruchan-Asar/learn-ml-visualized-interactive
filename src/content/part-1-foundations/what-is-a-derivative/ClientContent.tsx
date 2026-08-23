"use client";

// A thin client boundary around the MDX chapter. Next.js/MDX's RSC path
// currently crashes for this app (an internal `_jsxDEV` owner-stack read),
// so the chapter renders fully client-side instead — harmless here since
// every beat is already interactive.
import Content from "./index.mdx";

export default function ClientContent() {
  return <Content />;
}
