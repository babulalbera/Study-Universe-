import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import PlatformsHub from "@/components/courses/PlatformsHub";
import { getPlatforms } from "@/features/platforms/queries";

export const metadata: Metadata = { title: "Free Course" };

export default async function FreeCoursePage() {
  const platforms = await getPlatforms();
  return (
    <>
      <PageHeader title="🎓 Free Course" subtitle="Top quality free courses, ek hi jagah." />
      <PlatformsHub platforms={platforms} />
    </>
  );
}
