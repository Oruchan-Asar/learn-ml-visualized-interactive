import type { Metadata } from "next";
import { ChapterFrame } from "@/components/chapter/ChapterFrame";
import { getCourse } from "@/lib/courses";
import ChapterContent from "@/content/decentralized-systems/causality-and-happened-before/ClientContent";

const COURSE = getCourse("decentralized-systems");
const SLUG = "causality-and-happened-before";
const META = COURSE.curriculum.find((c) => c.slug === SLUG)!;

export const metadata: Metadata = {
  title: `${META.title} — Gradient`,
};

export default function Page() {
  return (
    <ChapterFrame slug={SLUG} course={COURSE}>
      <ChapterContent />
    </ChapterFrame>
  );
}
