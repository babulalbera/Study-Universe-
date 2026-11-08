import type { Metadata } from "next";
import AuthCard from "@/components/auth/AuthCard";

export const metadata: Metadata = { title: "Signup", robots: { index: false, follow: true } };

export default function SignupPage() {
  return <AuthCard initial="signup" />;
}
