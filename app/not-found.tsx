import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";

export default function NotFound() {
  return <EmptyState icon="🧭" title="Page nahi mila (404)" text="Ye address galat hai ya page hata diya gaya hai."
    action={<Button href="/">Home par jao</Button>} />;
}
