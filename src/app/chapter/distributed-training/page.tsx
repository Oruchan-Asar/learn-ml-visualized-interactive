import type { Metadata } from "next";
import { ChapterFrame } from "@/components/chapter/ChapterFrame";
import { getChapterMeta } from "@/lib/curriculum";
import ChapterContent from "@/content/part-19-production-ml-systems/distributed-training/ClientContent";

const SLUG = "distributed-training";

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
