import type { Task } from "./model";

// Roz ke 24 pehle se bane tasks (jab tak user ne apna list save nahi kiya).
export const DEFAULT_TASKS: Task[] = [
  {"id": 1, "start": 330, "end": 345, "timeLabel": "05:30 - 05:45", "title": "WAKE UP + FRESH", "titleHi": "Utho Fresh Ho Jao", "type": "rest", "duration": "15 min"},
  {"id": 2, "start": 345, "end": 390, "timeLabel": "05:45 - 06:30", "title": "PHYSICAL FITNESS", "titleHi": "Daud + Exercise", "type": "fitness", "duration": "45 min"},
  {"id": 3, "start": 390, "end": 420, "timeLabel": "06:30 - 07:00", "title": "BATH + BREAKFAST", "titleHi": "Nahaana + Nashta", "type": "break", "duration": "30 min"},
  {"id": 4, "start": 420, "end": 510, "timeLabel": "07:00 - 08:30", "title": "MATHS PRACTICE + PYQ", "titleHi": "Ganit Abhyas", "type": "study", "duration": "90 min"},
  {"id": 5, "start": 510, "end": 555, "timeLabel": "08:30 - 09:15", "title": "HINDI GRAMMAR", "titleHi": "Hindi Vyakaran", "type": "study", "duration": "45 min"},
  {"id": 6, "start": 555, "end": 570, "timeLabel": "09:15 - 09:30", "title": "BREAK", "titleHi": "Chai Break", "type": "break", "duration": "15 min"},
  {"id": 7, "start": 570, "end": 630, "timeLabel": "09:30 - 10:30", "title": "HINDI CLASS", "titleHi": "Hindi Class", "type": "study", "duration": "60 min"},
  {"id": 8, "start": 630, "end": 660, "timeLabel": "10:30 - 11:00", "title": "HINDI REVISION", "titleHi": "Hindi Dohraao", "type": "revision", "duration": "30 min"},
  {"id": 9, "start": 660, "end": 710, "timeLabel": "11:00 - 11:50", "title": "CURRENT AFFAIRS + GK", "titleHi": "Samanya Gyan", "type": "study", "duration": "50 min"},
  {"id": 10, "start": 720, "end": 780, "timeLabel": "12:00 - 01:00 PM", "title": "GS CLASS", "titleHi": "GS Class", "type": "study", "duration": "60 min"},
  {"id": 11, "start": 780, "end": 825, "timeLabel": "01:00 - 01:45", "title": "LUNCH + REST", "titleHi": "Khana + Aaram", "type": "break", "duration": "45 min"},
  {"id": 12, "start": 825, "end": 915, "timeLabel": "01:45 - 03:15", "title": "REASONING PRACTICE + PYQ", "titleHi": "Tark Shakti", "type": "study", "duration": "90 min"},
  {"id": 13, "start": 915, "end": 945, "timeLabel": "03:15 - 03:45", "title": "BREAK", "titleHi": "Break", "type": "break", "duration": "30 min"},
  {"id": 14, "start": 945, "end": 960, "timeLabel": "03:45 - 04:00", "title": "SCIENCE PRE-REVISION", "titleHi": "Vigyan Pre-Rev", "type": "revision", "duration": "15 min"},
  {"id": 15, "start": 960, "end": 1020, "timeLabel": "04:00 - 05:00", "title": "SCIENCE CLASS", "titleHi": "Vigyan Class", "type": "study", "duration": "60 min"},
  {"id": 16, "start": 1020, "end": 1050, "timeLabel": "05:00 - 05:30", "title": "SCIENCE REVISION", "titleHi": "Vigyan Dohraao", "type": "revision", "duration": "30 min"},
  {"id": 17, "start": 1050, "end": 1080, "timeLabel": "05:30 - 06:00", "title": "BREAK + SNACK", "titleHi": "Nashta Break", "type": "break", "duration": "30 min"},
  {"id": 18, "start": 1080, "end": 1140, "timeLabel": "06:00 - 07:00", "title": "REASONING CLASS", "titleHi": "Reasoning Class", "type": "study", "duration": "60 min"},
  {"id": 19, "start": 1140, "end": 1200, "timeLabel": "07:00 - 08:00", "title": "MATHS CLASS", "titleHi": "Maths Class", "type": "study", "duration": "60 min"},
  {"id": 20, "start": 1200, "end": 1240, "timeLabel": "08:00 - 08:40", "title": "DINNER + REST", "titleHi": "Raat ka Khana", "type": "break", "duration": "40 min"},
  {"id": 21, "start": 1240, "end": 1290, "timeLabel": "08:40 - 09:30", "title": "GS + CA REVISION", "titleHi": "GS + CA Dohraao", "type": "revision", "duration": "50 min"},
  {"id": 22, "start": 1290, "end": 1335, "timeLabel": "09:30 - 10:15", "title": "PYQ / MINI MOCK", "titleHi": "Test / PYQ", "type": "study", "duration": "45 min"},
  {"id": 23, "start": 1335, "end": 1350, "timeLabel": "10:15 - 10:30", "title": "WRONG Q + NEXT DAY PLAN", "titleHi": "Galti Sudharo", "type": "revision", "duration": "15 min"},
  {"id": 24, "start": 1350, "end": 1440, "timeLabel": "10:30 PM", "title": "SLEEP", "titleHi": "So Jao - Kal Jeetna Hai", "type": "rest", "duration": "7 hr"},
];

// Upar wali "Motivation" patti ki lines (4 second me badalti hain).
export const MOTIVATION: string[] = [
  "Padhega toh Vardi Pehnega",
  "Har ghanta tumhe Vardi ke kareeb le ja raha hai",
  "SSC GD = Desh Seva",
  "Vardi sirf kapda nahi, zimmedari hai",
  "Aaj ki mehnat, kal ka salute",
  "Thak gaye? Yaad karo kyun shuru kiya tha",
  "1% roz, 365% saal bhar",
];
