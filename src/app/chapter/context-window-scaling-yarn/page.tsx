import type { Metadata } from "next";
import { ChapterFrame } from "@/components/chapter/ChapterFrame";
import { getChapterMeta } from "@/lib/curriculum";
import ChapterContent from "@/content/part-15-modern-sequence-models/context-window-scaling-yarn/ClientContent";

const SLUG = "context-window-scaling-yarn";

export const metadata: Metadata = {
  title: `${getChapterMeta(SLUG).title} — Gradient`,
};

export default function Page() {
  return (
    <ChapterFrame slug={SLUG}>
      <ChapterContent />
    </ChapterFrame>
  );
}
