// Task complete karne par dikhne wale Krishna popup ki 12 lines (golden rang wale shabd "highlights" se bante hain).
export type Blessing = { text: string; highlights: string[] };

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
];

// In shabdon par bhi golden rang chadhta hai
export const GOLD_WORDS = ["sapne", "zindagi", "disha", "sapno", "mehnat", "vardi", "jeet", "karm", "krishna", "focus", "lakshya", "salute", "garv", "ashirwad", "himmat", "kadam", "selection", "sach", "mauka", "subah"];
