"use client";
import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, FormEvent, KeyboardEvent, MouseEvent as RMouseEvent, PointerEvent as RPointerEvent, ReactNode } from "react";
import Link from "next/link";
import { forgotPassword, login, oauthLogin, resendConfirmation, signup } from "@/features/profile/actions";
import type { FormState } from "@/features/profile/types";
import KrishnaBox from "./KrishnaBox";

type View = "login" | "signup" | "forgot";
const ORDER: View[] = ["login", "signup", "forgot"];
const COPY: Record<View, [string, string]> = {
  login: ["अपने Account में जाओ।", "Wapas aao — aaj ka task wait kar raha hai."],
  signup: ["Free Account बनाओ।", "Ek minute me ready — streak aaj se shuru."],
  forgot: ["Password भूल गए?", "Email do, reset link bhej denge."],
};

/* ---------- social login: jo providers Supabase me ON hain (Vercel env NEXT_PUBLIC_OAUTH_PROVIDERS, jaise "google") ---------- */
const OAUTH_ON = (process.env.NEXT_PUBLIC_OAUTH_PROVIDERS ?? "").toLowerCase().split(",").map((x) => x.trim()).filter(Boolean);

/* ---------- validation ---------- */
const V: Record<string, (v: string) => string> = {
  name: (v) => (v.trim().length >= 2 ? "" : "नाम कम से कम 2 अक्षर का लिखो।"),
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "सही Email डालो (you@example.com)।"),
  password: (v) => (v.length >= 1 ? "" : "Password डालो।"),
  newpw: (v) => (v.length >= 8 ? "" : "Password कम से कम 8 अक्षर का रखो।"),
};

function useV(rules: Record<string, string>) {
  const [ce, setCe] = useState<Record<string, string>>({});
  const touched = useRef<Set<string>>(new Set());
  const check = (name: string, value: string) => {
    const m = V[rules[name]]?.(value) ?? "";
    setCe((p) => ({ ...p, [name]: m }));
    return !m;
  };
  const onBlur = (name: string, value: string) => {
    if (value || touched.current.has(name)) { touched.current.add(name); check(name, value); }
  };
  const onInput = (name: string, value: string) => {
    if (touched.current.has(name) || ce[name]) check(name, value);
  };
  const all = (fd: FormData) => {
    let first = "";
    for (const n of Object.keys(rules)) {
      touched.current.add(n);
      if (!check(n, String(fd.get(n) ?? "")) && !first) first = n;
    }
    return first;
  };
  return { ce, onBlur, onInput, all };
}

// client ka hisaab pehle (agar user ne field chhua), warna server ka error
const pick = (ce: Record<string, string>, srv: Record<string, string> | undefined, n: string) => (ce[n] !== undefined ? ce[n] : srv?.[n] ?? "");

/* ---------- password strength ---------- */
const LV: [string, string][] = [["—", "#71717a"], ["Kamzor", "#f87171"], ["Theek", "#fb923c"], ["Accha", "#facc15"], ["Mazboot", "#34d399"]];
function level(p: string) {
  if (!p.length) return 0;
  if (p.length < 8) return 1;
  let l = 2;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p) && /\d/.test(p)) l++;
  if (/[^A-Za-z0-9]/.test(p) || p.length >= 12) l++;
  return Math.min(4, l);
}

/* ---------- small helpers ---------- */
function ripple(e: RPointerEvent<HTMLButtonElement>) {
  const b = e.currentTarget;
  if (b.classList.contains("loading")) return;
  const r = b.getBoundingClientRect();
  const s = Math.max(r.width, r.height) / 2;
  const el = document.createElement("span");
  el.className = "ac-rip";
  el.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
  b.appendChild(el);
  setTimeout(() => el.remove(), 750);
}

function makeBurst(): CSSProperties[] {
  const cols = ["var(--gold2)", "var(--gold3)", "var(--em)", "var(--mint)", "#fff"];
  return Array.from({ length: 30 }, (_, i) => {
    const a = Math.random() * Math.PI * 2;
    const d = 60 + Math.random() * 110;
    return {
      "--c": cols[i % cols.length], "--dx": `${Math.cos(a) * d}px`, "--dy": `${Math.sin(a) * d - 20}px`,
      "--rot": `${Math.random() * 540 - 270}deg`, animationDelay: `${0.55 + Math.random() * 0.15}s`,
      borderRadius: Math.random() > 0.5 ? "50%" : "2px",
    } as CSSProperties;
  });
}

