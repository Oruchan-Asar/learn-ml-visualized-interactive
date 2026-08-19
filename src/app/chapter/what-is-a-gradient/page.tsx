import type { Metadata } from "next";
import { ChapterFrame } from "@/components/chapter/ChapterFrame";
import ChapterContent from "@/content/part-1-foundations/what-is-a-gradient/ClientContent";

export const metadata: Metadata = {
  title: "What is a gradient? — Gradient",
};

export default function Page() {
  return (
    <ChapterFrame partLabel="Part I — Foundations" chapterNumber={1} title="What is a gradient?">
      <ChapterContent />
    </ChapterFrame>
  );
}
