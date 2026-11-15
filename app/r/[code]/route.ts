import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Link format: https://tumhari-site.com/r/ABC123
// Cookie 30 din tak rehta hai; Profile page pe login/signup ke baad ek hi baar "claim" hota hai.
export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const url = new URL("/signup", req.url);
  const res = NextResponse.redirect(url);
  res.cookies.set("su_ref", code, { maxAge: 60 * 60 * 24 * 30, path: "/" });
  return res;
}
