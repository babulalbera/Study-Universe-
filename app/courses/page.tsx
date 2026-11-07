import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Course } from "@/types/database";

export const metadata: Metadata = { title: "Courses" };

export default async function CoursesPage() {
  let courses: Course[] = [];
  const withVideos = new Set<string>();
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.from("courses").select("*").eq("is_published", true).order("sort_order").order("created_at", { ascending: false }).limit(60);
    courses = (data ?? []) as Course[];
    if (courses.length) {
      const { data: vids } = await supabase.from("course_videos").select("course_id").eq("is_published", true).in("course_id", courses.map((c) => c.id)).limit(5000);
      ((vids ?? []) as { course_id: string }[]).forEach((v) => withVideos.add(v.course_id));
    }
  }
  return (
    <>
      <PageHeader title="🎓 Courses" subtitle="Free Courses और Playlists, एक ही जगह।" />
      {courses.length === 0 ? (
        <EmptyState icon="🎓" title="अभी कोई Course नहीं है" text="Admin Panel से Course जुड़ते ही यहाँ दिखेंगे।" />
      ) : (
        <div className="su-grid2">
          {courses.map((c) => {
            const ext = c.url ? /^https?:/.test(c.url) : false;
            const hasVideos = withVideos.has(c.id);
            return (
              <div key={c.id} className="su-item" style={{ alignItems: "flex-start", flexDirection: "column" }}>
                <div style={{ minWidth: 0 }}>
                  {c.category && <span className="adm-tag">{c.category}</span>}
                  <h3 style={{ marginTop: 6 }}>{c.title}</h3>
                  {c.description && <p style={{ fontFamily: "var(--dev)" }}>{c.description}</p>}
                </div>
                {hasVideos ? (
                  <Link className="su-btn su-btn-primary" href={`/courses/${c.id}`}>▶ Videos देखो</Link>
                ) : c.url ? (
                  <a className="su-btn su-btn-primary" href={c.url} {...(ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}>▶ Start Learning</a>
                ) : (
                  <span className="su-muted">Link जल्द आएगा</span>
                )}
                {hasVideos && c.url && (
                  <a className="su-muted" href={c.url} {...(ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}>🔗 बाहरी Link</a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
