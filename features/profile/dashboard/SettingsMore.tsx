"use client";
import Link from "next/link";
import { useState, useTransition, type ReactNode } from "react";
import { useToast } from "@/components/ui/Toast";
import { logout } from "@/features/profile/actions";
import { setLanguage, setNewContentNotif } from "./prefs-actions";
import { t, type Lang } from "./profile-i18n";

const Ic = ({ children }: { children: ReactNode }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const Chev = () => <svg className="pr-chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>;

type Props = { lang: Lang; favCount: number; notifOn: boolean };

export default function SettingsMore({ lang: initialLang, favCount, notifOn }: Props) {
  const toast = useToast();
  const [lang, setLang] = useState<Lang>(initialLang);
  const [notif, setNotif] = useState(notifOn);
  const [langOpen, setLangOpen] = useState(false);
  const [pending, start] = useTransition();

  function toggleNotif() {
    const next = !notif;
    setNotif(next);
    start(async () => {
      const r = await setNewContentNotif(next);
      if (!r.ok) { setNotif(!next); toast(r.error ?? t(lang, "err")); }
    });
  }

  function pickLang(l: Lang) {
    if (l === lang) { setLangOpen(false); return; }
    const prev = lang;
    setLang(l);
    start(async () => {
      const r = await setLanguage(l);
      if (!r.ok) { setLang(prev); toast(r.error ?? t(prev, "err")); return; }
      toast(t(l, "langSaved"));
      setLangOpen(false);
    });
  }

  const body = (icon: ReactNode, title: string, sub: string, right: ReactNode) => (
    <>
      <span className="pr-sic2">{icon}</span>
      <span className="pr-stx"><b>{title}</b><small>{sub}</small></span>
      {right}
    </>
  );

  return (
    <section id="settings-more" className="pr-set-wrap">
      <div className="pr-sechd"><span>{t(lang, "title")}</span><i /></div>
      <div className="pr-set">
        <Link href="/profile/favorites" className="pr-srow">
          {body(<Ic><path d="M12 21s-7-4.6-9.2-9.1C1.2 8.6 3 5 6.5 5c2 0 3.5 1.1 5.5 3.2C14 6.1 15.5 5 17.5 5 21 5 22.8 8.6 21.2 11.9 19 16.4 12 21 12 21Z" /></Ic>, t(lang, "fav"), t(lang, "favSub", { n: favCount }), <Chev />)}
        </Link>

        <button type="button" className="pr-srow" onClick={() => toast(t(lang, "lookToast"))}>
          {body(<Ic><path d="M12 3a9 9 0 1 0 0 18c1.3 0 2-.9 2-1.9 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8H17a4 4 0 0 0 4-4c0-4.4-4-8-9-8Z" /><circle cx="7.5" cy="11" r="1" /><circle cx="10" cy="7" r="1" /><circle cx="15" cy="7.5" r="1" /></Ic>, t(lang, "look"), t(lang, "lookSub"), <Chev />)}
        </button>

        <div className="pr-srow pr-srow-static">
          {body(<Ic><path d="M18 16v-5a6 6 0 1 0-12 0v5l-2 2h16l-2-2ZM10 21h4" /></Ic>, t(lang, "notif"), t(lang, notif ? "notifOn" : "notifOff"),
            <button type="button" role="switch" aria-checked={notif} aria-label={t(lang, "notif")} className={`pr-switch${notif ? " on" : ""}`} onClick={toggleNotif} disabled={pending}><i /></button>)}
        </div>

        <button type="button" className="pr-srow" onClick={() => setLangOpen((v) => !v)} aria-expanded={langOpen}>
          {body(<Ic><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9S14.5 18.5 12 21c-2.5-2.5-3.5-5.5-3.5-9S9.5 5.5 12 3Z" /></Ic>, t(lang, "lang"), t(lang, "langSub"), <Chev />)}
        </button>
        {langOpen ? (
          <div className="pr-langbox" role="group" aria-label={t(lang, "langPick")}>
            <p>{t(lang, "langPick")}</p>
            <div>
              <button type="button" className={lang === "hi" ? "on" : ""} onClick={() => pickLang("hi")} disabled={pending}>हिन्दी</button>
              <button type="button" className={lang === "en" ? "on" : ""} onClick={() => pickLang("en")} disabled={pending}>English</button>
            </div>
          </div>
        ) : null}

        <Link href="/profile/settings?open=account" className="pr-srow">
          {body(<Ic><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z" /><path d="m9 12 2 2 4-4" /></Ic>, t(lang, "priv"), t(lang, "privSub"), <Chev />)}
        </Link>

        <Link href="/profile/settings?open=support" className="pr-srow">
          {body(<Ic><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01" /></Ic>, t(lang, "help"), t(lang, "helpSub"), <Chev />)}
        </Link>

        <Link href="/about" className="pr-srow">
          {body(<Ic><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></Ic>, t(lang, "about"), t(lang, "aboutSub"), <Chev />)}
        </Link>

        <form action={logout}>
          <button type="submit" className="pr-srow pr-out">
            {body(<Ic><path d="M9 21H5V3h4M16 17l5-5-5-5M21 12H9" /></Ic>, t(lang, "out"), t(lang, "outSub"), <Chev />)}
          </button>
        </form>
      </div>

      <div className="pr-foot"><b>{t(lang, "footA")}</b><small>{t(lang, "footB")}</small></div>
    </section>
  );
}
