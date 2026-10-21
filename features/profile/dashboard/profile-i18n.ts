export type Lang = "hi" | "en";

const D = {
  title: { en: "SETTINGS & MORE", hi: "सेटिंग्स और अन्य" },
  fav: { en: "My Favorites", hi: "मेरी पसंद" },
  favSub: { en: "{n} items saved", hi: "{n} आइटम सेव" },
  look: { en: "Appearance", hi: "रूप-रंग" },
  lookSub: { en: "Dark • Gold-Emerald", hi: "डार्क • गोल्ड-एमरल्ड" },
  lookToast: { en: "Only one theme for now (Dark Gold-Emerald)", hi: "अभी एक ही थीम है (डार्क गोल्ड-एमरल्ड)" },
  notif: { en: "Notifications", hi: "सूचनाएँ" },
  notifOn: { en: "ON • New content alerts", hi: "चालू • नई सामग्री की सूचना" },
  notifOff: { en: "OFF • No alerts", hi: "बंद • कोई सूचना नहीं" },
  lang: { en: "Language", hi: "भाषा" },
  langSub: { en: "English • हिन्दी", hi: "हिन्दी • English" },
  langPick: { en: "Choose language", hi: "भाषा चुनो" },
  langSaved: { en: "Language saved ✓", hi: "भाषा सेव हो गई ✓" },
  priv: { en: "Privacy & Security", hi: "प्राइवेसी और सुरक्षा" },
  privSub: { en: "Password, email, data", hi: "पासवर्ड, ईमेल, डेटा" },
  help: { en: "Help & Support", hi: "मदद और सहायता" },
  helpSub: { en: "FAQs • Report a problem", hi: "सवाल-जवाब • समस्या बताओ" },
  about: { en: "About App", hi: "ऐप के बारे में" },
  aboutSub: { en: "Study Universe • v1.0", hi: "Study Universe • v1.0" },
  out: { en: "Log Out", hi: "लॉग आउट" },
  outSub: { en: "See you soon • Radhe Radhe", hi: "फिर मिलेंगे • राधे राधे" },
  footA: { en: "Study. Grow. Win. • Jai Shri Krishna", hi: "पढ़ो. बढ़ो. जीतो. • जय श्री कृष्ण" },
  footB: { en: "Study Universe • Gold Edition", hi: "Study Universe • गोल्ड एडिशन" },
  err: { en: "Something went wrong", hi: "कुछ गड़बड़ हो गई" },
} as const;

export type Key = keyof typeof D;

export function t(lang: Lang, key: Key, vars?: Record<string, string | number>): string {
  let s: string = D[key][lang];
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
}
