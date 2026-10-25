import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";
import AuthForm from "@/features/profile/AuthForm";

export const metadata: Metadata = { title: "Login" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  const notice =
    error === "confirm" ? (
      <p role="alert" className="au-msg au-msg-err">Link खोलने में दिक्कत आई। अगर Email का Link दबाया था तो Email शायद confirm हो चुका है, अब सीधे Login करके देखो। न चले तो Login की कोशिश करने पर Confirm Email दोबारा भेजो बटन दिखेगा।</p>
    ) : error === "expired" ? (
      <p role="alert" className="au-msg au-msg-err">Email का Link पुराना हो गया है। नया Link मँगाओ (Login करके या Password भूल गए पर)।</p>
    ) : null;
  return (
    <AuthShell mode="login" notice={notice}>
      <AuthForm mode="login" next={next} />
    </AuthShell>
  );
}
