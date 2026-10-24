// Theme ke 8 rang-variables (globals.css me wahi naam). Do rang (main + dusra) se baaki 6 rang banate hain,
// taaki user apni marzi ka rang chun sake aur poori site (glow, border, buttons, background) usi ka dikhe.
export const VAR_KEYS = ["--gold", "--gold2", "--gold3", "--gold4", "--em", "--mint", "--bg", "--surf"] as const;
export type Vars = Record<(typeof VAR_KEYS)[number], string>;

export const isHex = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v);

const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  let h = 0, s = 0;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) h = ((g - b) / d) % 6; else if (max === g) h = (b - r) / d + 2; else h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  return [h, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360; s = clamp(s, 0, 1); l = clamp(l, 0, 1);
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  const to = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
}

export function derive(primary: string, secondary: string): Vars {
  const [h1, s1, l1] = hexToHsl(primary);
  const [h2, s2, l2] = hexToHsl(secondary);
  // Bahut gehra rang chuna to padhne me dikkat hogi: thoda halka kar do
  const p = clamp(l1, 0.5, 0.88), q = clamp(l2, 0.45, 0.85);
  let dh = h2 - h1; if (dh > 180) dh -= 360; if (dh < -180) dh += 360;
  return {
    "--gold": hslToHex(h1, s1, p),
    "--gold2": hslToHex(h1, s1, clamp(p + 0.12, 0, 0.86)),
    "--gold3": hslToHex(h1, Math.min(s1, 0.9), 0.82),
    "--gold4": hslToHex(h1 + dh * 0.25, Math.max(s1, 0.6), 0.55),
    "--em": hslToHex(h2, s2, q),
    "--mint": hslToHex(h2, Math.min(s2, 0.85), 0.86),
    "--bg": hslToHex(h1, Math.min(Math.max(s1, 0.3), 0.6), 0.018),
    "--surf": hslToHex(h1, Math.min(Math.max(s1, 0.25), 0.45), 0.075),
  };
}
