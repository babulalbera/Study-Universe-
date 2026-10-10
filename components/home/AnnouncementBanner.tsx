export type Announcement = { id: string; text: string };

export default function AnnouncementBanner({ items }: { items: Announcement[] }) {
  if (items.length === 0) return null;
  return (
    <section className="glass su-notice rv" aria-label="Announcements">
      <span aria-hidden="true">📢</span>
      <div>{items.map((a) => <p key={a.id}>{a.text}</p>)}</div>
    </section>
  );
}
