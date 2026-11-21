import AdminHeader from "@/components/admin/AdminHeader";
import Flash from "@/components/admin/Flash";
import Field from "@/components/admin/Field";
import DeleteButton from "@/components/admin/DeleteButton";
import PlatformLogoEditor from "@/components/admin/PlatformLogoEditor";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { coverUrl } from "@/lib/book-meta";
import { savePlatform, deletePlatform, saveLink, deleteLink, bulkAddLinks, importDefaultPlatforms } from "@/features/admin/platform-actions";

type SP = Promise<{ ok?: string; error?: string; open?: string }>;
type LinkRow = { id: string; title: string; url: string; sort_order: number; created_at: string };
type PlatformRow = {
  id: string; slug: string; name: string; description: string; color: string; logo_path: string | null; logo_url: string | null;
  sort_order: number; is_published: boolean; free_platform_links: LinkRow[] | null;
};

function PlatformFields({ p }: { p?: PlatformRow }) {
  return (
    <div className="grid gap-3">
      {p && <input type="hidden" name="id" value={p.id} />}
      <Field label="Platform का नाम" name="name" defaultValue={p?.name} required />
      <Field label="छोटा विवरण (card पर दिखेगा)" name="description" defaultValue={p?.description} />
      <Field label="Card का रंग (glow इसी से बनती है)" name="color" type="color" defaultValue={p?.color ?? "#D4AF37"} />
      <Field label="Logo का link (optional). File upload नीचे से भी हो सकता है" name="logo_url" defaultValue={p?.logo_url ?? ""} placeholder="https://..." />
      <Field label="क्रम (छोटा नंबर पहले)" name="sort_order" type="number" defaultValue={p?.sort_order ?? 0} />
      <label className="adm-chk"><input type="checkbox" name="is_published" defaultChecked={p ? p.is_published : true} /> Free Course page पर दिखाओ</label>
      <button type="submit" className="pbtn pbtn-gold">Save करो</button>
    </div>
  );
}

export default async function AdminPlatformsPage({ searchParams }: { searchParams: SP }) {
  await requireAdmin();
  const { ok, error, open } = await searchParams;
  const supabase = await createClient();
  const { data, error: loadError } = await supabase
    .from("free_platforms")
    .select("*, free_platform_links(*)")
    .order("sort_order")
    .order("created_at");
  const rows = (data ?? []) as PlatformRow[];

  return (
    <>
      <AdminHeader title="🌐 Free Platforms" subtitle="Free Course page के platform box, उनकी links और logos" />
      <Flash ok={ok} error={error} />

      {loadError && (
        <p className="su-muted">Table नहीं मिली। पहले Supabase SQL Editor में <code>020_free_platforms.sql</code> चलाओ।</p>
      )}

      {!loadError && rows.length === 0 && (
        <details className="adm-d" open>
          <summary>📥 पुरानी list एक बार Import करो</summary>
          <p className="su-muted">अभी तक कोई platform database में नहीं है। एक tap में सारे 29 platforms और उनकी लगभग 333 links यहाँ आ जाएँगे। फिर सब कुछ यहीं से बदल सकते हो।</p>
          <form action={importDefaultPlatforms}><button type="submit" className="pbtn pbtn-gold">📥 Default Platforms Import करो</button></form>
        </details>
      )}

      <details className="adm-d">
        <summary>➕ नया Platform जोड़ो</summary>
        <form action={savePlatform}><PlatformFields /></form>
      </details>

      {rows.map((p) => {
        const links = [...(p.free_platform_links ?? [])].sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at));
        return (
          <details key={p.id} className="adm-d" open={open === p.id}>
            <summary>
              <span>{p.name}</span>
              <span className={`adm-tag ${p.is_published ? "" : "off"}`}>{p.is_published ? `${links.length} links` : "छिपा"}</span>
            </summary>

            <PlatformLogoEditor id={p.id} name={p.name} src={coverUrl(p.logo_path) ?? p.logo_url} hasFile={!!p.logo_path} />
            <form action={savePlatform}><PlatformFields p={p} /></form>

            <div className="sec" style={{ marginTop: 14 }}><h2>🔗 Links ({links.length})</h2><i /></div>

            <details className="adm-d">
              <summary>➕ एक नई Link जोड़ो</summary>
              <form action={saveLink} className="grid gap-3">
                <input type="hidden" name="platform_id" value={p.id} />
                <Field label="Title" name="title" required />
                <Field label="Link (https://...)" name="url" required placeholder="https://..." />
                <button type="submit" className="pbtn pbtn-gold">Link जोड़ो</button>
              </form>
            </details>

            <details className="adm-d">
              <summary>📋 बहुत सारी Links एक साथ जोड़ो</summary>
              <form action={bulkAddLinks} className="grid gap-3">
                <input type="hidden" name="platform_id" value={p.id} />
                <Field label="हर line में:  Title | https://link   (या सिर्फ़ link)" name="lines" rows={7} placeholder={"Physics Batch | https://example.com/a\nhttps://example.com/b"} />
                <button type="submit" className="pbtn pbtn-gold">सब जोड़ो</button>
              </form>
            </details>

            {links.map((l) => (
              <details key={l.id} className="adm-d">
                <summary><span>{l.title}</span></summary>
                <form action={saveLink} className="grid gap-3">
                  <input type="hidden" name="id" value={l.id} />
                  <input type="hidden" name="platform_id" value={p.id} />
                  <Field label="Title" name="title" defaultValue={l.title} required />
                  <Field label="Link" name="url" defaultValue={l.url} required />
                  <Field label="क्रम" name="sort_order" type="number" defaultValue={l.sort_order} />
                  <button type="submit" className="pbtn pbtn-gold">Save करो</button>
                </form>
                <form action={deleteLink}>
                  <input type="hidden" name="id" value={l.id} />
                  <input type="hidden" name="platform_id" value={p.id} />
                  <DeleteButton label="Link हटाओ" />
                </form>
              </details>
            ))}

            <form action={deletePlatform} style={{ marginTop: 14 }}>
              <input type="hidden" name="id" value={p.id} />
              <DeleteButton label="पूरा Platform हटाओ" />
            </form>
          </details>
        );
      })}
    </>
  );
}
