import AdminHeader from "@/components/admin/AdminHeader";
import Flash from "@/components/admin/Flash";
import Field from "@/components/admin/Field";
import { requireAdmin } from "@/lib/auth";
import { getSiteSettings } from "@/features/home/queries";
import { saveSettings } from "@/features/admin/actions";

export default async function AdminSettingsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireAdmin();
  const { ok, error } = await searchParams;
  const s = await getSiteSettings();
  return (
    <>
      <AdminHeader title="⚙️ Settings" subtitle="Website की ज़रूरी Settings" />
      <Flash ok={ok} error={error} />
      <form action={saveSettings} className="glass grid gap-3">
        <Field label="Site का नाम" name="name" defaultValue={s.name ?? "Study Universe"} />
        <Field label="Tagline" name="tagline" defaultValue={s.tagline ?? ""} />
        <Field label="Contact Email (Contact Page पर दिखेगा)" name="contact_email" type="email" defaultValue={s.contact_email ?? ""} />
        <Field label="Course Link (नीचे की Bar का Course बटन; Home के Free Course Card से अलग)" name="course_url" defaultValue={s.course_url ?? ""} placeholder="https://... या /courses" />
        <Field label="Courses का बाहरी Link (ज़रूरी नहीं: खाली रखो तो Bottom Bar का Courses बटन अपने /courses Page पर जाएगा)" name="course_url" defaultValue={s.course_url ?? ""} placeholder="https://... या /course" />
        <button type="submit" className="pbtn pbtn-gold">Save करो</button>
      </form>
    </>
  );
}
