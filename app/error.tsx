"use client";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <EmptyState icon="⚠️" title="Kuch galat ho gaya" text="Dobara koshish karo."
    action={<Button onClick={reset}>Dobara try karo</Button>} />;
}
