"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createBook } from "@/features/admin/content-actions";

const MAX_MB = 50;

export default function BookUpload({ categories }: { categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const file = fd.get("file");
    if (!(file instanceof File) || file.size === 0) return setMsg({ ok: false, text: "PDF चुनो" });
    if (file.type !== "application/pdf") return setMsg({ ok: false, text: "सिर्फ़ PDF चलेगी" });
    if (file.size > MAX_MB * 1024 * 1024) return setMsg({ ok: false, text: `फ़ाइल ${MAX_MB}MB से छोटी हो` });

    setBusy(true);
    setMsg(null);
    const path = `${crypto.randomUUID()}.pdf`;
    const supabase = createClient();
    const up = await supabase.storage.from("books").upload(path, file, { contentType: "application/pdf" });
    if (up.error) {
      setBusy(false);
      return setMsg({ ok: false, text: `Upload नहीं हुआ: ${up.error.message}` });
    }
    const res = await createBook({
      title: String(fd.get("title") ?? ""), author: String(fd.get("author") ?? ""),
      categoryId: String(fd.get("category_id") ?? ""), storagePath: path,
    });
    if (res.error) {
      await supabase.storage.from("books").remove([path]); // adhoora upload saaf
      setBusy(false);
      return setMsg({ ok: false, text: res.error });
    }
    form.reset();
    setBusy(false);
    setMsg({ ok: true, text: "PDF Upload हो गई ✓" });
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <label className="su-field"><span>Title</span><input name="title" required /></label>
      <label className="su-field"><span>Author (ज़रूरी नहीं)</span><input name="author" /></label>
      <label className="su-field"><span>Category</span>
        <select name="category_id" defaultValue="">
          <option value="">— कोई नहीं —</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </label>
      <label className="su-field"><span>PDF फ़ाइल (अधिकतम {MAX_MB}MB)</span><input name="file" type="file" accept="application/pdf" required style={{ height: "auto", padding: 10 }} /></label>
      <button type="submit" className="pbtn pbtn-gold" disabled={busy}>{busy ? "Upload हो रहा है…" : "⬆️ Upload करो"}</button>
      {msg && <p role={msg.ok ? "status" : "alert"} className="text-[13px]" style={{ color: msg.ok ? "var(--mint, #a7f3d0)" : "#fca5a5" }}>{msg.text}</p>}
    </form>
  );
}
