import { renderOg } from "@/lib/og";

export const alt = "Study Universe – SSC CGL Free Mock Test, Books & Courses";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function TwitterImage() {
  return renderOg(size);
}
