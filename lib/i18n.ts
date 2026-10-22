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

// ================= Profile page ke baaki hisse (Step 6) =================
type PDict = {
  hdr: {
    admin: string; student: string; defaultName: string; streakPill: (n: string | number) => string;
    defaultBio: string; edit: string; lvl: (n: number) => string;
    tasks: string; streak: string; rank: string; points: string; photoAlt: string; verified: string;
  };
  qa: {
    title: string; fav: string; saved: (n: number) => string; books: string; offline: string; soon: string; offlineToast: string;
    more: string; courseToast: string;
    tasks: [string, string]; booksTile: [string, string]; tests: [string, string]; results: [string, string];
    courses: [string, string]; settings: [string, string]; admin: [string, string];
  };
  ov: {
    title: string; details: string; today: string; chipToday: (n: number) => string; chipStreak: string; done: (n: number) => string;
    streak: string; days: string; streak0: string; streak1: string; streak2: string;
    mock: string; startNow: string; notStarted: string; attempted: (n: number) => string;
    overall: string; chipWeek: (d: number) => string; o0: string; o1: string; o2: string; o3: string;
    note: string; noData: string;
  };
  cl: {
    title: string; emptyTitle: string; emptyText: string; openBooks: string;
    completed: string; inProgress: string; opened: string;
    today: string; yesterday: string; daysAgo: (n: number) => string; pages: (n: number) => string; pdf: string;
    resume: string; update: string; pageQ: string; totalPages: (n: number) => string; pagePh: string;
    pctQ: string; pctHint: string; save: string; saving: string; saved: string; err: string;
  };
  ml: { title: string; viewAll: string; empty: string; last30: string };
  cm: { title: string; sub: string; notSet: (n: string) => string };
};

