import type { Metadata } from "next";
import AuthCard from "@/components/auth/AuthCard";

export const metadata: Metadata = { title: "Login" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  const notice =
    error === "confirm"
      ? "Link खोलने में दिक्कत आई। अगर Email का Link दबाया था तो Email शायद confirm हो चुका है, अब सीधे Login करके देखो। न चले तो Login की कोशिश करने पर Confirm Email दोबारा भेजो बटन दिखेगा।"
      : error === "expired"
        ? "Email का Link पुराना हो गया है। नया Link मँगाओ (Login करके या Password भूल गए पर)।"
        : error === "oauth"
          ? "Google/Social login पूरा नहीं हुआ (शायद आपने cancel किया)। दोबारा try करो या Email से Login करो।"
          : undefined;
  const gate = !notice && !!next; // kisi feature se redirect hokar aaya
  return <AuthCard initial="login" next={next} notice={notice ?? (gate ? "Ye feature use karne ke liye pehle Login ya Signup karo. Login ke baad seedha wapas yahin aaoge." : undefined)} gate={gate} />;
}
