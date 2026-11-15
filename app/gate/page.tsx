import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getGateStatus } from "@/features/gate/queries";
import GateClient from "./GateClient";
import "@/features/profile/dashboard/profile-redesign.css";

export const metadata: Metadata = { title: "Account Verify Karo", robots: { index: false, follow: false } };

export default async function GatePage() {
  const user = await getUser();
  if (!user) redirect("/login?next=/gate");

  const status = await getGateStatus(user.id);
  if (!status) redirect("/login?next=/gate");
  if (status.unlocked) redirect("/");

  return (
    <div className="pd">
      <GateClient
        telegramLinked={status.telegramLinked}
        channelMember={status.channelMember}
        referralCount={status.referralCount}
        referralQuota={status.referralQuota}
        referralCode={status.referralCode}
        linkCode={status.linkCode}
      />
    </div>
  );
}
