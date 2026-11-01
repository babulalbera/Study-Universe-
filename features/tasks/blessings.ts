// Task complete karne par dikhne wale Krishna popup ki lines.
// Har baar alag motivation line, alag support line aur alag shloka dikhta hai.
export type Blessing = { text: string; highlights: string[] };
export type Sloka = { sa: string; hi: string };

export const BLESSINGS: Blessing[] = [
  { text: "Bade sapne dekhna band mat karo, kyuki sapne hi zindagi ko disha dete hain.", highlights: ["sapne", "zindagi", "disha"] },
  { text: "Koshish karne walo ki kabhi haar nahi hoti, mehnat rang layegi.", highlights: ["Koshish", "haar", "mehnat"] },
  { text: "Aaj ki mehnat kal ka salute banegi, Vardi tumhara intezaar kar rahi hai.", highlights: ["mehnat", "salute", "Vardi"] },
  { text: "Har subah ek naya mauka hai, apne sapno ke aur kareeb jane ka.", highlights: ["subah", "mauka", "sapno"] },
  { text: "Thakan toh lamha hai, Vardi umar bhar ka garv hai.", highlights: ["Thakan", "Vardi", "garv"] },
  { text: "Focus rakh, Kanha ka ashirwad tere saath hai, jeet pakki hai.", highlights: ["Focus", "ashirwad", "jeet"] },
  { text: "Padhoge toh Vardi pehnoge, yahi sach hai, yahi lakshya hai.", highlights: ["Padhoge", "Vardi", "lakshya"] },
  { text: "Ek ek task tumhe selection ke aur kareeb le ja raha hai.", highlights: ["task", "selection", "kareeb"] },
  { text: "Karm karo, fal ki chinta mat karo, Gita ka sandesh yaad rakho.", highlights: ["Karm", "fal", "Gita"] },
  { text: "Himmat mat haaro, Krishna tumhare saath khade hain har kadam par.", highlights: ["Himmat", "Krishna", "kadam"] },
  { text: "SSC GD ka sapna sach hoga, bas lage raho, rukna mana hai.", highlights: ["sapna", "sach", "lage raho"] },
  { text: "1% roz behtar, 365% saal bhar, choti jeet badi Vardi tak le jayegi.", highlights: ["1%", "jeet", "Vardi"] },
  { text: "Aaj ka ek task, kal ki badi kamyabi ki neev hai.", highlights: ["task", "kamyabi", "neev"] },
  { text: "Roz thoda padho, ek din SSC ka result khud bolega.", highlights: ["padho", "SSC", "result"] },
  { text: "Discipline hi woh pul hai jo sapne ko manzil se jodta hai.", highlights: ["Discipline", "sapne", "manzil"] },
  { text: "Jo aaj pasina bahata hai, kal wahi sitara banta hai.", highlights: ["pasina", "sitara"] },
  { text: "Girke bhi jo uth jaye, wahi asli vijeta hai.", highlights: ["uth", "vijeta", "Girke"] },
  { text: "Waqt kimti hai, har ghanta tumhe Vardi ke kareeb le jata hai.", highlights: ["Waqt", "Vardi", "kareeb"] },
  { text: "Aaj ka sahi decision kal ki sabse badi jeet banega.", highlights: ["decision", "jeet"] },
  { text: "Chhoti chhoti aadat, badi badi safalta banati hai.", highlights: ["aadat", "safalta"] },
  { text: "Dhairya rakho, Kanha sab dekh rahe hain, mehnat bekar nahi jayegi.", highlights: ["Dhairya", "Kanha", "mehnat"] },
  { text: "Tumhari tayyari tumhari takat hai, bas rukna mat.", highlights: ["tayyari", "takat", "rukna"] },
  { text: "Galtiyon se seekho, asli exam me wahi tumhari sabse badi taakat hogi.", highlights: ["Galtiyon", "seekho", "taakat"] },
  { text: "Jahan chaah hoti hai, wahan raah apne aap ban jati hai.", highlights: ["chaah", "raah"] },
  { text: "Aaj ka focus hi kal ka selection hai.", highlights: ["focus", "selection"] },
  { text: "Mann laga ke padho, Gita kehti hai karm hi pooja hai.", highlights: ["Gita", "karm", "pooja"] },
  { text: "Pehla kadam uthaya hai, ab manzil door nahi.", highlights: ["kadam", "manzil"] },
  { text: "Sapne wahi sach hote hain jinke liye tum jaag kar mehnat karte ho.", highlights: ["Sapne", "sach", "mehnat"] },
  { text: "Kanha tumhare saath hain, tum bas apna best do.", highlights: ["Kanha", "best"] },
  { text: "Vardi ka josh ek din zaroor rang layega, lage raho.", highlights: ["Vardi", "josh", "rang"] },
];

// Quote ke neeche wali chhoti line (har baar alag)
export const SUB_LINES: string[] = [
  "Kanha ka ashirwad tumhare saath hai • Vardi ke 1 kadam aur kareeb",
  "Shabash yoddha! Ek aur task jeet liya • Roz yahi josh rakhna",
  "Streak badhti ja rahi hai • Kal bhi isi tarah dhamaka karna",
  "Tumne apna wada nibhaya • Ab agla task bhi pakka",
  "Mehnat kabhi bekar nahi jati • Kanha sab dekh rahe hain",
  "Ek task = ek kadam selection ki taraf • Aage badho",
  "Aaj ka din tumhara hai • Aise hi lage raho, Vardi pakki",
  "Sabr aur mehnat ka phal meetha hota hai • Jai Hind!",
];

// Sanskrit shloka + uska Hindi matlab (har baar alag)
export const SLOKAS: Sloka[] = [
  { sa: "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन", hi: "तेरा अधिकार सिर्फ कर्म पर है, फल पर कभी नहीं।" },
  { sa: "उद्धरेदात्मनात्मानं नात्मानमवसादयेत्", hi: "खुद ही खुद का उद्धार करो, खुद को गिराओ मत।" },
  { sa: "योगः कर्मसु कौशलम्", hi: "कर्म को कुशलता से करना ही योग है।" },
  { sa: "उद्यमेन हि सिध्यन्ति कार्याणि न मनोरथैः", hi: "काम मेहनत से पूरे होते हैं, सिर्फ इच्छा से नहीं।" },
  { sa: "उत्तिष्ठत जाग्रत प्राप्य वरान्निबोधत", hi: "उठो, जागो और लक्ष्य पाने तक रुको मत।" },
  { sa: "वीरभोग्या वसुन्धरा", hi: "यह धरती वीरों के लिए है।" },
  { sa: "सत्यमेव जयते", hi: "अंत में जीत सत्य की ही होती है।" },
  { sa: "समत्वं योग उच्यते", hi: "सफलता-असफलता में एक समान रहना ही योग है।" },
];

// In shabdon par bhi golden rang chadhta hai
export const GOLD_WORDS = ["sapne", "zindagi", "disha", "sapno", "mehnat", "vardi", "jeet", "karm", "krishna", "focus", "lakshya", "salute", "garv", "ashirwad", "himmat", "kadam", "selection", "sach", "mauka", "subah"];
