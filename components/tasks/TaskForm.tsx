"use client";
import { useState, type FormEvent } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { PRIORITIES, TYPES, emptyForm, formFromTask, validateForm, type Task, type TaskForm as Form } from "@/features/tasks/model";

type Props = { task: Task | null; focus?: "title" | "reminder"; onClose: () => void; onSave: (f: Form, base: Task | null) => void };

// Add / Edit Task ka popup (site ka apna Modal aur Input). Jab bhi khule, naye sire se shuru hota hai (parent isse naye key se dikhata hai).
export default function TaskForm({ task, focus = "title", onClose, onSave }: Props) {
  const [f, setF] = useState<Form>(() => (task ? formFromTask(task) : emptyForm()));
  const [plain, setPlain] = useState(!(task && task.color));
  const [err, setErr] = useState("");
  const set = (k: keyof Form) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const clean: Form = { ...f, color: plain ? "" : f.color || "#10b981" };
    const m = validateForm(clean);
    if (m) { setErr(m); return; }
    if (clean.reminder && typeof Notification !== "undefined" && Notification.permission === "default") {
      try { void Notification.requestPermission(); } catch { /* ignore */ }
    }
    onSave(clean, task);
  };

  return (
    <Modal open title={task ? "✏️ Edit Task" : "➕ Add Task"} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <div className="grid max-h-[62vh] gap-3 overflow-y-auto pr-1">
          <Input label="Task Name *" name="title" maxLength={60} value={f.title} onChange={set("title")} autoFocus={focus === "title"} />
          <Input label="Subject / Category" name="subject" maxLength={40} value={f.subject} onChange={set("subject")} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Start Time" name="startTime" type="time" value={f.startTime} onChange={set("startTime")} />
            <Input label="End Time" name="endTime" type="time" value={f.endTime} onChange={set("endTime")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date (khali = roz)" name="date" type="date" value={f.date} onChange={set("date")} />
            <Input label="Reminder" name="reminder" type="time" value={f.reminder} onChange={set("reminder")} autoFocus={focus === "reminder"} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="su-field"><span>Priority</span>
              <select value={f.priority} onChange={set("priority")}>{PRIORITIES.map((p) => <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>)}</select>
            </label>
            <label className="su-field"><span>Type</span>
              <select value={f.type} onChange={set("type")}>{TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
            </label>
          </div>
          <div className="grid gap-2">
            <Input label="Color" name="color" type="color" value={f.color || "#10b981"} onChange={set("color")} disabled={plain} />
            <label className="flex items-center gap-2 text-[13px] font-semibold text-zinc-300">
              <input type="checkbox" checked={plain} onChange={(e) => setPlain(e.target.checked)} className="h-4 w-4 accent-[var(--gold2)]" /> Default color
            </label>
          </div>
          <label className="su-field"><span>Description / Note</span>
            <textarea rows={3} maxLength={300} value={f.description} onChange={set("description")} />
          </label>
        </div>
        <p role="alert" className="mt-2 min-h-[18px] text-[12px] text-red-300">{err}</p>
        <div className="su-row">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Modal>
  );
}
