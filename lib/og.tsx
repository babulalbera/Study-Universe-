import { ImageResponse } from "next/og";

// Link share karne par (WhatsApp, Facebook, Telegram, Twitter) jo badi photo dikhti hai, wo yahan bani hai.
// Sirf English akshar: ImageResponse ka default font Hindi nahi dikhata.
export function renderOg(size: { width: number; height: number }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center",
          padding: 80, color: "#ffffff", fontFamily: "sans-serif",
          background: "linear-gradient(135deg, #020603 0%, #06231a 55%, #0b3d2e 100%)",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, letterSpacing: 6, color: "#f5c451" }}>PREMIUM STUDY PLATFORM</div>
        <div style={{ display: "flex", fontSize: 108, fontWeight: 700, marginTop: 18 }}>Study Universe</div>
        <div style={{ display: "flex", fontSize: 44, marginTop: 10, color: "#a7f3d0" }}>Learn • Grow • Achieve</div>
        <div style={{ display: "flex", fontSize: 34, marginTop: 56, color: "#d1d5db" }}>
          SSC CGL • Free Mock Tests • Books & PDFs • Video Courses
        </div>
      </div>
    ),
    { ...size },
  );
}
