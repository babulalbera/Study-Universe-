"use client";
import { useActionState } from "react";
import { useToast } from "@/components/ui/Toast";
import { generateLinkCode } from "./telegram-actions";
import type { FormState } from "../types";

const BOT = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

function TelegramBlock({ linked, username }: { linked: boolean; username: string | null }) {
  const [st, act, pending] = useActionState<FormState, FormData>(generateLinkCode, {});
  if (linked) {
    return <p className="pd-ok">✅ Telegram linked: @{username}</p>;
  }
  return (
    <>
      <p className="pd-dim">Apna Telegram account link karo — ek baar linked, hamesha ke liye.</p>
      <form action={act}>
        <button type="submit" className="pbtn pbtn-gold" disabled={pending}>
          {pending ? "Code ban raha hai…" : "Link Code banao"}
        </button>
      </form>
      {st.code && BOT && (
        <div className="pd-row" style={{ marginTop: 10 }}>
          <a className="pbtn pbtn-ghost" href={`https://t.me/${BOT}?start=${st.code}`} target="_blank" rel="noopener noreferrer">
            Telegram Bot Kholo (code: {st.code}, 10 min valid)
          </a>
          <small className="pd-dim">Bot me "Start" dabane ke baad is page ko refresh karna.</small>
        </div>
      )}
      {st.error && <p className="pd-warn">{st.error}</p>}
    </>
  );
}

// Referral link ab TELEGRAM BOT ka deep-link hai (website ka link nahi), StudyKing jaisa.
function ReferralBlock({ code, count }: { code: string; count: number }) {
  const toast = useToast();
  const link = BOT ? `https://t.me/${BOT}?start=r_${code}` : "";
  const copy = () => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    toast("Referral link copy ho gaya!");
  };
  const send = () => {
    if (!link) return;
    const text = "StudyUniverse join karo mere saath! 🎓";
    window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`, "_blank");
  };
  return (
    <>
      <p className="pd-dim">Apna link doston ko bhejo. Abhi tak <b>{count}</b> log tumhare link se join kar chuke hain.</p>
      <div className="pd-row" style={{ gap: 10 }}>
        <button type="button" className="pbtn pbtn-gold" onClick={send}>📤 Send Karo</button>
        <button type="button" className="pbtn pbtn-ghost" onClick={copy}>📋 Copy</button>
      </div>
    </>
  );
}

export default function TelegramReferralCard({ telegramLinked, telegramUsername, referralCode, referralCount }: {
  telegramLinked: boolean; telegramUsername: string | null; referralCode: string; referralCount: number;
}) {
  return (
    <section className="ov-sec" style={{ marginTop: 14 }}>
      <b>📱 Telegram Account</b>
      <TelegramBlock linked={telegramLinked} username={telegramUsername} />
      <hr style={{ margin: "14px 0", opacity: 0.15 }} />
      <b>🎁 Referral</b>
      <ReferralBlock code={referralCode} count={referralCount} />
    </section>
  );
}
