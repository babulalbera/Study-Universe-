"use client";
import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { generateLinkCode, cancelLinkCode } from "@/features/profile/dashboard/telegram-actions";
import type { FormState } from "@/features/profile/types";

const BOT = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
const CHANNEL_LINK = process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_LINK;

// StudyKing jaisa full-screen branded splash: bada icon + spinning ring + status text
function Splash({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <div style={{ textAlign: "center", padding: "30px 10px" }}>
      <div style={{ fontSize: 48, marginBottom: 4 }}>{icon}</div>
      <div className="su-spinner" aria-hidden="true" />
      <p style={{ color: "#2ecc71", fontWeight: 700, fontSize: 17, margin: "10px 0 4px" }}>{title}</p>
      {subtitle && <p className="pd-dim" style={{ fontSize: 13 }}>{subtitle}</p>}
      <style>{`
        .su-spinner { width: 34px; height: 34px; margin: 10px auto 0; border-radius: 50%;
          border: 3px solid rgba(46,204,113,0.25); border-top-color: #2ecc71; animation: su-spin 0.8s linear infinite; }
        @keyframes su-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

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
  if (checking) return <Splash icon="🛡️" title="Validating Membership..." />;
  return (
    <button type="button" className="pbtn pbtn-ghost" onClick={check}>
      🔄 Check Status
    </button>
  );
}

export default function GateClient({ telegramLinked, channelMember, referralCount, referralQuota, referralCode, linkCode }: {
  telegramLinked: boolean; channelMember: boolean; referralCount: number; referralQuota: number; referralCode: string; linkCode: string | null;
}) {
  const [st, act, pending] = useActionState<FormState, FormData>(generateLinkCode, {});
  const [cancelled, setCancelled] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const toast = useToast();
  const code = cancelled ? null : (st.code ?? linkCode);

  // Referral link ab TELEGRAM BOT ka deep-link hai (website ka link nahi) — StudyKing jaisa.
  // "r_" prefix se bot ko pata chalta hai ye referral hai, bind-code nahi.
  const referralLink = BOT ? `https://t.me/${BOT}?start=r_${referralCode}` : "";

  const copyCommand = () => {
    if (!code) return;
    navigator.clipboard.writeText(`/start ${code}`);
    toast("Command copy ho gaya — Telegram bot me paste kar do.");
  };
  const copyReferral = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    toast("Referral link copy ho gaya!");
  };
  const sendReferral = () => {
    if (!referralLink) return;
    const text = "StudyUniverse join karo mere saath! 🎓";
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`, "_blank");
  };
  const resetClick = () => setCancelled(false); // naya code maangte waqt purana "cancelled" flag hata do
  const cancelClick = async () => {
    setCancelling(true);
    try {
      await cancelLinkCode();
      setCancelled(true);
      toast("Code cancel ho gaya.");
    } finally {
      setCancelling(false);
    }
  };

  // "Link Code banao" dabane ke turant baad: StudyKing jaisa "Creating Link Session..." splash
  if (pending) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <section className="ov-sec" style={{ maxWidth: 420, width: "100%" }}>
          <Splash icon="🎓" title="Creating Link Session..." subtitle="StudyUniverse server se secure bind session banaya jaa raha hai." />
        </section>
      </div>
    );
  }

  if (cancelling) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <section className="ov-sec" style={{ maxWidth: 420, width: "100%" }}>
          <Splash icon="↩️" title="Resetting..." />
        </section>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <section className="ov-sec" style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 40 }}>🔒</div>
        <h1 style={{ fontSize: 20, margin: "10px 0" }}>StudyUniverse Locked</h1>

        {!telegramLinked && !code && (
          <>
            <p className="pd-dim">Site unlock karne ke liye pehle apna Telegram account link karo.</p>
            <form action={act}>
              <button type="submit" className="pbtn pbtn-gold" onClick={resetClick}>Link Code banao</button>
            </form>
            {st.error && <p className="pd-warn">{st.error}</p>}
          </>
        )}

        {!telegramLinked && code && (
          <>
            <Splash icon="🎓" title="Waiting for Telegram..." subtitle='Telegram bot me "START" press karein ya command send karein.' />
            {BOT && (
              <div style={{ marginTop: -14 }}>
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
            <p className="pd-dim">{referralQuota - referralCount} aur dost ko apna Referral Link bhejo (Telegram bot link hai, dost sign up ke baad "Link Code" se bind karega).</p>
            <div className="pd-row" style={{ justifyContent: "center", gap: 10 }}>
              <button type="button" className="pbtn pbtn-gold" onClick={sendReferral}>📤 Referral Link Send Karo</button>
              <button type="button" className="pbtn pbtn-ghost" onClick={copyReferral}>📋 Copy</button>
            </div>
          </>
        )}

        <div style={{ marginTop: 16, display: "flex", gap: 16, justifyContent: "center", alignItems: "center" }}>
          <CheckStatusButton />
          {!telegramLinked && code && (
            <button type="button" onClick={cancelClick} style={{ background: "none", border: "none", color: "#e74c3c", fontWeight: 600, cursor: "pointer" }}>
              Cancel &amp; Reset
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
