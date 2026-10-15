import type { Notif, NotifyPrefs } from "./queries";
import { markAllRead, markRead } from "./actions";
import NotifPrefsForm from "./NotifPrefsForm";

const KIND: Record<string, string> = { book: "📚", test: "📝", task: "✅", info: "🔔" };
const fmt = (iso: string) => new Date(iso).toLocaleDateString("hi-IN", { day: "numeric", month: "short" });

export default function NotificationsSection({ items, prefs }: { items: Notif[]; prefs: NotifyPrefs }) {
  const unread = items.filter((n) => !n.read).length;
  return (
    <section id="alerts" className="pd-card">
      <h2 className="pd-h">🔔 Notifications <small>({unread} naye)</small></h2>
      {items.length === 0
        ? <p className="pd-dim">Abhi koi suchna nahi. Nayi Book ya Test aate hi yahan dikhegi.</p>
        : (
          <>
            {unread > 0 && <form action={markAllRead}><button type="submit" className="pbtn pbtn-ghost">Sab padhi hui karo</button></form>}
            <div className="pd-nlist">
              {items.map((n) => (
                <form key={n.id} action={markRead} className={`pd-notif ${n.read ? "" : "new"}`}>
                  <input type="hidden" name="id" value={n.id} />
                  <input type="hidden" name="unread" value={n.read ? "1" : "0"} />
                  <span aria-hidden="true">{KIND[n.kind] ?? "🔔"}</span>
                  <div><b>{n.title}</b>{n.body && <p>{n.body}</p>}<small>{fmt(n.at)}</small></div>
                  <button type="submit" className="pbtn pbtn-ghost" aria-label={n.read ? "Unread karo" : "Padhi hui karo"}>{n.read ? "↺" : "✓"}</button>
                </form>
              ))}
            </div>
          </>
        )}
      <h3 className="pd-h3">Notification ki pasand</h3>
      <NotifPrefsForm prefs={prefs} />
    </section>
  );
}
