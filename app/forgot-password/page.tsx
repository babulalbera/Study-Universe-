import type { Metadata } from "next";
import AuthCard from "@/components/auth/AuthCard";

export const metadata: Metadata = { title: "Password bhool gaye" };

// Wahi premium card, seedha "Password भूल गए?" wale hisse se (Email par 6 ank ka code)
export default function ForgotPasswordPage() {
  return <AuthCard initial="forgot" />;
}