function Sprite() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <symbol id="ac-mail" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></symbol>
      <symbol id="ac-lock" viewBox="0 0 24 24"><rect x="4.5" y="10.5" width="15" height="10" rx="3" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /><path d="M12 15v2" /></symbol>
      <symbol id="ac-user" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4.5 20c.6-3.6 3.7-5.5 7.5-5.5s6.9 1.9 7.5 5.5" /></symbol>
      <symbol id="ac-eye" viewBox="0 0 24 24"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></symbol>
      <symbol id="ac-eyeoff" viewBox="0 0 24 24"><path d="M3 3l18 18" /><path d="M10.6 5.1A9.7 9.7 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6A17 17 0 0 0 2 12s3.6 7 10 7a9.6 9.6 0 0 0 4-.9" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></symbol>
      <symbol id="ac-arrow" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></symbol>
      <symbol id="ac-check" viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5" /></symbol>
    </svg>
  );
}

type FieldProps = {
  id: string; name: string; label: string; type?: string; icon: string; auto?: string; pw?: boolean;
  error?: string; ok?: boolean;
  onBlur: (n: string, v: string) => void; onInput: (n: string, v: string) => void;
};
function Field({ id, name, label, type = "text", icon, auto, pw, error, ok, onBlur, onInput }: FieldProps) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const email = type === "email";
  return (
    <div className={`ac-field${error ? " bad" : ok ? " ok" : ""}`}>
      <input ref={ref} id={id} name={name} type={pw && show ? "text" : type} placeholder=" " autoComplete={auto}
        inputMode={email ? "email" : undefined} autoCapitalize={email ? "none" : undefined} spellCheck={email ? false : undefined}
        aria-invalid={!!error} aria-describedby={`${id}-err`}
        onBlur={(e) => onBlur(name, e.currentTarget.value)} onInput={(e) => onInput(name, e.currentTarget.value)} required />
      <label htmlFor={id}>{label}</label>
      <svg className="ac-i ac-lead" aria-hidden="true"><use href={`#ac-${icon}`} /></svg>
      {pw && (
        <button type="button" className="ac-eye" aria-pressed={show} aria-label={show ? "Password chhupao" : "Password dikhao"}
          onClick={() => { setShow((s) => !s); ref.current?.focus(); }}>
          <svg className="ac-i on" aria-hidden="true"><use href="#ac-eye" /></svg>
          <svg className="ac-i off" aria-hidden="true"><use href="#ac-eyeoff" /></svg>
        </button>
      )}
      <span className="ac-err" id={`${id}-err`} aria-live="polite">{error}</span>
    </div>
  );
}

function Btn({ pending, children }: { pending: boolean; children: ReactNode }) {
  return (
    <button className={`ac-btn${pending ? " loading" : ""}`} type="submit" disabled={pending} aria-busy={pending} onPointerDown={ripple}>
      <span className="ac-lbl">{children}<svg className="ac-i ac-arr" aria-hidden="true"><use href="#ac-arrow" /></svg></span>
      <span className="ac-spin" aria-hidden="true" />
    </button>
  );
}


const GOOGLE = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.83z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
  </svg>
);
const FACEBOOK = (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.24 2.69.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.88v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" /></svg>
);
const APPLE = (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" /></svg>
);

// Social login — abhi sirf FRONTEND. Backend baad me: yahan se server action / supabase.auth.signInWithOAuth({ provider }) chalega.
function Social({ busy, msg, err, onPick }: { busy: string | null; msg: string; err: boolean; onPick: (p: "google" | "facebook" | "apple") => void }) {
  const b = (p: "google" | "facebook" | "apple", cls: string, icon: ReactNode, label: string) => (
    <button type="button" className={`ac-sbtn ${cls}${busy === p ? " loading" : ""}`} disabled={!!busy} aria-busy={busy === p}
      onPointerDown={ripple} onClick={() => onPick(p)}>
      <span className="ac-lbl">{icon}{label}</span><span className="ac-spin" aria-hidden="true" />
    </button>
  );
  return (
    <>
      <div className="ac-or" aria-hidden="true">ya continue karo</div>
      <div className="ac-social">
        {b("google", "g", GOOGLE, "Continue with Google")}
        {b("facebook", "fb", FACEBOOK, "Facebook")}
        {b("apple", "ap", APPLE, "Apple")}
      </div>
      {msg && <div className={`ac-msg show ${err ? "err2" : "info"}`} role={err ? "alert" : "status"}>{msg}</div>}
    </>
  );
}

