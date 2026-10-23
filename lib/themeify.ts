// Task page ek alag (standalone) HTML hai: uske pakke rang (#D4AF37, rgba(16,185,129,.2) ...) ko
// theme variables (var(--gold) ...) mein badalta hai, taaki ThemeDock ka rang yahan bhi chale.
// Sirf CSS jaisi jagah badalta hai (":" "," "(" ke baad). Quote ke andar wale data-colours
// (jaise task ka chuna hua rang ["#10b981", ...]) aur Tailwind ke \#D4AF37 jaise selectors ko chhodta hai.

const HEX: Record<string, string> = {
  d4af37: "var(--gold)", ffd700: "var(--gold2)", facc15: "var(--gold2)", fbbf24: "var(--gold2)",
  ffe082: "var(--gold3)", ffeaa7: "var(--gold3)", fde68a: "var(--gold3)", fef9c3: "var(--gold3)",
  e8b84a: "var(--gold4)", ffa726: "var(--gold4)", ff6b00: "var(--gold4)", fb923c: "var(--gold4)",
  "10b981": "var(--em)", "34d399": "var(--em)", "059669": "var(--em)",
  "065f46": "color-mix(in srgb,var(--em) 55%,#000)",
  "6ee7b7": "var(--mint)", a7f3d0: "var(--mint)",
  "020603": "var(--bg)", "050805": "var(--bg)", "030805": "var(--bg)", "060a07": "var(--bg)", "04120a": "var(--bg)",
  "0a120b": "var(--surf)", "0a1710": "var(--surf)", "0b1a10": "var(--surf)", "0e2216": "var(--surf)",
  "0f1f14": "var(--surf)", "0a110c": "var(--surf)", "121a14": "var(--surf)", "0f2418": "var(--surf)",
};

const RGB: Record<string, string> = {
  "212,175,55": "--gold", "255,215,0": "--gold2", "250,204,21": "--gold2", "251,191,36": "--gold2", "252,211,77": "--gold2",
  "245,158,11": "--gold2", "253,230,138": "--gold3", "255,224,130": "--gold3",
  "255,107,0": "--gold4", "251,146,60": "--gold4", "253,186,116": "--gold4", "249,115,22": "--gold4",
  "16,185,129": "--em", "52,211,153": "--em", "110,231,183": "--mint", "167,243,208": "--mint",
  "2,6,3": "--bg", "5,8,5": "--bg", "6,10,7": "--bg", "3,8,5": "--bg", "5,8,6": "--bg", "2,8,4": "--bg",
  "255,234,167": "--gold3", "254,243,199": "--gold3", "254,215,170": "--gold3", "255,225,120": "--gold3", "209,250,229": "--mint",
  "10,18,11": "--surf", "10,23,16": "--surf", "10,22,12": "--surf", "10,31,18": "--surf", "18,28,19": "--surf", "20,31,22": "--surf",
  "11,20,12": "--surf", "14,30,20": "--surf", "15,31,20": "--surf", "18,26,20": "--surf", "15,36,24": "--surf", "7,11,7": "--bg",
  "7,15,8": "--bg", "10,26,15": "--surf", "13,40,24": "--surf", "20,28,22": "--surf", "12,18,14": "--surf", "2,44,34": "--surf",
};

const mix = (v: string, pct: string) => `color-mix(in srgb,var(${v}) ${pct},transparent)`;
const pctOf = (a: string | undefined) => {
  if (a === undefined || a === "") return "100%";
  if (a.endsWith("%")) return a;
  const n = parseFloat(a);
  return `${Math.round(n * 1000) / 10}%`;
};

export function themeify(src: string): string {
  let out = src;
  // 1) #rrggbb  (aage-peeche quote / backslash ho to chhod do)
  out = out.replace(/(?<=[:,(\s])#([0-9a-fA-F]{6})(?![0-9a-zA-Z])/g, (m, h: string) => HEX[h.toLowerCase()] ?? m);
  // 2) rgba(r,g,b,a)  /  rgb(r,g,b)
  out = out.replace(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+%?)\s*)?\)/g, (m, r: string, g: string, b: string, a?: string) => {
    const v = RGB[`${r},${g},${b}`];
    return v ? mix(v, pctOf(a)) : m;
  });
  // 3) Tailwind: rgb(212 175 55 / var(--tw-bg-opacity,1))  ya  rgb(16 185 129 / .5)
  out = out.replace(/rgb\(\s*(\d+)\s+(\d+)\s+(\d+)\s*(?:\/\s*(var\([^)]*\)|[\d.]+%?)\s*)?\)/g, (m, r: string, g: string, b: string, a?: string) => {
    const v = RGB[`${r},${g},${b}`];
    if (!v) return m;
    if (a && a.startsWith("var(")) return mix(v, `calc(${a}*100%)`);
    return mix(v, pctOf(a));
  });
  return out;
}
