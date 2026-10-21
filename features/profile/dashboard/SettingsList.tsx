"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { logout, setNotifAll } from "./settings-actions";

const sv = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
const IcHeart = () => <svg {...sv}><path d="M12 21s-7-4.6-9.2-9.1C1.2 8.6 3 5 6.5 5c2 0 3.5 1.1 5.5 3.2C14 6.1 15.5 5 17.5 5 21 5 22.8 8.6 21.2 11.9 19 16.4 12 21 12 21Z" /></svg>;
const IcPalette = () => <svg {...sv}><path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.8 1.8-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.7-1.6 1.6-1.6H16a5 5 0 0 0 5-5c0-3.9-4-7.3-9-7.3Z" /><circle cx="7.5" cy="11" r="1" /><circle cx="10.5" cy="7" r="1" /><circle cx="15.5" cy="7.5" r="1" /></svg>;
const IcBell = () => <svg {...sv}><path d="M6 9a6 6 0 1 1 12 0c0 6 2 7.5 2 7.5H4S6 15 6 9Z" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>;
const IcShield = () => <svg {...sv}><path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></svg>;
const IcHelp = () => <svg {...sv}><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01" /></svg>;
const IcInfo = () => <svg {...sv}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>;
const IcOut = () => <svg {...sv}><path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4" /><path d="m16 8 4 4-4 4M20 12H9" /></svg>;
const Chev = () => <svg className="pr-chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>;

export default function SettingsList({ favCount, notifOn }: { favCount: number; notifOn: boolean }) {
  const toast = useToast();
  const [on, setOn] = useState(notifOn);
  const [pending, start] = useTransition();
  const [about, setAbout] = useState(false);
  const [askOut, setAskOut] = useState(false);

  function flip() {
    const next = !on;
    setOn(next); // turant dikhao, fail hua to wapas
    start(async () => {
      const r = await setNotifAll(next);
      if (!r.ok) { setOn(!next); toast(r.error ?? "Kuch gadbad hui"); return; }
      toast(next ? "Notifications ON" : "Notifications OFF");
    });
  }

  return (
    <section id="settings" className="pr-sm">
      <div className="pr-sechd"><span>SETTINGS &amp; MORE</span><i /></div>
      <div className="pr-list">
        <Link href="/profile/favorites" className="pr-row">
          <span className="pr-ric rose"><IcHeart /></span>
          <span className="pr-rtx"><b>My Favorites</b><small>{favCount} items • Books &amp; Tests</small></span><Chev />
        </Link>

        <button type="button" className="pr-row" onClick={() => toast("Abhi ek hi theme hai: Dark • Gold-Emerald")}>
          <span className="pr-ric violet"><IcPalette /></span>
          <span className="pr-rtx"><b>Appearance</b><small>Dark • Gold-Emerald</small></span><Chev />
        </button>

        <div className="pr-row">
          <span className="pr-ric gold"><IcBell /></span>
          <span className="pr-rtx"><b>Notifications</b><small>{on ? "ON" : "OFF"} • Naya content, Daily, Goal</small></span>
          <button type="button" role="switch" aria-checked={on} aria-label="Notifications" className={`pr-sw${on ? " on" : ""}`} onClick={flip} disabled={pending}><i /></button>
        </div>

        <Link href="/profile/settings?open=account" className="pr-row">
          <span className="pr-ric green"><IcShield /></span>
          <span className="pr-rtx"><b>Privacy &amp; Security</b><small>Password • Email • Data</small></span><Chev />
        </Link>

        <Link href="/profile/settings?open=help" className="pr-row">
          <span className="pr-ric slate"><IcHelp /></span>
          <span className="pr-rtx"><b>Help &amp; Support</b><small>FAQ • Report a problem</small></span><Chev />
        </Link>

        <button type="button" className="pr-row" onClick={() => setAbout((v) => !v)} aria-expanded={about}>
          <span className="pr-ric slate"><IcInfo /></span>
          <span className="pr-rtx"><b>About App</b><small>Study Universe • v1.0.0</small></span><Chev />
        </button>
        {about ? (
          <div className="pr-about">
            <p><b>Study Universe</b> v1.0.0</p>
            <p>SSC CGL jaise exams ki taiyari ke liye: Daily Tasks, Books &amp; PDFs, Mock Tests aur Results ek jagah.</p>
          </div>
        ) : null}

        <button type="button" className="pr-row out" onClick={() => setAskOut(true)}>
          <span className="pr-ric red"><IcOut /></span>
          <span className="pr-rtx"><b>Log Out</b><small>See you soon • Radhe Radhe</small></span><Chev />
        </button>
      </div>

      <ConfirmDialog open={askOut} title="Log out karna hai?" text="Is device se tumhara account log out ho jayega." onCancel={() => setAskOut(false)} onConfirm={() => { setAskOut(false); start(async () => { await logout(); }); }} />
    </section>
  );
}
