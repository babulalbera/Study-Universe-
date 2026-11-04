import { NextResponse } from "next/server";
import { Readable } from "node:stream";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { parseBookLink } from "@/lib/book-links";
import { proxyTarget } from "@/lib/book-proxy";

// Login zaroori. Link hamesha database se aata hai (kabhi URL se nahi), isliye ye "open proxy" nahi banta.
// Reader (pdf.js) ko browser me PDF chahiye, par Drive/Mega seedha CORS se rok dete hain; isliye server se stream hoti hai.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BYTES = 250 * 1024 * 1024;
const text = (msg: string, status: number) =>
  new NextResponse(msg, { status, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUser();
  if (!user) return text("Login zaroori hai", 401);

  const supabase = await createClient();
  const { data } = await supabase.from("books").select("external_url").eq("id", id).eq("is_published", true).maybeSingle();
  const row = data as { external_url: string | null } | null;
  const link = row?.external_url ? parseBookLink(row.external_url) : null;
  const target = link ? proxyTarget(link.source, link.url) : null;
  if (!target) return text("Ye link reader me nahi khul sakta", 422);

  try {
    /* ---- Mega: server par decrypt karke stream ---- */
    if (target.kind === "mega") {
      const { File } = await import("megajs");
      const file = File.fromURL(target.url);
      await file.loadAttributes();
      const size = Number(file.size ?? 0);
      if (size > MAX_BYTES) return text("File bahut badi hai", 413);
      const node = file.download({}) as unknown as Readable;
      const body = Readable.toWeb(node) as unknown as ReadableStream;
      const h = new Headers({
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
        "Cache-Control": "private, max-age=600",
        "X-Content-Type-Options": "nosniff",
      });
      if (size > 0) h.set("Content-Length", String(size));
      return new Response(body, { status: 200, headers: h });
    }

    /* ---- Drive / Dropbox / OneDrive / seedhi .pdf: Range ke saath seedha stream ---- */
    const range = req.headers.get("range");
    const headers: Record<string, string> = { "User-Agent": "Mozilla/5.0 (compatible; StudyUniverse/1.0)" };
    if (range) headers.Range = range;
    const up = await fetch(target.url, { headers, redirect: "follow", cache: "no-store" });

    if (!up.ok && up.status !== 206) {
      await up.body?.cancel();
      return text("Link se file nahi mili (permission ya quota)", 502);
    }
    const type = (up.headers.get("content-type") ?? "").toLowerCase();
    if (type.includes("text/html")) {
      await up.body?.cancel(); // Drive ka permission / quota wala page aaya
      return text("Link public nahi hai ya download limit lag gayi", 422);
    }
    const len = Number(up.headers.get("content-length") ?? 0);
    if (len > MAX_BYTES) {
      await up.body?.cancel();
      return text("File bahut badi hai", 413);
    }

    const h = new Headers({
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline",
      "Cache-Control": "private, max-age=600",
      "X-Content-Type-Options": "nosniff",
    });
    for (const k of ["accept-ranges", "content-range"]) {
      const v = up.headers.get(k);
      if (v) h.set(k, v);
    }
    if (len > 0 && !up.headers.get("content-encoding")) h.set("Content-Length", String(len));
    return new Response(up.body, { status: up.status, headers: h });
  } catch {
    return text("File laate waqt galti hui", 502);
  }
}
