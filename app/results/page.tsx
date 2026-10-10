import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import Sidebar from "@/components/layout/Sidebar";

export const metadata: Metadata = { title: "Results & Progress" };

export default function ResultsPage() {
  return (
    <>
      <PageHeader title="📊 Results & Progress" subtitle="अपने Test के Score और तरक्की देखो।" />
      <div className="adm" style={{ marginTop: 0 }}>
        <Sidebar />
        <EmptyState
          icon="📈"
          title="अभी कोई Result नहीं है"
          text="पहला Mock Test दो, फिर Score और Progress यहाँ दिखेगी।"
          action={<Button href="/mock-tests">Test शुरू करें</Button>}
        />
      </div>
    </>
  );
}
