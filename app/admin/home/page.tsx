import AdminHeader from "@/components/admin/AdminHeader";
import Flash from "@/components/admin/Flash";
import Field from "@/components/admin/Field";
import DeleteButton from "@/components/admin/DeleteButton";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { saveCard, toggleCard, deleteCard, saveSocial } from "@/features/admin/actions";
import type { FeatureCardRow, SocialLinkRow } from "@/types/database";

const ICONS = ["free", "books", "mock", "task", "apps", "exam", "notes", "tips"].map((v) => ({ value: v, label: v }));
type SP = Promise<{ ok?: string; error?: string }>;

function CardFields({ c }: { c?: FeatureCardRow }) {
  const icon = c?.icon_url?.match(/tools\/(\w+)\.webp/)?.[1] ?? "free";
  return (
    <div className="grid gap-3">
      {c && <input type="hidden" name="id" value={c.id} />}
      <Field label="Title" name="title" defaultValue={c?.title} required />
      <Field label="छोटा विवरण" name="description" defaultValue={c?.description} />
      <Field label="Link (जैसे /books या https://...) — खाली = जल्द आ रहा" name="href" defaultValue={c?.href ?? ""} />
      <Field label="Icon" name="icon" defaultValue={icon} options={ICONS} />
      <Field label="मुख्य रंग" name="color" type="color" defaultValue={c?.color ?? "#D4AF37"} />
      <Field label="Background 1" name="bg1" type="color" defaultValue={c?.bg1 ?? "#1E293B"} />
      <Field label="Background 2" name="bg2" type="color" defaultValue={c?.bg2 ?? "#0F172A"} />
      <Field label="क्रम (छोटा नंबर पहले)" name="sort_order" type="number" defaultValue={c?.sort_order ?? 0} />
      <label className="adm-chk"><input type="checkbox" name="is_visible" defaultChecked={c ? c.is_visible : true} /> Home पर दिखाओ</label>
      <button type="submit" className="pbtn pbtn-gold">Save करो</button>
    </div>
  );
}

export default async function AdminHomePage({ searchParams }: { searchParams: SP }) {
  await requireAdmin();
  const { ok, error } = await searchParams;
  const supabase = await createClient();
  const [{ data: cd }, { data: sd }] = await Promise.all([
    supabase.from("feature_cards").select("*").order("sort_order"),
    supabase.from("social_links").select("*").order("sort_order"),
  ]);
  const cards = (cd ?? []) as FeatureCardRow[];
  const socials = (sd ?? []) as SocialLinkRow[];

  return (
    <>
      <AdminHeader title="🏠 Home Cards" subtitle="कार्ड जोड़ना, बदलना, छिपाना और दिखाना" />
      <Flash ok={ok} error={error} />

      <details className="adm-d">
        <summary>➕ नया Card जोड़ो</summary>
        <form action={saveCard}><CardFields /></form>
      </details>

      {cards.map((c) => (
        <details key={c.id} className="adm-d">
          <summary>
            <span>{c.title}</span>
            <span className={`adm-tag ${c.is_visible ? "" : "off"}`}>{c.is_visible ? "दिख रहा" : "छिपा"}</span>
          </summary>
          <form action={saveCard}><CardFields c={c} /></form>
          <div className="su-row">
            <form action={toggleCard}>
              <input type="hidden" name="id" value={c.id} />
              <input type="hidden" name="visible" value={c.is_visible ? "0" : "1"} />
              <button type="submit" className="pbtn pbtn-ghost">{c.is_visible ? "🙈 छिपाओ" : "👁 दिखाओ"}</button>
            </form>
            <form action={deleteCard}>
              <input type="hidden" name="id" value={c.id} />
              <DeleteButton />
            </form>
          </div>
        </details>
      ))}

      <AdminHeaderLike text="🌐 Community / Social Links" />
      {socials.map((x) => (
        <details key={x.id} className="adm-d">
          <summary>
            <span>{x.name}</span>
            <span className={`adm-tag ${x.href ? "" : "off"}`}>{x.href ? "Link लगा है" : "Link नहीं"}</span>
          </summary>
          <form action={saveSocial} className="grid gap-3">
            <input type="hidden" name="id" value={x.id} />
            <Field label="Link (https://...)" name="href" defaultValue={x.href ?? ""} placeholder="https://chat.whatsapp.com/..." />
            <Field label="छोटा Text" name="subtitle" defaultValue={x.subtitle} />
            <label className="adm-chk"><input type="checkbox" name="is_visible" defaultChecked={x.is_visible} /> Home पर दिखाओ</label>
            <button type="submit" className="pbtn pbtn-gold">Save करो</button>
          </form>
        </details>
      ))}
    </>
  );
}

function AdminHeaderLike({ text }: { text: string }) {
  return <div className="sec" style={{ marginTop: 8 }}><h2>{text}</h2><i /></div>;
}
