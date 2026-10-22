"use client";
import Link from "next/link";
import { useState, useTransition, type FormEvent } from "react";
import { useToast } from "@/components/ui/Toast";
import { P, type Lang } from "@/lib/i18n";
import { saveBookProgress } from "./progress-actions";
import type { ContinueBook } from "./continue-queries";

const sv = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
const IcBook = () => <svg {...sv} width={26} height={26}><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Z" /><path d="M4 19a2 2 0 0 1 2-2h13" /></svg>;
const IcPlay = () => <svg {...sv} fill="currentColor" stroke="none"><path d="M7 4.5v15l13-7.5-13-7.5Z" /></svg>;
const IcEdit = () => <svg {...sv}><path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3Z" /></svg>;
const IcClock = () => <svg {...sv} width={13} height={13}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;

export default function ContinueLearning({ book, lang }: { book: ContinueBook | null; lang: Lang }) {
  const t = P[lang].cl;
  const toast = useToast();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [pct, setPct] = useState(book?.pct ?? 0);
  const [pageIn, setPageIn] = useState(book && book.lastPage > 0 ? String(book.lastPage) : "");
  const [pctIn, setPctIn] = useState(book ? String(book.pct) : "");

  const head = <div className="pr-sechd"><span>{t.title}</span><i /></div>;

  if (!book) {
    return (
      <section id="continue" className="pr-cl-wrap">
        {head}
        <div className="pr-cl pr-cl-empty">
          <span className="pr-cl-cover"><IcBook /></span>
          <div className="pr-cl-body">
            <b>{t.emptyTitle}</b>
            <small>{t.emptyText}</small>
          </div>
          <Link href="/books" className="pr-cl-resume"><IcPlay /> {t.openBooks}</Link>
        </div>
      </section>
    );
  }

  const label = pct >= 100 ? t.completed : pct > 0 ? t.inProgress : t.opened;
  const ago = book.agoDays == null ? "" : book.agoDays <= 0 ? t.today : book.agoDays === 1 ? t.yesterday : t.daysAgo(book.agoDays);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!book) return;
    const pageNum = Number(pageIn || 0);
    const pctNum = pctIn === "" ? null : Number(pctIn);
    start(async () => {
      const r = await saveBookProgress(book.id, pageNum, pctNum);
      if (!r.ok) { toast(r.error ?? t.err); return; }
      setPct(r.pct ?? 0);
      toast(t.saved);
      setOpen(false);
    });
  }

  return (
    <section id="continue" className="pr-cl-wrap">
      {head}
      <div className="pr-cl">
        <div className="pr-cl-row">
          <span className="pr-cl-cover"><IcBook /></span>
          <div className="pr-cl-body">
            <div className="pr-cl-meta">
              <span className={`pr-cl-pill${pct >= 100 ? " done" : ""}`}>{label}</span>
              {ago ? <span className="pr-cl-ago"><IcClock /> {ago}</span> : null}
            </div>
            <b className="pr-cl-title">{book.title}</b>
            <small className="pr-cl-sub">{book.author || t.pdf}{book.pages ? ` • ${t.pages(book.pages)}` : ""}</small>
            <div className="pr-cl-prog">
              <div className="ov-bar"><i style={{ width: `${pct}%` }} /></div>
              <span>{pct}%</span>
            </div>
          </div>
        </div>
        <div className="pr-cl-btns">
          <a href={`/books/${book.id}/open`} target="_blank" rel="noopener noreferrer" className="pr-cl-resume"><IcPlay /> {t.resume}</a>
          <button type="button" className="pr-cl-upd" onClick={() => setOpen((v) => !v)} aria-expanded={open}><IcEdit /> {t.update}</button>
        </div>

        {open ? (
          <form className="pr-cl-form" onSubmit={submit}>
            {book.pages ? (
              <label>{t.pageQ} <small>{t.totalPages(book.pages)}</small>
                <input type="number" inputMode="numeric" min={0} max={book.pages} value={pageIn} onChange={(e) => setPageIn(e.target.value)} placeholder={t.pagePh} />
              </label>
            ) : (
              <label>{t.pctQ} <small>{t.pctHint}</small>
                <input type="number" inputMode="numeric" min={0} max={100} value={pctIn} onChange={(e) => setPctIn(e.target.value)} placeholder={t.pagePh} />
              </label>
            )}
            <button type="submit" className="pr-cl-save" disabled={pending}>{pending ? t.saving : t.save}</button>
          </form>
        ) : null}
      </div>
    </section>
  );
}