export const P: Record<Lang, PDict> = {
  en: {
    hdr: {
      admin: "Admin", student: "Student", defaultName: "Student", streakPill: (n) => `${n} day streak`,
      defaultBio: "Big dreams need daily efforts.", edit: "Edit Profile", lvl: (n) => `LVL ${n}`,
      tasks: "TASKS", streak: "STREAK", rank: "RANK", points: "POINTS", photoAlt: "My profile photo", verified: "Email verified",
    },
    qa: {
      title: "QUICK ACCESS", fav: "Favorites", saved: (n) => `${n} saved`, books: "Saved Books", offline: "Offline", soon: "Coming soon",
      offlineToast: "Offline mode is coming soon", more: "More Sections: Tasks, Books, Tests, Courses ▾", courseToast: "Course link is not set yet",
      tasks: ["Daily Tasks", "Plan & Stay on Track"], booksTile: ["Books & PDFs", "Read & Download"], tests: ["Mock Tests", "Practice & Improve"],
      results: ["Results", "Your test scores"], courses: ["Courses", "Start Learning"], settings: ["Settings", "Manage Account"], admin: ["Admin Panel", "Manage content"],
    },
    ov: {
      title: "STUDY OVERVIEW", details: "See Details ›", today: "Today's Tasks", chipToday: (n) => `+${n} today`, chipStreak: "+1 today", done: (n) => `${n}% done`,
      streak: "Study Streak", days: " days", streak0: "Start today", streak1: "Keep going 🔥", streak2: "Awesome! 🔥",
      mock: "Mock Tests", startNow: "Start now", notStarted: "Not started", attempted: (n) => `${n} attempted`,
      overall: "Overall", chipWeek: (d) => `${d > 0 ? "+" : ""}${d}% week`, o0: "Get started", o1: "Just started", o2: "Keep going", o3: "Great pace",
      note: "Overall = tasks completed in the last 7 days, out of that period's total tasks. The “week” badge compares with the week before.",
      noData: "No Task page data found yet, open /tasks.",
    },
    cl: {
      title: "CONTINUE LEARNING", emptyTitle: "No book opened yet", emptyText: "Open any PDF from the Books page and it will show up here.", openBooks: "Open Books",
      completed: "COMPLETED", inProgress: "IN PROGRESS", opened: "OPENED",
      today: "Today", yesterday: "Yesterday", daysAgo: (n) => `${n} days ago`, pages: (n) => `${n} pages`, pdf: "PDF",
      resume: "Resume", update: "Update Progress", pageQ: "Which page are you on now?", totalPages: (n) => `(${n} pages in total)`, pagePh: "e.g. 45",
      pctQ: "How much have you read?", pctHint: "(0 to 100 %)", save: "Save", saving: "Saving...", saved: "Progress saved ✅", err: "Something went wrong",
    },
    ml: {
      title: "My Learning", viewAll: "View All", last30: "last 30 days",
      empty: "No subject-wise study record yet. Complete study or revision tasks and your top subjects will show up here (last 30 days).",
    },
    cm: { title: "Join Our Community", sub: "Get updates, motivation and study tips", notSet: (n) => `${n} link is not set yet` },
  },
  hi: {
    hdr: {
      admin: "एडमिन", student: "स्टूडेंट", defaultName: "स्टूडेंट", streakPill: (n) => `${n} दिन की स्ट्रीक`,
      defaultBio: "बड़े सपनों के लिए रोज़ मेहनत चाहिए।", edit: "प्रोफ़ाइल बदलो", lvl: (n) => `लेवल ${n}`,
      tasks: "टास्क", streak: "स्ट्रीक", rank: "रैंक", points: "पॉइंट्स", photoAlt: "मेरी प्रोफ़ाइल फ़ोटो", verified: "ईमेल सत्यापित",
    },
    qa: {
      title: "क्विक एक्सेस", fav: "पसंदीदा", saved: (n) => `${n} सेव`, books: "सेव की किताबें", offline: "ऑफ़लाइन", soon: "जल्द आ रहा है",
      offlineToast: "ऑफ़लाइन मोड जल्द आ रहा है", more: "और सेक्शन: टास्क, किताबें, टेस्ट, कोर्स ▾", courseToast: "कोर्स का लिंक अभी सेट नहीं है",
      tasks: ["रोज़ के टास्क", "प्लान बनाओ, ट्रैक पर रहो"], booksTile: ["किताबें और PDF", "पढ़ो और डाउनलोड करो"], tests: ["मॉक टेस्ट", "प्रैक्टिस करो, सुधार करो"],
      results: ["रिज़ल्ट", "टेस्ट के स्कोर"], courses: ["कोर्स", "सीखना शुरू करो"], settings: ["सेटिंग्स", "अकाउंट संभालो"], admin: ["एडमिन पैनल", "कंटेंट संभालो"],
    },
    ov: {
      title: "स्टडी ओवरव्यू", details: "पूरा देखो ›", today: "आज के टास्क", chipToday: (n) => `आज +${n}`, chipStreak: "आज +1", done: (n) => `${n}% पूरा`,
      streak: "स्टडी स्ट्रीक", days: " दिन", streak0: "आज शुरू करो", streak1: "लगे रहो 🔥", streak2: "शानदार! 🔥",
      mock: "मॉक टेस्ट", startNow: "अभी शुरू करो", notStarted: "शुरू नहीं हुआ", attempted: (n) => `${n} दिए`,
      overall: "ओवरऑल", chipWeek: (d) => `${d > 0 ? "+" : ""}${d}% हफ़्ता`, o0: "शुरू करो", o1: "अभी शुरुआत है", o2: "लगे रहो", o3: "बढ़िया रफ़्तार",
      note: "ओवरऑल = पिछले 7 दिनों में पूरे किए टास्क, उन दिनों के कुल टास्क में से। “हफ़्ता” बैज पिछले हफ़्ते से तुलना दिखाता है।",
      noData: "अभी टास्क पेज का डेटा नहीं मिला, /tasks खोलो।",
    },
    cl: {
      title: "पढ़ाई जारी रखो", emptyTitle: "अभी कोई किताब नहीं खोली", emptyText: "किताबें पेज से कोई PDF खोलो, वो यहाँ दिखेगी।", openBooks: "किताबें खोलो",
      completed: "पूरी हुई", inProgress: "जारी है", opened: "खोली गई",
      today: "आज", yesterday: "कल", daysAgo: (n) => `${n} दिन पहले`, pages: (n) => `${n} पेज`, pdf: "PDF",
      resume: "जारी रखो", update: "प्रोग्रेस बदलो", pageQ: "अभी किस पेज पर हो?", totalPages: (n) => `(कुल ${n} पेज)`, pagePh: "जैसे 45",
      pctQ: "कितना पढ़ लिया?", pctHint: "(0 से 100 %)", save: "सेव करो", saving: "सेव हो रहा है...", saved: "प्रोग्रेस सेव हो गई ✅", err: "कुछ गड़बड़ हुई",
    },
    ml: {
      title: "मेरी पढ़ाई", viewAll: "सब देखो", last30: "पिछले 30 दिन",
      empty: "अभी विषय-वार पढ़ाई का रिकॉर्ड नहीं है। स्टडी/रिवीज़न टास्क पूरे करते ही यहाँ तुम्हारे टॉप विषय दिखेंगे (पिछले 30 दिन)।",
    },
    cm: { title: "हमारी कम्युनिटी से जुड़ो", sub: "अपडेट, मोटिवेशन और पढ़ाई के टिप्स पाओ", notSet: (n) => `${n} का लिंक अभी सेट नहीं है` },
  },
};
