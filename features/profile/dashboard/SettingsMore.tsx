"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { logout } from "../actions";
import { setLanguage, setNotifications } from "./settings-actions";
import { T, type Lang } from "@/lib/i18n";

const APP_VERSION = "1.0.0";
const sv = { width: 19, height: 19, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
const IcHeart = () => <svg {...sv}><path d="M12 21s-7-4.6-9.2-9.1C1.2 8.6 3 5 6.5 5c2 0 3.5 1.1 5.5 3.2C14 6.1 15.5 5 17.5 5 21 5 22.8 8.6 21.2 11.9 19 16.4 12 21 12 21Z" /></svg>;
const IcPalette = () => <svg {...sv}><path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-1 1.6-2.1-.4-1.1.2-2.4 1.6-2.4H17a4 4 0 0 0 4-4c0-5-4-9.5-9-9.5Z" /><circle cx="7.5" cy="11" r="1" /><circle cx="10" cy="7" r="1" /><circle cx="15" cy="7.5" r="1" /></svg>;
const IcBell = () => <svg {...sv}><path d="M6 9a6 6 0 1 1 12 0c0 6 2 7 2 7H4s2-1 2-7Z" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>;
const IcGlobe = () => <svg {...sv}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></svg>;
const IcShield = () => <svg {...sv}><path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></svg>;
const IcHelp = () => <svg {...sv}><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01" /></svg>;
const IcInfo = () => <svg {...sv}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>;
const IcOut = () => <svg {...sv}><path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M16 8l4 4-4 4M20 12H9" /></svg>;
const Chev = () => <svg {...sv} width={17} height={17}><path d="m9 6 6 6-6 6" /></svg>;

type Props = { lang: Lang; favCount: number; notifyOn: boolean };

export default function SettingsMore({ lang: initialLang, favCount, notifyOn: initialNotify }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [, start] = useTransition();
  const [lang, setLang] = useState<Lang>(initialLang);
  const [notify, setNotify] = useState(initialNotify);
  const [langOpen, setLangOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const t = T[lang];

  function pickLang(next: Lang) {
    if (next === lang) { setLangOpen(false); return; }
    const prev = lang;
    setLang(next);
    start(async () => {
      const r = await setLanguage(next);
      if (!r.ok) { setLang(prev); toast(r.error ?? "Kuch gadbad hui"); return; }
      toast(T[next].langSaved);
      setLangOpen(false);
      router.refresh();
    });
  }

  function toggleNotify() {
    const next = !notify;
    setNotify(next);
    start(async () => {
      const r = await setNotifications(next);
      if (!r.ok) { setNotify(!next); toast(t.notifErr); }
    });
  }

  return (
    <section id="settings-more" className="pr-sm">
      <div className="pr-sechd"><span>{t.title}</span><i /></div>
      <div className="pr-list">
        <div className="pr-item">
          <Link href="/profile/favorites" className="pr-row">
            <span className="pr-ric" style={{ ["--c" as string]: "#fb7185" }}><IcHeart /></span>
            <span className="pr-rt"><b>{t.fav}</b><small>{t.favSub(favCount)}</small></span>
            <span className="pr-rc"><Chev /></span>
          </Link>
        </div>

        <div className="pr-item">
          <button type="button" className="pr-row" onClick={() => toast(t.appearanceNote)}>
            <span className="pr-ric" style={{ ["--c" as string]: "#a78bfa" }}><IcPalette /></span>
            <span className="pr-rt"><b>{t.appearance}</b><small>{t.appearanceSub}</small></span>
            <span className="pr-rc"><Chev /></span>
          </button>
        </div>

        <div className="pr-item">
          <div className="pr-row" role="group" aria-label={t.notif}>
            <span className="pr-ric" style={{ ["--c" as string]: "#E6B422" }}><IcBell /></span>
            <span className="pr-rt"><b>{t.notif}</b><small>{notify ? t.notifOn : t.notifOff}</small></span>
            <button type="button" role="switch" aria-checked={notify} aria-label={t.notif} className={`pr-sw${notify ? " on" : ""}`} onClick={toggleNotify}><i /></button>
          </div>
        </div>

        <div className="pr-item">
          <button type="button" className="pr-row" onClick={() => setLangOpen((v) => !v)} aria-expanded={langOpen}>
            <span className="pr-ric" style={{ ["--c" as string]: "#38bdf8" }}><IcGlobe /></span>
            <span className="pr-rt"><b>{t.language}</b><small>{t.languageSub}</small></span>
            <span className={`pr-rc${langOpen ? " open" : ""}`}><Chev /></span>
          </button>
          {langOpen ? (
            <div className="pr-lang">
              <button type="button" className={`pr-lchip${lang === "en" ? " on" : ""}`} onClick={() => pickLang("en")} aria-pressed={lang === "en"}>English</button>
              <button type="button" className={`pr-lchip${lang === "hi" ? " on" : ""}`} onClick={() => pickLang("hi")} aria-pressed={lang === "hi"}>हिन्दी</button>
            </div>
          ) : null}
        </div>

        <div className="pr-item">
          <Link href="/profile/settings?open=account" className="pr-row">
            <span className="pr-ric" style={{ ["--c" as string]: "#34d399" }}><IcShield /></span>
            <span className="pr-rt"><b>{t.privacy}</b><small>{t.privacySub}</small></span>
            <span className="pr-rc"><Chev /></span>
          </Link>
        </div>

        <div className="pr-item">
          <Link href="/profile/settings?open=help" className="pr-row">
            <span className="pr-ric" style={{ ["--c" as string]: "#a1a1aa" }}><IcHelp /></span>
            <span className="pr-rt"><b>{t.help}</b><small>{t.helpSub}</small></span>
            <span className="pr-rc"><Chev /></span>
          </Link>
        </div>

        <div className="pr-item">
          <button type="button" className="pr-row" onClick={() => setAboutOpen((v) => !v)} aria-expanded={aboutOpen}>
            <span className="pr-ric" style={{ ["--c" as string]: "#a1a1aa" }}><IcInfo /></span>
            <span className="pr-rt"><b>{t.about}</b><small>{t.aboutSub} • v{APP_VERSION}</small></span>
            <span className={`pr-rc${aboutOpen ? " open" : ""}`}><Chev /></span>
          </button>
          {aboutOpen ? <p className="pr-about">{t.aboutInfo}</p> : null}
        </div>

        <div className="pr-item">
          <form action={logout}>
            <button type="submit" className="pr-row danger">
              <span className="pr-ric" style={{ ["--c" as string]: "#fb7185" }}><IcOut /></span>
              <span className="pr-rt"><b>{t.logout}</b><small>{t.logoutSub}</small></span>
              <span className="pr-rc"><Chev /></span>
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
