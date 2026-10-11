// DHYAN: sahi uttar (correct answer) yahan kabhi nahi aata. Scoring sirf database function mein hoti hai.
export type PublicQuestion = { id: string; question_text: string; options: string[]; marks: number; sort_order: number };
export type TestListItem = { id: string; title: string; description: string; duration_minutes: number; total_marks: number; category: string | null };
