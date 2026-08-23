import type { Metadata } from "next";
import { ChapterFrame } from "@/components/chapter/ChapterFrame";
import { getChapterMeta } from "@/lib/curriculum";
import ChapterContent from "@/content/part-2-classical-ml/lasso-regression-l1/ClientContent";

const SLUG = "lasso-regression-l1";

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
