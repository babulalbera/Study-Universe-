"use client";

import { useEffect, useRef } from "react";
import type { PdfDoc, Rendered, Renderer } from "./pdf-shared";

/* ---- Page renderer: cache + ek saath sirf 2 render + pehle se tayyar (prefetch) ---- */
export function createRenderer(doc: PdfDoc, maxEntries = 16): Renderer {
  const cache = new Map<string, Rendered>();
  const pending = new Map<string, Promise<Rendered | null>>();
  const queue: (() => void)[] = [];
  let active = 0;
  const MAX_ACTIVE = 2;
  const PIXEL_BUDGET = 48_000_000;

  const pump = () => {
    while (active < MAX_ACTIVE && queue.length > 0) {
      const job = queue.pop(); // sabse naya maanga hua pehle
      if (!job) break;
      active++;
      job();
    }
  };

  const evict = () => {
    let px = 0;
    cache.forEach((r) => { px += r.canvas.width * r.canvas.height; });
    for (const [k, r] of cache) {
      if (px <= PIXEL_BUDGET && cache.size <= maxEntries) break;
      px -= r.canvas.width * r.canvas.height;
      cache.delete(k);
    }
  };

  const run = async (num: number, width: number): Promise<Rendered | null> => {
    try {
      const page = await doc.getPage(num);
      const base = page.getViewport({ scale: 1 });
      const cssH = (base.height / base.width) * width;
      const maxDpr = Math.sqrt(10_000_000 / (width * cssH));
      const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2, maxDpr));
      const vp = page.getViewport({ scale: (width / base.width) * dpr });
      const canvas = document.createElement("canvas");
      canvas.width = Math.floor(vp.width);
      canvas.height = Math.floor(vp.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      await page.render({ canvasContext: ctx, viewport: vp }).promise;
      return { canvas, w: canvas.width / dpr, h: canvas.height / dpr };
    } catch {
      return null;
    }
  };

  return {
    get(num, width, prefetch = false) {
      const w = Math.max(80, Math.round(width));
      const key = `${num}@${w}`;
      const hit = cache.get(key);
      if (hit) {
        cache.delete(key);
        cache.set(key, hit);
        return Promise.resolve(hit);
      }
      const inflight = pending.get(key);
      if (inflight) return inflight;
      const p = new Promise<Rendered | null>((resolve) => {
        const job = () => {
          void run(num, w).then((r) => {
            active--;
            pending.delete(key);
            if (r) {
              cache.set(key, r);
              evict();
            }
            resolve(r);
            pump();
          });
        };
        if (prefetch) queue.unshift(job);
        else queue.push(job);
      });
      pending.set(key, p);
      pump();
      return p;
    },
  };
}

/* ---- Ek page ek canvas par (naya page aane tak purana dikhta rehta hai: flicker nahi) ---- */
export function PageCanvas({ rend, num, width, onSize }: { rend: Renderer; num: number; width: number; onSize?: (n: number, w: number, h: number) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (width < 80) return;
    let dead = false;
    void rend.get(num, width).then((r) => {
      if (dead || !r) return;
      const cv = ref.current;
      const ctx = cv?.getContext("2d");
      if (!cv || !ctx) return;
      cv.width = r.canvas.width;
      cv.height = r.canvas.height;
      cv.style.width = `${r.w}px`;
      cv.style.height = `${r.h}px`;
      ctx.drawImage(r.canvas, 0, 0);
      onSize?.(num, r.w, r.h);
    });
    return () => {
      dead = true;
    };
  }, [rend, num, width, onSize]);

  return <canvas ref={ref} className="pdfr-canvas" aria-label={`Page ${num}`} />;
}
