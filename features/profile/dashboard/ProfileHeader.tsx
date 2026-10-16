import Link from "next/link";
import { Icon } from "./icons";
import type { FullProfile } from "./queries";

// Simple Profile card. Photo, naam, mobile, lakshya sab ⚙️ Settings ke andar badalte hain.
export default function ProfileHeader({ p }: { p: FullProfile }) {
  return (
    <section id="profile" className="ov-sec ov-hero">
      <div className="ov-hrow">
        <div className="ov-avbox">
          {p.avatarUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img className="ov-av" src={p.avatarUrl} alt="Meri profile photo" />
            : <div className="ov-av ov-av-ph" aria-hidden="true">{(p.fullName || "S").charAt(0).toUpperCase()}</div>}
          <Link href="/profile/settings" className="ov-cam" aria-label={p.hasAvatar ? "Photo badlo" : "Photo lagao"}><Icon name="camera" size={16} /></Link>
        </div>
        <div className="ov-who">
          <h1>{p.fullName || "Student"}</h1>
          <span className="ov-pill"><Icon name="user" size={15} /> {p.role === "admin" ? "Admin" : "Student"}</span>
          <p className="ov-quote">“Big dreams need daily efforts.”</p>
          <p className="ov-plan"><Icon name="crown" size={18} /> Free Member</p>
        </div>
        <Link href="/profile/settings" className="ov-gear" aria-label="Settings kholo" title="Settings"><Icon name="gear" size={24} /></Link>
      </div>
    </section>
  );
}
