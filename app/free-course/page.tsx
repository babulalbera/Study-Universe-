import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import PlatformsHub from "@/components/courses/PlatformsHub";

export const metadata: Metadata = { title: "Free Course" };

export default function FreeCoursePage() {
  return (
    <>
      <PageHeader title="🎓 Free Course" subtitle="Top quality free courses, ek hi jagah." />
      <PlatformsHub />
    </>
  );
}
