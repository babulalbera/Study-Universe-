"use client";
import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { generateLinkCode } from "@/features/profile/dashboard/telegram-actions";
import type { FormState } from "@/features/profile/types";

const BOT = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
const CHANNEL_LINK = process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_LINK;

function CheckStatusButton() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const toast = useToast();
  const check = async () => {
    setChecking(true);
    try {
      await fetch("/api/telegram/status");
      router.refresh();
    } catch {
      toast("Check nahi ho paya, dobara try karo.");
    } finally {
      setChecking(false);
    }
  };
  return (
    <button type="button" className="pbtn pbtn-ghost" onClick={check} disabled={checking}>
      {checking ? "Check kar rahe hain…" : "🔄 Check Status"}
    </button>
  );
}

export default function GateClient({ telegramLinked, channelMember, referralCount, referralQuota, referralCode, linkCode }: {
  telegramLinked: boolean; channelMember: boolean; referralCount: number; referralQuota: number; referralCode: string; linkCode: string | null;
}) {
  const [st, act, pending] = useActionState<FormState, FormData>(generateLinkCode, {});
  const toast = useToast();
  const code = st.code ?? linkCode;

  const copyCommand = () => {
    if (!code) return;
    navigator.clipboard.writeText(`/start ${code}`);
    toast("Command copy ho gaya — Telegram bot me paste kar do.");
  };
  const copyReferral = () => {
    const link = `${window.location.origin}/r/${referralCode}`;
    navigator.clipboard.writeText(link);
    toast("Referral link copy ho gaya!");
  };

  return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <section className="ov-sec" style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 40 }}>🔒</div>
        <h1 style={{ fontSize: 20, margin: "10px 0" }}>StudyUniverse Locked</h1>

        {!telegramLinked && (
          <>
            <p className="pd-dim">Site unlock karne ke liye pehle apna Telegram account link karo.</p>
            <form action={act}>
              <button type="submit" className="pbtn pbtn-gold" disabled={pending}>
                {pending ? "Code ban raha hai…" : "Link Code banao"}
              </button>
            </form>
            {code && BOT && (
              <div style={{ marginTop: 14 }}>
                <a className="pbtn pbtn-gold" href={`https://t.me/${BOT}?start=${code}`} target="_blank" rel="noopener noreferrer" style={{ display: "block" }}>
                  ➤ Open Telegram App
                </a>
                <div className="pd-row" style={{ marginTop: 8, justifyContent: "center" }}>
                  <span className="pd-dim">Bind Code: <b>{code}</b></span>
                  <button type="button" className="pbtn pbtn-ghost" onClick={copyCommand}>📋 Copy Command</button>
                </div>
                <small className="pd-dim">Bot: @{BOT} (ya /start {code} khud paste karo)</small>
              </div>
            )}
            {st.error && <p className="pd-warn">{st.error}</p>}
          </>
        )}

        {telegramLinked && !channelMember && (
          <>
            <p className="pd-ok">✅ Telegram linked</p>
            <p className="pd-dim">Ab humara Telegram Channel join karo.</p>
            {CHANNEL_LINK && (
              <a className="pbtn pbtn-gold" href={CHANNEL_LINK} target="_blank" rel="noopener noreferrer" style={{ display: "block", marginBottom: 10 }}>
                📢 Channel Join Karo
              </a>
            )}
          </>
        )}

        {telegramLinked && channelMember && referralCount < referralQuota && (
          <>
            <p className="pd-ok">✅ Telegram + Channel done</p>
            <p>📊 Active Referrals: <b>{referralCount} / {referralQuota}</b></p>
            <p className="pd-dim">{referralQuota - referralCount} aur dost ko apna Referral Link bhejo.</p>
            <button type="button" className="pbtn pbtn-gold" onClick={copyReferral}>Referral Link Copy karo</button>
          </>
        )}

        <div style={{ marginTop: 16 }}>
          <CheckStatusButton />
        </div>
      </section>
    </div>
  );
}
