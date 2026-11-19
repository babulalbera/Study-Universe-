"use client";
import { useEffect } from "react";
import Link from "next/link";

// Admin me koi Page toot jaye ya Save ke dauran galti aaye to saaf sandesh + "dobara try karo"
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[admin]", error);
  }, [error]);
  return (
    <div className="glass" style={{ padding: 18, display: "grid", gap: 10 }}>
      <h2 style={{ margin: 0 }}>⚠️ कुछ गड़बड़ हो गई</h2>
      <p style={{ margin: 0 }}>ये Page खुल नहीं पाया, या आपका काम Save नहीं हुआ। “दोबारा try करो” दबाओ। बार-बार आए तो नीचे का Code भेज दो।</p>
      {error.digest ? <code style={{ fontSize: 12, opacity: 0.8 }}>Code: {error.digest}</code> : null}
      <div className="su-row">
        <button type="button" className="pbtn pbtn-gold" onClick={reset}>🔄 दोबारा try करो</button>
        <Link href="/admin" className="su-btn">← Admin Home</Link>
      </div>
    </div>
  );
}
