"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Hit, Mark, OutlineNode, PdfDoc, TocRow } from "./pdf-shared";

const norm = (s: string) => s.replace(/\s+/g, " ").trim();

/* ---- Search: poori book ka text pehle se nikaal kar rakhna (enabled hote hi shuru) ---- */
export function useTextIndex(pdf: PdfDoc | null, enabled: boolean) {
  const texts = useRef<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [hasText, setHasText] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!pdf || !enabled) return;
    let dead = false;
    texts.current = new Array<string>(pdf.numPages).fill("");
    (async () => {
      let found = 0;
      for (let n = 1; n <= pdf.numPages; n++) {
        if (dead) return;
        try {
          const page = await pdf.getPage(n);
          const tc = await page.getTextContent();
          const s = norm(tc.items.map((it) => it.str ?? "").join(" "));
          texts.current[n - 1] = s;
          if (s) found++;
        } catch {
          /* ye page chhod do */
        }
        if (n % 5 === 0 || n === pdf.numPages) {
          if (dead) return;
          setProgress(Math.round((n / pdf.numPages) * 100));
          setVersion((v) => v + 1);
          await new Promise<void>((r) => setTimeout(r, 0)); // phone atke nahi
        }
      }
      if (!dead) {
        setHasText(found > 0);
        setDone(true);
      }
    })();
    return () => {
      dead = true;
    };
  }, [pdf, enabled]);

  const find = useCallback((query: string): Hit[] => {
    const q = norm(query).toLowerCase();
    if (q.length < 2) return [];
    const out: Hit[] = [];
    const all = texts.current;
    for (let i = 0; i < all.length && out.length < 300; i++) {
      const text = all[i];
      if (!text) continue;
      const low = text.toLowerCase();
      let at = low.indexOf(q);
      let perPage = 0;
      while (at !== -1 && perPage < 3 && out.length < 300) {
        const s = Math.max(0, at - 36);
        const e = Math.min(text.length, at + q.length + 56);
        out.push({
          page: i + 1,
          before: (s > 0 ? "…" : "") + text.slice(s, at),
          match: text.slice(at, at + q.length),
          after: text.slice(at + q.length, e) + (e < text.length ? "…" : ""),
        });
        perPage++;
        at = low.indexOf(q, at + q.length);
      }
    }
    return out;
  }, []);

  return { progress, done, hasText, version, find };
}

/* ---- Search result wale page par peela nishaan (highlight) ---- */
export async function findMarks(pdf: PdfDoc, pageNum: number, query: string, retry = true): Promise<Mark[]> {
  try {
    const q = norm(query).toLowerCase();
    if (q.length < 2) return [];
    const page = await pdf.getPage(pageNum);
    if (page.rotate % 360 !== 0) return []; // ghumaye hue page par nishaan sahi nahi baithta
    const [x0, y0, x1, y1] = page.view;
    const W = x1 - x0;
    const H = y1 - y0;
    if (!(W > 0 && H > 0)) return [];
    const tc = await page.getTextContent();
    const marks: Mark[] = [];
    for (const it of tc.items) {
      const s = it.str;
      const t = it.transform;
      const w = it.width;
      if (!s || !t || t.length < 6 || !w) continue;
      const low = s.toLowerCase();
      const size = Math.hypot(t[2], t[3]) || it.height || 10;
      let at = low.indexOf(q);
      while (at !== -1 && marks.length < 80) {
        const x = t[4] - x0 + (at / s.length) * w;
        const mw = Math.max((q.length / s.length) * w, 2);
        marks.push({
          l: (x / W) * 100,
          t: ((y1 - t[5] - size * 0.85) / H) * 100,
          w: (mw / W) * 100,
          h: ((size * 1.1) / H) * 100,
        });
        at = low.indexOf(q, at + q.length);
      }
    }
    if (marks.length === 0 && retry && q.includes(" ")) {
      // poora vaakya kai tukdon me bata hua ho sakta hai: sabse lamba shabd dhundo
      const word = q.split(" ").sort((a, b) => b.length - a.length)[0];
      if (word && word.length >= 3) return findMarks(pdf, pageNum, word, false);
    }
    return marks;
  } catch {
    return [];
  }
}

/* ---- Contents (index): PDF ke andar ka bookmark-tree ---- */
function flatten(nodes: OutlineNode[] | null, depth = 0, out: TocRow[] = []): TocRow[] {
  if (!nodes) return out;
  for (const n of nodes) {
    if (out.length >= 600) break;
    out.push({ title: norm(n.title || "—") || "—", depth, dest: n.dest, page: null });
    if (n.items && n.items.length > 0) flatten(n.items, depth + 1, out);
  }
  return out;
}

export async function destToPage(pdf: PdfDoc, dest: OutlineNode["dest"]): Promise<number | null> {
  try {
    let d: unknown[] | null = null;
    if (typeof dest === "string") d = await pdf.getDestination(dest);
    else if (Array.isArray(dest)) d = dest;
    if (!d || d.length === 0) return null;
    const first = d[0];
    if (typeof first === "number") return first + 1;
    return (await pdf.getPageIndex(first)) + 1;
  } catch {
    return null;
  }
}

export function useOutline(pdf: PdfDoc | null): TocRow[] {
  const [list, setList] = useState<TocRow[]>([]);
  useEffect(() => {
    if (!pdf) return;
    let dead = false;
    (async () => {
      try {
        const rows = flatten(await pdf.getOutline());
        if (dead || rows.length === 0) return;
        setList(rows);
        // har entry ka page number dheere dheere nikaalo
        for (let i = 0; i < rows.length; i += 20) {
          const pages = await Promise.all(rows.slice(i, i + 20).map((r) => destToPage(pdf, r.dest)));
          if (dead) return;
          pages.forEach((p, k) => {
            rows[i + k] = { ...rows[i + k], page: p };
          });
          setList([...rows]);
        }
      } catch {
        /* is book me index nahi hai */
      }
    })();
    return () => {
      dead = true;
    };
  }, [pdf]);
  return list;
}
