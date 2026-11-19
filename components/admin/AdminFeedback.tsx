"use client";
// Admin panel ka "jawab" dene wala hissa (layout me ek baar lagta hai). Teen kaam:
//  1) Save / Delete ke baad aaya ?ok= ya ?error= sandesh screen ke upar hari/laal patti me dikhana (scroll kahin bhi ho)
//  2) Upload / Photo / Video jaise forms ke andar jo ✓ ya ⚠️ likha aata hai, use bhi usi patti me dikhana
//  3) Save ya Upload chal raha ho to "⏳ ho raha hai…" dikhana aur Save button dobara dabne se rokna
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import "./admin-feedback.css";

type Kind = "ok" | "error";
type Toast = { id: number; kind: Kind; text: string };
type Busy = null | "save" | "upload";

const clean = (s: string) => s.replace(/\s+/g, " ").trim().slice(0, 300);

// ?ok= / ?error= (server action ke baad redirect se aata hai)
function UrlFlash({ push }: { push: (kind: Kind, text: string) => void }) {
  const params = useSearchParams();
  const key = params.toString();
  useEffect(() => {
    const error = params.get("error");
    const ok = params.get("ok");
    if (!ok && !error) return;
    if (error) push("error", error);
    if (ok) push("ok", ok);
    // URL se hata do, taaki refresh karne par sandesh dobara na aaye
    const sp = new URLSearchParams(window.location.search);
    sp.delete("ok");
    sp.delete("error");
    const qs = sp.toString();
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${qs ? `?${qs}` : ""}${window.location.hash}`);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export default function AdminFeedback() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [busy, setBusy] = useState<Busy>(null);
  const [mounted, setMounted] = useState(false);
  const nextId = useRef(1);
  const last = useRef({ text: "", at: 0 });

  useEffect(() => setMounted(true), []);

  const push = useCallback((kind: Kind, raw: string) => {
    const text = clean(raw);
    if (!text) return;
    const now = Date.now();
    if (last.current.text === text && now - last.current.at < 1500) return; // wahi sandesh do baar nahi
    last.current = { text, at: now };
    const id = nextId.current++;
    setToasts((t) => [...t.slice(-2), { id, kind, text }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === "error" ? 9000 : 4500);
  }, []);

  // 2) Forms ke andar aaye role="status" / role="alert" sandesh ko bhi patti me dikhao
  useEffect(() => {
    const root = document.querySelector(".adm");
    if (!root) return;
    const seen = new WeakMap<Element, string>();
    const check = (el: Element) => {
      const role = el.getAttribute("role");
      if (role !== "alert" && role !== "status") return;
      const text = clean(el.textContent ?? "");
      if (!text || seen.get(el) === text) return;
      seen.set(el, text);
      push(role === "alert" ? "error" : "ok", text);
    };
    const scan = (node: Node) => {
      const el = node instanceof Element ? node : node.parentElement;
      if (!el) return;
      const own = el.closest('[role="alert"],[role="status"]');
      if (own) check(own);
      if (node instanceof Element) node.querySelectorAll('[role="alert"],[role="status"]').forEach(check);
    };
    const mo = new MutationObserver((list) => {
      for (const m of list) {
        if (m.type === "characterData") scan(m.target);
        else m.addedNodes.forEach(scan);
      }
    });
    mo.observe(root, { childList: true, subtree: true, characterData: true });
    return () => mo.disconnect();
  }, [push]);

  // 3) Server action (Save/Delete) aur Storage upload chal raha ho to "ho raha hai" dikhao
  useEffect(() => {
    const orig = window.fetch;
    let saves = 0;
    let uploads = 0;
    const sync = () => {
      const b: Busy = uploads > 0 ? "upload" : saves > 0 ? "save" : null;
      setBusy(b);
      if (b) document.body.dataset.admBusy = b;
      else delete document.body.dataset.admBusy;
    };
    const kindOf = (input: RequestInfo | URL, init?: RequestInit): "save" | "upload" | null => {
      try {
        const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
        if (method === "GET" || method === "HEAD") return null;
        const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
        const h = init?.headers ?? (input instanceof Request ? input.headers : undefined);
        let action = false;
        if (h instanceof Headers) action = h.has("next-action");
        else if (Array.isArray(h)) action = h.some(([k]) => k.toLowerCase() === "next-action");
        else if (h) action = Object.keys(h).some((k) => k.toLowerCase() === "next-action");
        if (action) return "save";
        if ((method === "POST" || method === "PUT") && url.includes("/storage/v1/object/")) return "upload";
      } catch { /* pehchan na ho to chhod do */ }
      return null;
    };
    window.fetch = async function patched(input: RequestInfo | URL, init?: RequestInit) {
      const kind = kindOf(input, init);
      if (!kind) return orig.call(window, input, init);
      if (kind === "save") saves++;
      else uploads++;
      sync();
      let done = false;
      const end = () => {
        if (done) return;
        done = true;
        if (kind === "save") saves = Math.max(0, saves - 1);
        else uploads = Math.max(0, uploads - 1);
        sync();
      };
      const guard = window.setTimeout(end, 180_000); // atak jaye to bhi screen band na rahe
      try {
        return await orig.call(window, input, init);
      } finally {
        window.clearTimeout(guard);
        end();
      }
    };
    return () => {
      window.fetch = orig;
      delete document.body.dataset.admBusy;
    };
  }, []);

  return (
    <>
      <Suspense fallback={null}><UrlFlash push={push} /></Suspense>
      {mounted &&
        createPortal(
          <>
            <div className="adm-toasts" data-adm-toast>
              {toasts.map((t) => (
                <div key={t.id} className={`adm-toast ${t.kind}`}>
                  <span className="adm-toast-ico" aria-hidden="true">{t.kind === "ok" ? "✅" : "⚠️"}</span>
                  <p>{t.text}</p>
                  <button type="button" aria-label="Band karo" onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}>✕</button>
                </div>
              ))}
            </div>
            {busy && (
              <div className="adm-busy" data-adm-toast>
                <span className="adm-spin" aria-hidden="true" />
                {busy === "upload" ? "Upload हो रहा है… Page बंद मत करो" : "Save हो रहा है… रुको"}
              </div>
            )}
          </>,
          document.body,
        )}
    </>
  );
}