/* ================= MAIN ================= */
export default function AuthCard({ initial = "login", next, notice }: { initial?: View; next?: string; notice?: string }) {
  const [view, setView] = useState<View>(initial);
  const [pwv, setPwv] = useState("");
  const [terms, setTerms] = useState(false);
  const [termsBad, setTermsBad] = useState(false);
  const [seen, setSeen] = useState<FormState | null>(null);
  const [burst, setBurst] = useState<CSSProperties[]>([]);
  const [social, setSocial] = useState<string | null>(null);
  const [socialMsg, setSocialMsg] = useState("");
  const [socialErr, setSocialErr] = useState(false);

  const [ls, la, lp] = useActionState<FormState, FormData>(login, {});
  const [ss, sa, sp] = useActionState<FormState, FormData>(signup, {});
  const [fs, fa, fp] = useActionState<FormState, FormData>(forgotPassword, {});
  const [rs, rsAction, rsPending] = useActionState<FormState, FormData>(resendConfirmation, {});

  const lv = useV({ email: "email", password: "password" });
  const sv = useV({ name: "name", email: "email", password: "newpw" });
  const fv = useV({ email: "email" });

  const tiltRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const panelsRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<Record<View, HTMLDivElement | null>>({ login: null, signup: null, forgot: null });

  const idx = ORDER.indexOf(view);
  const pcls = (v: View) => `ac-panel${v === view ? " active" : ""}${ORDER.indexOf(v) < idx ? " left" : ""}`;

  const doShake = useCallback(() => {
    const c = cardRef.current;
    if (!c) return;
    c.classList.remove("shake");
    void c.offsetWidth;
    c.classList.add("shake");
    setTimeout(() => c.classList.remove("shake"), 550);
  }, []);

  const go = useCallback((v: View, focus = false) => {
    setView(v);
    setSocialMsg("");
    setSocialErr(false);
    if (v !== "forgot") {
      const path = v === "signup" ? "/signup" : `/login${next ? `?next=${encodeURIComponent(next)}` : ""}`;
      try { window.history.replaceState(null, "", path); } catch { /* ignore */ }
    }
    if (focus && window.matchMedia("(pointer:fine)").matches) {
      setTimeout(() => panelRefs.current[v]?.querySelector("input")?.focus(), 420);
    }
  }, [next]);

  // Social login: jo provider ON hai (OAUTH_ON) uske liye asli login, baaki par "jaldi shuru hoga".
  const onSocial = async (p: "google" | "facebook" | "apple") => {
    if (social) return;
    const label = p === "google" ? "Google" : p === "facebook" ? "Facebook" : "Apple";
    setSocial(p);
    setSocialMsg("");
    setSocialErr(false);
    if (!OAUTH_ON.includes(p)) {
      setTimeout(() => {
        setSocial(null);
        setSocialMsg(`${label} login jaldi shuru hoga. Abhi Email se Login ya Signup karo.`);
      }, 900);
      return;
    }
    try {
      const r = await oauthLogin(p, next ?? "/profile");
      if (r.url) { window.location.assign(r.url); return; }
      setSocial(null);
      setSocialErr(true);
      setSocialMsg(r.error ?? `${label} login shuru nahi ho paya. Dobara koshish karo.`);
      doShake();
    } catch {
      setSocial(null);
      setSocialErr(true);
      setSocialMsg("Net ya server me dikkat aayi. Dobara koshish karo.");
    }
  };

  // Google se "Back" dabane par loading wapas band
  useEffect(() => {
    const back = (e: PageTransitionEvent) => { if (e.persisted) setSocial(null); };
    window.addEventListener("pageshow", back);
    return () => window.removeEventListener("pageshow", back);
  }, []);

  // panel ki unchai (height) animation
  useEffect(() => {
    const box = panelsRef.current;
    if (!box) return;
    const fit = () => {
      const a = panelRefs.current[view];
      if (a) box.style.height = `${a.offsetHeight}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    Object.values(panelRefs.current).forEach((p) => p && ro.observe(p));
    document.fonts?.ready.then(fit);
    return () => ro.disconnect();
  }, [view]);

  // 3D tilt + glare (sirf mouse wale device par)
  useEffect(() => {
    const fine = window.matchMedia("(hover:hover) and (pointer:fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tilt = tiltRef.current;
    const card = cardRef.current;
    if (!fine || reduce || !tilt || !card) return;
    let raf = 0;
    const move = (e: PointerEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = tilt.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty("--mx", `${((x + 0.5) * 100).toFixed(1)}%`);
        card.style.setProperty("--my", `${((y + 0.5) * 100).toFixed(1)}%`);
        tilt.style.transform = `rotateX(${(-y * 2.2).toFixed(2)}deg) rotateY(${(x * 2.8).toFixed(2)}deg)`;
      });
    };
    const leave = () => { tilt.style.transform = ""; };
    tilt.addEventListener("pointermove", move);
    tilt.addEventListener("pointerleave", leave);
    return () => { tilt.removeEventListener("pointermove", move); tilt.removeEventListener("pointerleave", leave); cancelAnimationFrame(raf); };
  }, []);

  // server se error aaye to card hilao
  useEffect(() => { if (ls.error || ls.fieldErrors) doShake(); }, [ls, doShake]);
  useEffect(() => { if (ss.error || ss.fieldErrors) doShake(); }, [ss, doShake]);
  useEffect(() => { if (fs.error || fs.fieldErrors) doShake(); }, [fs, doShake]);

  // success overlay (signup / forgot) — login par redirect ho jata hai
  const cur = view === "signup" ? ss : view === "forgot" ? fs : null;
  const showDone = !!cur && !!cur.message && !cur.error && cur !== seen;
  useEffect(() => { setBurst(showDone ? makeBurst() : []); }, [showDone]);

  const guard = (v: ReturnType<typeof useV>) => (e: FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget;
    const first = v.all(new FormData(form));
    if (first) {
      e.preventDefault();
      doShake();
      (form.elements.namedItem(first) as HTMLElement | null)?.focus();
    }
  };
  const onLogin = guard(lv);
  const onForgot = guard(fv);
  const onSignup = (e: FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget;
    const first = sv.all(new FormData(form));
    if (!terms) setTermsBad(true);
    if (first || !terms) {
      e.preventDefault();
      doShake();
      const target = first ? form.elements.namedItem(first) : form.elements.namedItem("terms");
      (target as HTMLElement | null)?.focus();
    }
  };

  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const t: View = view === "signup" ? "login" : "signup";
    go(t);
    document.getElementById(`tab-${t}`)?.focus();
  };

  const resendClick = (e: RMouseEvent<HTMLButtonElement>) => {
    const el = e.currentTarget.form?.elements.namedItem("email") as HTMLInputElement | null;
    const src = document.getElementById("l-email") as HTMLInputElement | null;
    if (el && src) el.value = src.value;
  };

  const doneTitle = view === "signup" ? "Account ready! ✨" : "Link bhej diya 📩";
  const doneBtn = view === "signup" ? "Login par jao" : "Login par wapas";

  return (
    <div className="ac-wrap">
      <Sprite />
      <div className="ac-tilt" ref={tiltRef}>
        <div className="ac-card" ref={cardRef}>
          <span className="ac-glare" aria-hidden="true" />
          <h1 className="ac-sr">Study Universe — Login ya Signup</h1>

          {/* ===== LEFT: brand + Krishna ===== */}
          <aside className="ac-story">

            <div className="ac-hero">
              <span className="ac-eyebrow"><span className="ac-dot" />PREMIUM STUDY SPACE</span>
              <p className="ac-h1" aria-hidden="true">
                <span className="w" style={{ "--d": 0 } as CSSProperties}>Roz</span>{" "}
                <span className="w" style={{ "--d": 1 } as CSSProperties}>ek</span>{" "}
                <span className="w" style={{ "--d": 2 } as CSSProperties}>kadam,</span><br />
                <em className="w" style={{ "--d": 3 } as CSSProperties}>selection</em>{" "}
                <span className="w" style={{ "--d": 4 } as CSSProperties}>ki</span>{" "}
                <span className="w" style={{ "--d": 5 } as CSSProperties}>taraf.</span>
              </p>
              <p className="ac-sub">SSC CGL, Army GD aur GK ki taiyari ke liye free tasks, books, PDFs aur mock tests — sab ek jagah. Login karo aur apni streak shuru karo.</p>
              <ul className="ac-perks">
                {["Daily Tasks & Streak", "Mock Tests", "Books & PDFs", "100% Free"].map((t) => (
                  <li key={t}><svg className="ac-i" aria-hidden="true"><use href="#ac-check" /></svg>{t}</li>
                ))}
              </ul>
            </div>

            <KrishnaBox />
          </aside>

          {/* ===== RIGHT: form ===== */}
          <div className="ac-formside">
            <div className="ac-head" key={view}>
              <h2>{COPY[view][0]}</h2>
              <p>{COPY[view][1]}</p>
            </div>

            <div className={`ac-tabs${view === "forgot" ? " hide" : ""}`} role="tablist" aria-label="Login ya Signup"
              data-active={view === "signup" ? "signup" : "login"} onKeyDown={onTabKey}>
              <span className="ac-ind" aria-hidden="true" />
              <button type="button" role="tab" id="tab-login" aria-controls="p-login" aria-selected={view === "login"} tabIndex={view === "login" ? 0 : -1} onClick={() => go("login", true)}>Login</button>
              <button type="button" role="tab" id="tab-signup" aria-controls="p-signup" aria-selected={view === "signup"} tabIndex={view === "signup" ? 0 : -1} onClick={() => go("signup", true)}>Signup</button>
            </div>

            <div className="ac-panels" ref={panelsRef}>
              {/* LOGIN */}
              <div className={pcls("login")} id="p-login" role="tabpanel" aria-labelledby="tab-login" ref={(el) => { panelRefs.current.login = el; }}>
                <form action={la} onSubmit={onLogin} className="ac-form" noValidate>
                  <input type="hidden" name="next" value={next ?? "/profile"} />
                  {notice && <div className="ac-msg show err2" role="alert">{notice}</div>}
                  <Field id="l-email" name="email" label="Email" type="email" icon="mail" auto="email"
                    error={pick(lv.ce, ls.fieldErrors, "email")} ok={lv.ce.email === ""} onBlur={lv.onBlur} onInput={lv.onInput} />
                  <Field id="l-pw" name="password" label="Password" type="password" icon="lock" auto="current-password" pw
                    error={pick(lv.ce, ls.fieldErrors, "password")} ok={lv.ce.password === ""} onBlur={lv.onBlur} onInput={lv.onInput} />
                  <div className="ac-row"><button type="button" className="ac-link" onClick={() => go("forgot", true)}>Password भूल गए?</button></div>
                  {ls.error && <div className="ac-msg show err2" role="alert">{ls.error}</div>}
                  {ls.message && <div className="ac-msg show ok" role="status">{ls.message}</div>}
                  <Btn pending={lp}>Login</Btn>
                  <Social busy={social} msg={view === "login" ? socialMsg : ""} err={socialErr} onPick={onSocial} />
                  <p className="ac-alt">नया हो? <button type="button" className="ac-link" onClick={() => go("signup", true)}>Signup करो</button></p>
                </form>
                {ls.needsConfirm && (
                  <form action={rsAction} className="ac-form" style={{ marginTop: 12 }}>
                    <input type="hidden" name="email" />
                    <button type="submit" className="ac-ghost" disabled={rsPending} onClick={resendClick}>
                      {rsPending ? "रुको…" : "Confirm Email dobara bhejo"}
                    </button>
                    {rs.error && <div className="ac-msg show err2" role="alert">{rs.error}</div>}
                    {rs.fieldErrors?.email && <div className="ac-msg show err2" role="alert">{rs.fieldErrors.email}</div>}
                    {rs.message && <div className="ac-msg show ok" role="status">{rs.message}</div>}
                  </form>
                )}
              </div>

              {/* SIGNUP */}
              <div className={pcls("signup")} id="p-signup" role="tabpanel" aria-labelledby="tab-signup" ref={(el) => { panelRefs.current.signup = el; }}>
                <form action={sa} onSubmit={onSignup} className="ac-form" noValidate>
                  <Field id="s-name" name="name" label="नाम" icon="user" auto="name"
                    error={pick(sv.ce, ss.fieldErrors, "name")} ok={sv.ce.name === ""} onBlur={sv.onBlur} onInput={sv.onInput} />
                  <Field id="s-email" name="email" label="Email" type="email" icon="mail" auto="email"
                    error={pick(sv.ce, ss.fieldErrors, "email")} ok={sv.ce.email === ""} onBlur={sv.onBlur} onInput={sv.onInput} />
                  <Field id="s-pw" name="password" label="Password (कम से कम 8 अक्षर)" type="password" icon="lock" auto="new-password" pw
                    error={pick(sv.ce, ss.fieldErrors, "password")} ok={sv.ce.password === ""} onBlur={sv.onBlur}
                    onInput={(n, v) => { setPwv(v); sv.onInput(n, v); }} />
                  <div className="ac-meter" aria-hidden="true" style={{ "--c": LV[level(pwv)][1] } as CSSProperties}>
                    <div className="bars">{[0, 1, 2, 3].map((i) => <i key={i} className={i < level(pwv) ? "on" : ""} />)}</div>
                    <small><span>Password ki taakat</span><b>{LV[level(pwv)][0]}</b></small>
                  </div>
                  <div className={`ac-chkwrap${termsBad ? " bad" : ""}`}>
                    <label className="ac-chk">
                      <input type="checkbox" name="terms" checked={terms} onChange={(e) => { setTerms(e.target.checked); if (e.target.checked) setTermsBad(false); }} />
                      <span className="box"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg></span>
                      <span>मैं <Link href="/terms" target="_blank" rel="noopener">Terms</Link> और <Link href="/privacy" target="_blank" rel="noopener">Privacy</Link> से सहमत हूँ।</span>
                    </label>
                    <span className="ac-err" aria-live="polite">Aage badhne ke liye Terms aur Privacy accept karo.</span>
                  </div>
                  {ss.error && <div className="ac-msg show err2" role="alert">{ss.error}</div>}
                  <Btn pending={sp}>Account बनाओ</Btn>
                  <Social busy={social} msg={view === "signup" ? socialMsg : ""} err={socialErr} onPick={onSocial} />
                  <p className="ac-alt">पहले से Account है? <button type="button" className="ac-link" onClick={() => go("login", true)}>Login करो</button></p>
                </form>
              </div>

              {/* FORGOT */}
              <div className={pcls("forgot")} id="p-forgot" ref={(el) => { panelRefs.current.forgot = el; }}>
                <form action={fa} onSubmit={onForgot} className="ac-form" noValidate>
                  <button type="button" className="ac-link ac-back" onClick={() => go("login", true)}>
                    <svg className="ac-i" aria-hidden="true"><use href="#ac-arrow" /></svg>Login par wapas
                  </button>
                  <Field id="f-email" name="email" label="Email" type="email" icon="mail" auto="email"
                    error={pick(fv.ce, fs.fieldErrors, "email")} ok={fv.ce.email === ""} onBlur={fv.onBlur} onInput={fv.onInput} />
                  {fs.error && <div className="ac-msg show err2" role="alert">{fs.error}</div>}
                  <Btn pending={fp}>Reset Link भेजो</Btn>
                </form>
              </div>
            </div>

            {/* success */}
            <div className={`ac-done${showDone ? " show" : ""}`} aria-live="polite" aria-hidden={!showDone}>
              <div className="ac-burst" aria-hidden="true">{burst.map((s, i) => <i key={i} style={s} />)}</div>
              <div className="ac-ck"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" /><path d="M30 52l14 14 27-30" /></svg></div>
              <h3>{doneTitle}</h3>
              <p>{cur?.message}</p>
              <button type="button" className="ac-btn" tabIndex={showDone ? 0 : -1} onPointerDown={ripple}
                onClick={() => { setSeen(cur); go("login"); }}>
                <span className="ac-lbl">{doneBtn}<svg className="ac-i ac-arr" aria-hidden="true"><use href="#ac-arrow" /></svg></span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
