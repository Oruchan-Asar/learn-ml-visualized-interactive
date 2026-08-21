import type { Metadata } from "next";
import { ChapterFrame } from "@/components/chapter/ChapterFrame";
import { getChapterMeta } from "@/lib/curriculum";
import ChapterContent from "@/content/part-13-modern-llm-engineering/capstone-ship-a-tiny-assistant/ClientContent";

const SLUG = "capstone-ship-a-tiny-assistant";

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
