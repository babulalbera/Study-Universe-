// Hindi / English: abhi Profile ki "Settings & More" list par lagu. Baaki pages baad me jodenge.
export type Lang = "en" | "hi";
export const isLang = (x: unknown): x is Lang => x === "en" || x === "hi";

type Dict = {
  title: string;
  fav: string; favSub: (n: number) => string;
  appearance: string; appearanceSub: string; appearanceNote: string;
  notif: string; notifOn: string; notifOff: string; notifErr: string;
  language: string; languageSub: string; langSaved: string;
  privacy: string; privacySub: string;
  help: string; helpSub: string;
  about: string; aboutSub: string; aboutInfo: string;
  logout: string; logoutSub: string;
  footer: string; footerSub: string;
};

export const T: Record<Lang, Dict> = {
  en: {
    title: "SETTINGS & MORE",
    fav: "My Favorites", favSub: (n) => `${n} items • Books & Tests`,
    appearance: "Appearance", appearanceSub: "Dark • Gold-Emerald", appearanceNote: "Only the Dark theme is available for now",
    notif: "Notifications", notifOn: "ON • New content alerts", notifOff: "OFF", notifErr: "Could not save, try again",
    language: "Language", languageSub: "English + हिन्दी", langSaved: "Language saved ✓",
    privacy: "Privacy & Security", privacySub: "Password • Email • My Data",
    help: "Help & Support", helpSub: "FAQs • Report a problem",
    about: "About App", aboutSub: "Study Universe", aboutInfo: "Study Universe: daily tasks, books, mock tests and progress in one place. Your data is visible only to you.",
    logout: "Log Out", logoutSub: "See you soon • Radhe Radhe",
    footer: "Best banao, roz jeeto • Jai Shri Krishna", footerSub: "Study Universe",
  },
  hi: {
    title: "सेटिंग्स और भी",
    fav: "मेरी पसंद", favSub: (n) => `${n} आइटम • किताबें और टेस्ट`,
    appearance: "दिखावट", appearanceSub: "डार्क • गोल्ड-एमराल्ड", appearanceNote: "अभी सिर्फ़ डार्क थीम उपलब्ध है",
    notif: "सूचनाएँ", notifOn: "चालू • नए कंटेंट की सूचना", notifOff: "बंद", notifErr: "सेव नहीं हुआ, फिर कोशिश करो",
    language: "भाषा", languageSub: "English + हिन्दी", langSaved: "भाषा सेव हो गई ✓",
    privacy: "प्राइवेसी और सुरक्षा", privacySub: "पासवर्ड • ईमेल • मेरा डेटा",
    help: "मदद और सपोर्ट", helpSub: "सवाल-जवाब • समस्या बताएँ",
    about: "ऐप के बारे में", aboutSub: "Study Universe", aboutInfo: "Study Universe: रोज़ के टास्क, किताबें, मॉक टेस्ट और प्रगति एक जगह। तुम्हारा डेटा सिर्फ़ तुम्हें दिखता है।",
    logout: "लॉग आउट", logoutSub: "फिर मिलेंगे • राधे राधे",
    footer: "बेस्ट बनो, रोज़ जीतो • जय श्री कृष्ण", footerSub: "Study Universe",
  },
};
