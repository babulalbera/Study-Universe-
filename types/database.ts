// Haath se likhe Row types. Baad mein chaho to: npx supabase gen types typescript --project-id <id> > types/database.ts
export type Role = "student" | "admin";

export type Profile = { id: string; full_name: string; avatar_url: string | null; role: Role; created_at: string; updated_at: string };
export type Task = { id: string; title: string; subject: string; note: string; due_date: string | null; sort_order: number; is_active: boolean };
export type TaskCompletion = { user_id: string; task_id: string; completed_at: string };
export type BookCategory = { id: string; name: string; sort_order: number };
export type Book = { id: string; category_id: string | null; title: string; author: string; description: string; storage_path: string | null; pages: number | null; is_published: boolean };
export type MockTest = { id: string; category_id: string | null; title: string; description: string; duration_minutes: number; total_marks: number; is_published: boolean };
// correct_index sirf server/admin ke liye; student wale code mein ye type kabhi mat bhejo.
export type Question = { id: string; test_id: string; question_text: string; options: string[]; correct_index: number; marks: number; negative_marks: number; explanation: string; sort_order: number };
export type TestAttempt = { id: string; user_id: string; test_id: string; status: "in_progress" | "submitted"; score: number | null; started_at: string; submitted_at: string | null };
export type Announcement = { id: string; title: string; body: string; is_active: boolean; starts_at: string | null; ends_at: string | null };
