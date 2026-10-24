"use client";
import { useToast } from "@/components/ui/Toast";

// Book ka Link share karo (phone ka Share menu), na chale to Link copy ho jata hai.
export default function ShareButton({ id, title }: { id: string; title: string }) {
  const toast = useToast();

  async function share() {
    const url = `${window.location.origin}/books/${id}/read`;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast("Link copy ho gaya ✓");
    } catch (e) {
      if ((e as Error).name === "AbortError") return; // user ne khud band kiya
      toast("Share nahi ho paya");
    }
  }

  return (
    <button type="button" className="su-btn su-btn-ghost bk-btn" onClick={share}>
      ↗ Share
    </button>
  );
}
