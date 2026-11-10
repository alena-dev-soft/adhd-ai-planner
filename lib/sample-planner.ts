// Static sample data for the phase-3 layout (replaced by Supabase data when wired).
import type { Feasibility } from "@/components/TaskRow";

export type WeekTaskView = { slot: number; title: string; isDone: boolean };

export type DayTaskView = {
  slot: number;
  title: string;
  targetPomodoros: number | null;
  completedPomodoros: number;
  isDone: boolean;
  feasibility: Feasibility | null;
  feasibilityNote: string | null;
};

const weekTitles = [
  "Fix ABC system database migration",
  "Complete CPC code review and documentation",
  "Deploy tariff system to production",
  "",
  "",
  "Team sync with Kevin and Peter",
  "Update project documentation",
  "Code cleanup and refactoring",
  "",
  "",
  "Check emails and Slack",
  "",
];

export const sampleWeekTasks: WeekTaskView[] = weekTitles.map((title, i) => ({
  slot: i + 1,
  title,
  isDone: i === 0,
}));

export const sampleDayTasks: DayTaskView[] = [
  { slot: 1, title: "Fix ABC database", targetPomodoros: 4, completedPomodoros: 2, isDone: false, feasibility: "yes", feasibilityNote: "Fits the shift with room to spare." },
  { slot: 2, title: "Review CPC codes", targetPomodoros: 3, completedPomodoros: 3, isDone: true, feasibility: "yes", feasibilityNote: null },
  { slot: 3, title: "Slack with Kevin", targetPomodoros: 1, completedPomodoros: 0, isDone: false, feasibility: "warning", feasibilityNote: "Context switch after a long block." },
  { slot: 4, title: "Clean temp files", targetPomodoros: null, completedPomodoros: 0, isDone: false, feasibility: null, feasibilityNote: null },
  { slot: 5, title: "", targetPomodoros: null, completedPomodoros: 0, isDone: false, feasibility: null, feasibilityNote: null },
];

export const sampleQuote = {
  text: "Do the hard jobs first. The easy jobs will take care of themselves.",
  author: "Dale Carnegie",
};
