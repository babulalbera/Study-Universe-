export const EXAMS = ["SSC CGL", "SSC CHSL", "SSC GD", "SSC MTS", "Army", "Railway", "Banking", "Police", "Anya"] as const;
export const SUBJECTS = ["Maths", "English", "Hindi", "Reasoning", "GS", "Science"] as const;
export const PERIODS = { daily: "Roz", weekly: "Hafta", monthly: "Mahina" } as const;
export const METRICS = { tasks: "Tasks", minutes: "Study minute" } as const;
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
